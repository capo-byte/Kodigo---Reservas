import Fastify from 'fastify';
import type { FastifyRequest } from 'fastify';
import rawBody from 'fastify-raw-body';
import type { Pool, PoolClient } from 'pg';
import Stripe from 'stripe';
import { z } from 'zod';
import { availability, authorize, HttpError, inBranch, occupy, once, requireSlot } from './booking.js';
import type { Scope } from './booking.js';
import { registerPayments } from './payments.js';


const uuid = z.uuid();
const date = z.iso.date();
const start = z.iso.datetime({ offset: true });
const name = z.string().trim().min(1).max(100);
const paymentBody = z.object({
  reference: z.string().trim().min(1).max(128),
  recipient: z.enum(['branch', 'platform']),
  status: z.enum(['pending', 'failed', 'paid']),
  amountMinor: z.number().int().positive(),
  method: z.enum(['external', 'cash']),
}).strict();
const appointmentParams = z.object({ businessId: uuid, branchId: uuid, appointmentId: uuid });

function input<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new HttpError(400, result.error.issues.map(issue => issue.path.join('.') || 'datos').join(', ') + ': valor inválido');
  return result.data;
}

function key(request: FastifyRequest) {
  return input(z.string().min(16).max(128).regex(/^[a-zA-Z0-9_-]+$/), request.headers['idempotency-key']);
}

async function appointment(db: PoolClient, scope: Scope, appointmentId: string) {
  const { rows: [row] } = await db.query(
    'SELECT id, status, starts_at, expires_at, rescheduled, price_minor FROM appointments WHERE business_id=$1 AND branch_id=$2 AND id=$3',
    [...scope, appointmentId],
  );
  if (!row) throw new HttpError(404, 'Cita no encontrada');
  return row;
}

