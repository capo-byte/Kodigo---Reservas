import { createHash } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { localDay, slots } from './availability.js';

export class HttpError extends Error {
  constructor(readonly statusCode: number, message: string) {
    super(message);
  }
}

export type Scope = [businessId: string, branchId: string];
type Role = 'owner' | 'admin' | 'receptionist' | 'employee' | 'member' | 'platform';
type Transaction<T> = (db: PoolClient, now: Date) => Promise<T>;

export async function inBranch<T>(pool: Pool, scope: Scope, action: Transaction<T>): Promise<T> {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const branch = await db.query('SELECT id FROM branches WHERE business_id=$1 AND id=$2 FOR UPDATE', scope);
    if (!branch.rowCount) throw new HttpError(404, 'Sucursal no encontrada');
    const { rows: [{ now }] } = await db.query<{ now: Date }>('SELECT clock_timestamp() AS now');
    const expiry = await db.query(
      `UPDATE appointments SET status='expired', expires_at=NULL
       WHERE business_id=$1 AND branch_id=$2 AND expires_at <= $3 RETURNING id`,
      [...scope, now],
    );
    const expiredIds = expiry.rows.map(row => row.id);
    if (expiredIds.length) {
      await db.query('DELETE FROM occupations WHERE business_id=$1 AND branch_id=$2 AND appointment_id=ANY($3::uuid[])',
        [...scope, expiredIds]);
    }
    const result = await action(db, now);
    await db.query('COMMIT');
    return result;
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    db.release();
  }
}

export async function authorize(db: PoolClient, scope: Scope, authorization: string | undefined, roles?: Role[]) {
  const token = /^Bearer ([a-zA-Z0-9_-]{43,128})$/.exec(authorization ?? '')?.[1];
  if (!token) throw new HttpError(401, 'Se requiere un token válido');
  const { rows: [actor] } = await db.query<{ id: string; role: Role | null }>(
    `SELECT u.id, CASE WHEN u.platform_admin THEN 'platform' ELSE r.role END AS role
     FROM access_tokens t JOIN users u ON u.id=t.user_id
     LEFT JOIN memberships m ON m.business_id=$1 AND m.user_id=u.id AND m.active
     LEFT JOIN branch_roles r ON r.business_id=m.business_id AND r.user_id=m.user_id AND r.branch_id=$2
     WHERE t.digest=$3 AND t.expires_at > clock_timestamp()`,
    [...scope, createHash('sha256').update(token).digest()],
  );
  if (!actor) throw new HttpError(401, 'Se requiere un token válido');
  if (!actor.role || (roles && !roles.includes(actor.role))) throw new HttpError(403, 'Permiso insuficiente');
  return actor.id;
}

export async function once<T>(db: PoolClient, scope: Scope, actor: string, operation: string,
  key: string, payload: unknown, action: () => Promise<T>): Promise<T> {
  const fingerprint = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const identity = [...scope, actor, operation, key];
  const { rows: [previous] } = await db.query(
    `SELECT fingerprint, response FROM idempotency_operations
     WHERE business_id=$1 AND branch_id=$2 AND actor=$3 AND operation=$4 AND key=$5`, identity,
  );
  if (previous) {
    if (previous.fingerprint !== fingerprint) throw new HttpError(409, 'Clave de idempotencia reutilizada con otros datos');
    return previous.response as T;
  }
  const result = await action();
  await db.query(
    'INSERT INTO idempotency_operations VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [...identity, fingerprint, JSON.stringify(result)],
  );
  return result;
}

export async function availability(db: Pool | PoolClient, scope: Scope, date: string, now: Date) {
  const day = localDay(date);
  const bounds = [new Date(+day + 6 * 3_600_000), new Date(+day + 30 * 3_600_000)];
  const { rows: [data] } = await db.query(
    `SELECT
       (SELECT row_to_json(s) FROM schedules s
        WHERE s.business_id=$1 AND s.branch_id=$2 AND s.weekday=$3) AS schedule,
       (SELECT json_agg(b) FROM breaks b
        WHERE b.business_id=$1 AND b.branch_id=$2 AND b.weekday=$3) AS breaks,
       (SELECT array_agg(extract(epoch FROM o.starts_at)*1000) FROM occupations o
        JOIN appointments a ON (a.business_id,a.branch_id,a.id)=(o.business_id,o.branch_id,o.appointment_id)
        WHERE o.business_id=$1 AND o.branch_id=$2 AND o.starts_at >= $4 AND o.starts_at < $5
          AND (a.expires_at IS NULL OR a.expires_at > $6)) AS occupied`,
    [...scope, day.getUTCDay(), ...bounds, now],
  );
  return slots(day, now, new Set((data.occupied ?? []).map(Number)), data.breaks ?? [], data.schedule ?? undefined);
}

export async function requireSlot(db: PoolClient, scope: Scope, startsAt: string, now: Date) {
  const start = new Date(startsAt);
  const date = new Date(+start - 6 * 3_600_000).toISOString().slice(0, 10);
  const available = await availability(db, scope, date, now);
  if (!available.some(slot => slot.startsAt === start.toISOString())) throw new HttpError(409, 'Espacio no disponible');
  return start;
}

export async function occupy(db: PoolClient, scope: Scope, appointmentId: string, start: Date) {
  const inserted = await db.query(
    'INSERT INTO occupations VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
    [...scope, start, appointmentId],
  );
  if (!inserted.rowCount) throw new HttpError(409, 'Espacio no disponible');
}
