import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { Pool } from 'pg';
import { makeApp } from '../src/app.js';

const connectionString = process.env.TEST_DATABASE_URL;

test('reservas, concurrencia, pagos y aislamiento con PostgreSQL', { skip: !connectionString }, async t => {
  const schema = 'test_' + randomBytes(8).toString('hex');
  const root = new Pool({ connectionString });
  t.after(async () => {
    try {
      await root.query('DROP SCHEMA IF EXISTS ' + schema + ' CASCADE');
    } finally {
      await root.end();
    }
  });
  await root.query('CREATE SCHEMA ' + schema);
  const pool = new Pool({ connectionString, options: '-c search_path=' + schema + ',public' });
  const app = makeApp(pool);
  try {
    await pool.query(await readFile(new URL('../db/migrations/001_core.sql', import.meta.url), 'utf8'));
    await pool.query(await readFile(new URL('../db/migrations/002_anthony_stripe.sql', import.meta.url), 'utf8'));
    await pool.query(await readFile(new URL('../db/migrations/003_stripe_refunds.sql', import.meta.url), 'utf8'));
    const business = randomUUID();
    const otherBusiness = randomUUID();
    const branch = randomUUID();
    const sister = randomUUID();
    const otherBranch = randomUUID();
    const service = randomUUID();
    const employee = randomUUID();
    const admin = randomUUID();
    const receptionist = randomUUID();
    const platform = randomUUID();
    await pool.query("INSERT INTO businesses VALUES ($1,'mibarberia503'),($2,'otro')", [business, otherBusiness]);
    await pool.query("INSERT INTO branches VALUES ($1,$2,'Centro'),($1,$3,'Norte'),($4,$5,'Sur')",
      [business, branch, sister, otherBusiness, otherBranch]);
    await pool.query("INSERT INTO services VALUES ($1,$2,$3,'Corte',1000),($1,$4,$3,'Corte',1000),($5,$6,$3,'Corte',1000)",
      [business, branch, service, sister, otherBusiness, otherBranch]);
    await pool.query('INSERT INTO users (id) VALUES ($1),($2),($3)', [employee, admin, receptionist]);
    await pool.query('INSERT INTO users VALUES ($1,true)', [platform]);
    await pool.query('INSERT INTO memberships (business_id,user_id) VALUES ($1,$2),($1,$3),($1,$4),($5,$2)',
      [business, employee, admin, receptionist, otherBusiness]);
    await pool.query(
      "INSERT INTO branch_roles VALUES ($1,$2,$3,'employee'),($1,$2,$4,'admin'),($1,$2,$5,'receptionist'),($6,$7,$3,'member')",
      [business, branch, employee, admin, receptionist, otherBusiness, otherBranch],
    );
    async function token(user: string) {
      const secret = randomBytes(32).toString('base64url');
      await pool.query("INSERT INTO access_tokens VALUES ($1,$2,now()+interval '1 day')",
        [createHash('sha256').update(secret).digest(), user]);
      return 'Bearer ' + secret;
    }
    const employeeToken = await token(employee);
    const adminToken = await token(admin);
    const receptionistToken = await token(receptionist);
    const platformToken = await token(platform);
    const { rows: [{ day }] } = await pool.query<{ day: string }>(
      "SELECT to_char(date_trunc('week', (now() AT TIME ZONE 'UTC') - interval '6 hours') + interval '7 days', 'YYYY-MM-DD') AS day",
    );
    const publicUrl = '/negocios/mibarberia503/sucursales/';
    const adminUrl = '/admin/negocios/' + business + '/sucursales/';
    const getSlots = (branchId: string) => app.inject(publicUrl + branchId + '/disponibilidad?date=' + day + '&serviceId=' + service);
    const offered = (await getSlots(branch)).json().slots;
    const [first, second, third, fourth] = offered;
    assert.equal(first.time, '08:00');
    const reserve = (branchId: string, startsAt: string, idempotencyKey = randomUUID(), paymentMode = 'in_person') =>
      app.inject({ method: 'POST', url: publicUrl + branchId + '/reservas',
        headers: { 'idempotency-key': idempotencyKey },
        payload: { firstName: 'Ana', lastName: 'Pérez', serviceId: service, startsAt, paymentMode } });
    const write = (path: string, authorization: string, payload?: object, idempotencyKey = randomUUID()) =>
      app.inject({ method: 'POST', url: adminUrl + branch + path,
        headers: { authorization, 'idempotency-key': idempotencyKey }, payload });

    const retry = randomUUID();
    const [accepted, clash, replay] = await Promise.all([
      reserve(branch, first.startsAt, retry), reserve(branch, first.startsAt), reserve(branch, first.startsAt, retry),
    ]);
    // Either distinct request may win. Both copies of the same winning key must agree.
    assert.equal(accepted.statusCode, replay.statusCode);
    assert.deepEqual([accepted.statusCode, clash.statusCode].sort(), [201, 409]);
    const winner = accepted.statusCode === 201 ? accepted : clash;
    if (accepted.statusCode === 201) assert.deepEqual(accepted.json(), replay.json());
    const id = winner.json().id;
    const path = '/reservas/' + id;
    assert.equal((await getSlots(branch)).json().slots[0].time, second.time);
    const sisterReservation = await reserve(sister, first.startsAt);
    assert.equal(sisterReservation.statusCode, 201);
    assert.equal((await getSlots(otherBranch)).statusCode, 404);
    const captured = await pool.query('SELECT count(*) AS count FROM occupations WHERE business_id=$1 AND branch_id=$2', [business, branch]);
    assert.equal(captured.rows[0].count, '1');

    assert.equal((await app.inject({ url: adminUrl + sister + '/agenda?date=' + day,
      headers: { authorization: employeeToken } })).statusCode, 403);
    assert.equal((await app.inject({ url: adminUrl + sister + '/agenda?date=' + day,
      headers: { authorization: platformToken } })).json().appointments[0].id, sisterReservation.json().id);
    assert.equal((await write('/reservas/' + sisterReservation.json().id + '/inasistencia', employeeToken)).statusCode, 404);
    assert.equal((await app.inject({
      method: 'POST', url: adminUrl + sister + '/reservas/' + sisterReservation.json().id + '/inasistencia',
      headers: { authorization: employeeToken, 'idempotency-key': randomUUID() },
    })).statusCode, 403);
    assert.equal((await app.inject({
      url: '/admin/negocios/' + otherBusiness + '/sucursales/' + otherBranch + '/agenda?date=' + day,
      headers: { authorization: employeeToken },
    })).statusCode, 403);
    assert.equal((await app.inject({ url: adminUrl + branch + '/agenda?date=' + day,
      headers: { authorization: employeeToken } })).json().appointments[0].id, id);

    const { rows: [{ now: beforeHold }] } = await pool.query<{ now: Date }>('SELECT clock_timestamp() AS now');
    const held = await reserve(branch, second.startsAt, randomUUID(), 'online');
    const { rows: [{ now: afterHold }] } = await pool.query<{ now: Date }>('SELECT clock_timestamp() AS now');
    assert.equal(held.statusCode, 201, held.body);
    assert.equal(held.json().status, 'confirmed');
    const heldId = held.json().id;
    const holdStarted = Date.parse(held.json().expires_at) - 900_000;
    assert.ok(holdStarted >= +beforeHold && holdStarted <= +afterHold);
    assert.equal((await write(path + '/reprogramacion', employeeToken, { startsAt: second.startsAt })).statusCode, 409);
    assert.equal((await pool.query('SELECT starts_at FROM occupations WHERE appointment_id=$1', [id])).rows[0].starts_at.toISOString(), first.startsAt);
    const outsideReschedule = new Date(Date.parse(first.startsAt) + 3 * 86_400_000).toISOString();
    assert.equal((await write(path + '/reprogramacion', employeeToken, { startsAt: outsideReschedule })).statusCode, 409);
    assert.equal((await getSlots(branch)).json().slots[0].time, third.time);
    assert.equal((await write(path + '/reprogramacion', employeeToken, { startsAt: third.startsAt })).statusCode, 200);
    assert.equal((await write(path + '/reprogramacion', employeeToken, { startsAt: fourth.startsAt })).statusCode, 409);

    await pool.query("UPDATE appointments SET expires_at=clock_timestamp()-interval '1 second' WHERE id=$1", [heldId]);
    const payment = { reference: 'recibo-1', recipient: 'branch', status: 'paid', amountMinor: 1000, method: 'external' };
    const payKey = randomUUID();
    const [late, replacement] = await Promise.all([
      write('/reservas/' + heldId + '/pagos', receptionistToken, payment, payKey), reserve(branch, second.startsAt),
    ]);
    assert.equal(late.statusCode, 200, late.body);
    assert.equal(late.json().requires_review, true);
    assert.equal(replacement.statusCode, 201, replacement.body);
    assert.deepEqual((await write('/reservas/' + heldId + '/pagos', receptionistToken, payment, payKey)).json(), late.json());
    assert.equal((await pool.query('SELECT status FROM appointments WHERE id=$1', [heldId])).rows[0].status, 'expired');

    const refund = '/pagos/' + late.json().id + '/reembolso';
    assert.equal((await write(refund + '/autorizar', receptionistToken)).statusCode, 403);
    assert.equal((await write(refund + '/emitir', receptionistToken)).statusCode, 409);
    assert.equal((await write(refund + '/autorizar', adminToken)).statusCode, 200);
    const issued = await write(refund + '/emitir', receptionistToken);
    assert.equal(issued.statusCode, 200, issued.body);
    assert.deepEqual((await write(refund + '/emitir', receptionistToken)).json(), issued.json());
    assert.equal((await pool.query('SELECT count(*) AS count FROM refunds')).rows[0].count, '1');
    assert.equal((await pool.query('SELECT count(*) AS count FROM payments')).rows[0].count, '1');

    await pool.query('INSERT INTO schedules (business_id,branch_id,weekday,labor_open) VALUES ($1,$2,1,540)', [business, branch]);
    const agenda = (await app.inject({ url: adminUrl + branch + '/agenda?date=' + day,
      headers: { authorization: employeeToken } })).json().appointments;
    assert.equal(agenda.find((row: { id: string }) => row.id === id).starts_at, third.startsAt);
    assert.equal((await write(path + '/inasistencia', employeeToken)).statusCode, 200);
    assert.equal((await reserve(branch, third.startsAt)).statusCode, 201);
  } finally {
    await app.close();
    await pool.end();
  }
});