export function makeApp(pool: Pool) {
  const app = Fastify({ logger: false, bodyLimit: 16_384 });
  app.register(rawBody, { field: 'rawBody', global: false, encoding: false, runFirst: true });
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) return reply.code(error.statusCode).send({ error: error.message });
    if (error instanceof RangeError) return reply.code(400).send({ error: 'Fecha inválida' });
    request.log.error(error);
    const status = (error as { statusCode?: number }).statusCode;
    return reply.code(status && status < 500 ? status : 500).send({ error: 'No se pudo procesar la solicitud' });
  });

  const publicPath = '/negocios/:slug/sucursales/:branchId';
  async function publicScope(request: FastifyRequest): Promise<Scope> {
    const params = input(z.object({ slug: z.string().min(1).max(100), branchId: uuid }), request.params);
    const { rows: [branch] } = await pool.query(
      'SELECT s.business_id FROM branches s JOIN businesses b ON b.id=s.business_id WHERE b.slug=$1 AND s.id=$2',
      [params.slug, params.branchId],
    );
    if (!branch) throw new HttpError(404, 'Sucursal no encontrada');
    return [branch.business_id, params.branchId];
  }

  async function service(db: Pool | PoolClient, scope: Scope, serviceId: string) {
    const { rows: [activeService] } = await db.query(
      'SELECT price_minor FROM services WHERE business_id=$1 AND branch_id=$2 AND id=$3 AND active',
      [...scope, serviceId],
    );
    if (!activeService) throw new HttpError(404, 'Servicio no encontrado');
    return activeService;
  }

  app.get(publicPath + '/disponibilidad', async request => {
    const scope = await publicScope(request);
    const query = input(z.object({ date, serviceId: uuid }).strict(), request.query);
    await service(pool, scope, query.serviceId);
    const { rows: [{ now }] } = await pool.query<{ now: Date }>('SELECT clock_timestamp() AS now');
    return { slots: await availability(pool, scope, query.date, now) };
  });

  app.post(publicPath + '/reservas', async (request, reply) => {
    const scope = await publicScope(request);
    const body = input(z.object({
      firstName: name, lastName: name, serviceId: uuid, startsAt: start,
      paymentMode: z.enum(['online', 'in_person']).default('in_person'),
    }).strict(), request.body);
    const idempotencyKey = key(request);
    const result = await inBranch(pool, scope, (db, now) =>
      once(db, scope, 'public', 'reserve', idempotencyKey, body, async () => {
        const { price_minor: price } = await service(db, scope, body.serviceId);
        const startsAt = await requireSlot(db, scope, body.startsAt, now);
        if (price === '0' && body.paymentMode === 'online') throw new HttpError(409, 'El servicio no requiere pago');
        const expiresAt = body.paymentMode === 'online' ? new Date(+now + 900_000) : null;
        const { rows: [created] } = await db.query(
          `INSERT INTO appointments
             (business_id,branch_id,service_id,first_name,last_name,starts_at,status,expires_at,price_minor)
           VALUES ($1,$2,$3,$4,$5,$6,'confirmed',$7,$8)
           RETURNING id,status,starts_at,expires_at`,
          [...scope, body.serviceId, body.firstName, body.lastName, startsAt, expiresAt, price],
        );
        await occupy(db, scope, created.id, startsAt);
        return created;
      }));
    return reply.code(201).send(result);
  });

  const privateBranch = '/admin/negocios/:businessId/sucursales/:branchId';
  const privatePath = privateBranch + '/reservas/:appointmentId';
  function params(request: FastifyRequest) {
    const { businessId, branchId, appointmentId } = input(appointmentParams, request.params);
    return { scope: [businessId, branchId] as Scope, appointmentId };
  }

  app.get(privateBranch + '/agenda', async request => {
    const { businessId, branchId } = input(appointmentParams.omit({ appointmentId: true }), request.params);
    const { date: day } = input(z.object({ date }).strict(), request.query);
    const scope: Scope = [businessId, branchId];
    return inBranch(pool, scope, async db => {
      await authorize(db, scope, request.headers.authorization, ['owner', 'admin', 'receptionist', 'employee', 'platform']);
      const { rows } = await db.query(
        `SELECT id, first_name, last_name, service_id, starts_at, status
         FROM appointments WHERE business_id=$1 AND branch_id=$2
           AND starts_at >= ($3::date + time '06:00') AT TIME ZONE 'UTC'
           AND starts_at < (($3::date + 1) + time '06:00') AT TIME ZONE 'UTC'
         ORDER BY starts_at, id`, [...scope, day],
      );
      return { appointments: rows };
    });
  });

  app.patch(privateBranch + '/servicios/:serviceId/precio', async request => {
    const { businessId, branchId, serviceId } = input(
      z.object({ businessId: uuid, branchId: uuid, serviceId: uuid }), request.params,
    );
    const { priceMinor } = input(z.object({ priceMinor: z.number().int().nonnegative() }).strict(), request.body);
    const scope: Scope = [businessId, branchId];
    return inBranch(pool, scope, async db => {
      await authorize(db, scope, request.headers.authorization, ['owner', 'admin', 'receptionist', 'platform']);
      const { rows: [updated] } = await db.query(
        `UPDATE services SET price_minor=$4 WHERE business_id=$1 AND branch_id=$2 AND id=$3
         RETURNING id, price_minor`, [...scope, serviceId, priceMinor],
      );
      if (!updated) throw new HttpError(404, 'Servicio no encontrado');
      return updated;
    });
  });

  app.get(privateBranch + '/ingresos', async request => {
    const { businessId, branchId } = input(appointmentParams.omit({ appointmentId: true }), request.params);
    const scope: Scope = [businessId, branchId];
    return inBranch(pool, scope, async db => {
      await authorize(db, scope, request.headers.authorization, ['owner', 'admin', 'receptionist', 'platform']);
      const { rows } = await db.query(
        `SELECT p.recipient, sum(p.amount_minor)::text AS gross_minor,
                COALESCE(sum(p.amount_minor) FILTER (WHERE r.issued_by IS NOT NULL), 0)::text AS refunded_minor
         FROM payments p LEFT JOIN refunds r
           ON (p.business_id,p.branch_id,p.id)=(r.business_id,r.branch_id,r.payment_id)
         WHERE p.business_id=$1 AND p.branch_id=$2 AND p.status='paid' GROUP BY p.recipient ORDER BY p.recipient`,
        scope,
      );
      return { income: rows };
    });
  });

  app.get(privateBranch + '/pagos/revisiones', async request => {
    const { businessId, branchId } = input(appointmentParams.omit({ appointmentId: true }), request.params);
    const scope: Scope = [businessId, branchId];
    return inBranch(pool, scope, async db => {
      await authorize(db, scope, request.headers.authorization, ['owner', 'admin', 'receptionist', 'platform']);
      const { rows } = await db.query(
        `SELECT r.id,r.reason,r.created_at,p.id AS payment_id,p.appointment_id,p.reference,p.amount_minor
         FROM payment_reviews r JOIN payments p ON (r.business_id,r.branch_id,r.payment_id)=(p.business_id,p.branch_id,p.id)
         WHERE r.business_id=$1 AND r.branch_id=$2 AND r.resolved_at IS NULL ORDER BY r.created_at,r.id`, scope,
      );
      return { reviews: rows };
    });
  });

  app.post(privatePath + '/reprogramacion', async request => {
    const { scope, appointmentId } = params(request);
    const body = input(z.object({ startsAt: start }).strict(), request.body);
    const idempotencyKey = key(request);
    return inBranch(pool, scope, async (db, now) => {
      const actor = await authorize(db, scope, request.headers.authorization);
      return once(db, scope, actor, 'reschedule', idempotencyKey, { appointmentId, ...body }, async () => {
        const current = await appointment(db, scope, appointmentId);
        if (current.status !== 'confirmed' || current.rescheduled || +current.starts_at <= +now) {
          throw new HttpError(409, 'La cita no se puede reprogramar');
        }
        const newStart = new Date(body.startsAt);
        if (+newStart <= +current.starts_at || +newStart > +current.starts_at + 172_800_000) {
          throw new HttpError(409, 'La nueva hora debe estar dentro de los dos días posteriores a la cita original');
        }
        await requireSlot(db, scope, body.startsAt, now);
        await db.query('DELETE FROM occupations WHERE business_id=$1 AND branch_id=$2 AND appointment_id=$3', [...scope, appointmentId]);
        const { rows: [updated] } = await db.query(
          `UPDATE appointments SET starts_at=$4, rescheduled=true WHERE business_id=$1 AND branch_id=$2 AND id=$3
           RETURNING id,status,starts_at,expires_at,rescheduled`, [...scope, appointmentId, newStart],
        );
        await occupy(db, scope, appointmentId, newStart);
        return updated;
      });
    });
  });

  for (const transition of [
    { path: 'inasistencia', status: 'no_show' },
    { path: 'completar', status: 'completed' },
  ]) {
    app.post(privatePath + '/' + transition.path, async request => {
      const { scope, appointmentId } = params(request);
      const idempotencyKey = key(request);
      return inBranch(pool, scope, async (db, now) => {
        const actor = await authorize(db, scope, request.headers.authorization, transition.status === 'completed'
          ? ['owner', 'admin', 'receptionist', 'employee', 'platform'] : undefined);
        return once(db, scope, actor, transition.path, idempotencyKey, { appointmentId }, async () => {
          const current = await appointment(db, scope, appointmentId);
          if (current.status !== 'confirmed') throw new HttpError(409, 'La cita debe estar confirmada');
          if (transition.status === 'completed' && (+current.starts_at + 1_200_000 > +now || current.expires_at)) {
            throw new HttpError(409, 'La cita aún no se puede completar');
          }
          await db.query(
            'UPDATE appointments SET status=$4, expires_at=NULL WHERE business_id=$1 AND branch_id=$2 AND id=$3',
            [...scope, appointmentId, transition.status],
          );
          if (transition.status === 'no_show') {
            await db.query('DELETE FROM occupations WHERE business_id=$1 AND branch_id=$2 AND appointment_id=$3', [...scope, appointmentId]);
          }
          return { id: appointmentId, status: transition.status };
        });
      });
    });
  }

  app.post(privatePath + '/pagos', async request => {
    const { scope, appointmentId } = params(request);
    const body = input(paymentBody, request.body);
    const idempotencyKey = key(request);
    return inBranch(pool, scope, async db => {
      const actor = await authorize(db, scope, request.headers.authorization, ['owner', 'admin', 'receptionist', 'platform']);
      return once(db, scope, actor, 'record-payment', idempotencyKey, { appointmentId, ...body }, async () => {
        const current = await appointment(db, scope, appointmentId);
        if (BigInt(current.price_minor) !== BigInt(body.amountMinor)) {
          throw new HttpError(409, 'El importe no coincide con el precio de la cita');
        }
        const { rows: [existing] } = await db.query(
          `SELECT id, appointment_id, status, amount_minor, requires_review FROM payments
           WHERE business_id=$1 AND branch_id=$2 AND recipient=$3 AND reference=$4`,
          [...scope, body.recipient, body.reference],
        );
        if (existing && (existing.appointment_id !== appointmentId || Number(existing.amount_minor) !== body.amountMinor)) {
          throw new HttpError(409, 'Referencia de pago en uso');
        }
        if (existing?.status === 'paid' && body.status !== 'paid') {
          return { id: existing.id, status: 'paid', requires_review: existing.requires_review };
        }
        const previousPaid = await db.query(
          "SELECT 1 FROM payments WHERE business_id=$1 AND branch_id=$2 AND appointment_id=$3 AND status='paid' LIMIT 1",
          [...scope, appointmentId],
        );
        const reasons: string[] = [];
        if (body.status !== 'paid') reasons.push(body.status);
        if (body.status === 'paid' && previousPaid.rowCount) reasons.push('duplicate');
        if (body.status === 'paid' && ['expired', 'cancelled', 'no_show'].includes(current.status)) reasons.push('late');

        const { rows: [payment] } = await db.query(
          `INSERT INTO payments (business_id,branch_id,appointment_id,reference,status,recipient,amount_minor,method,requires_review)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (business_id,branch_id,recipient,reference) DO UPDATE
           SET status=EXCLUDED.status, method=EXCLUDED.method, requires_review=EXCLUDED.requires_review
           RETURNING id,status,requires_review`,
          [...scope, appointmentId, body.reference, body.status, body.recipient, body.amountMinor, body.method, reasons.length > 0],
        );
        for (const reason of reasons) {
          await db.query('INSERT INTO payment_reviews (business_id,branch_id,payment_id,reason) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
            [...scope, payment.id, reason]);
        }
        if (body.status === 'paid' && reasons.length === 0 && ['pending', 'confirmed'].includes(current.status)) {
          await db.query(
            "UPDATE appointments SET status='confirmed', expires_at=NULL WHERE business_id=$1 AND branch_id=$2 AND id=$3",
            [...scope, appointmentId],
          );
        }
        if (body.status === 'paid') {
          await db.query(
            `UPDATE payment_reviews SET resolved_at=clock_timestamp()
             WHERE business_id=$1 AND branch_id=$2 AND payment_id=$3
               AND reason IN ('pending','failed') AND resolved_at IS NULL`,
            [...scope, payment.id],
          );
        }
        return payment;
      });
    });
  });

  const refundPath = privateBranch + '/pagos/:paymentId/reembolso';
  for (const step of ['autorizar', 'emitir'] as const) {
    app.post(refundPath + '/' + step, async request => {
      const { businessId, branchId, paymentId } = input(z.object({ businessId: uuid, branchId: uuid, paymentId: uuid }), request.params);
      const scope: Scope = [businessId, branchId];
      const idempotencyKey = key(request);
      return inBranch(pool, scope, async db => {
        const actor = await authorize(db, scope, request.headers.authorization, step === 'autorizar' ? ['admin'] : ['receptionist']);
        return once(db, scope, actor, step, idempotencyKey, { paymentId }, async () => {
          const { rows: [refund] } = step === 'autorizar'
            ? await db.query(
              `INSERT INTO refunds (business_id,branch_id,payment_id,authorized_by)
               SELECT business_id,branch_id,id,$4 FROM payments WHERE business_id=$1 AND branch_id=$2 AND id=$3 AND status='paid'
               ON CONFLICT (business_id,branch_id,payment_id) DO UPDATE SET payment_id=EXCLUDED.payment_id
               RETURNING id, authorized_by, issued_by`, [...scope, paymentId, actor])
            : await db.query(
              `UPDATE refunds SET issued_by=COALESCE(issued_by,$4)
               WHERE business_id=$1 AND branch_id=$2 AND payment_id=$3 RETURNING id, authorized_by, issued_by`,
              [...scope, paymentId, actor]);
          if (!refund) throw new HttpError(409, 'Se requiere un pago registrado y una autorización para emitir el reembolso');
          if (step === 'emitir') {
            await db.query(
              `UPDATE payment_reviews SET resolved_at=clock_timestamp()
               WHERE business_id=$1 AND branch_id=$2 AND payment_id=$3
                 AND reason IN ('late','duplicate') AND resolved_at IS NULL`, [...scope, paymentId],
            );
          }
          return refund;
        });
      });
    });
  }

  app.after(() => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2026-11-18.endive' as Stripe.LatestApiVersion });
    registerPayments(app, pool, stripe);
  });

  return app;
}
