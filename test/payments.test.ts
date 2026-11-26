import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { Pool } from 'pg';
import Stripe from 'stripe';
import { makeApp } from '../src/app.js';

const connectionString = process.env.TEST_DATABASE_URL;

test('webhooks y reembolsos Stripe con PostgreSQL', { skip: !connectionString }, async t => {
  const schema = 'test_' + randomBytes(8).toString('hex');
  const root = new Pool({ connectionString });
  await root.query('CREATE SCHEMA ' + schema);
  const pool = new Pool({ connectionString, options: '-c search_path=' + schema + ',public' });
  const stripe = new Stripe('sk_test_dummy');
  const secret = 'whsec_test_payments';
  const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  const keys: string[] = [];
  let failOnce = true;
  let refundStatus = 'succeeded';
  Object.assign(stripe.refunds, {
    create: async (_params: unknown, options: { idempotencyKey: string }) => {
      keys.push(options.idempotencyKey);
      if (failOnce) { failOnce = false; throw new Error('Error simulado de red'); }
      return { id: 're_' + keys.length, status: refundStatus };
    },
    retrieve: async (id: string) => ({ id, status: refundStatus }),
  });
  const app = makeApp(pool, stripe);
  t.after(async () => {
    if (previousSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
    await app.close();
    await pool.end();
    await root.query('DROP SCHEMA IF EXISTS ' + schema + ' CASCADE');
    await root.end();
  });
  for (const migration of ['001_core.sql', '002_anthony_stripe.sql', '003_stripe_refunds.sql']) {
    await pool.query(await readFile(new URL('../db/migrations/' + migration, import.meta.url), 'utf8'));
  }
  const business = randomUUID();
  const branch = randomUUID();
  const service = randomUUID();
  const admin = randomUUID();
  const receptionist = randomUUID();
  await pool.query("INSERT INTO businesses VALUES ($1,'mibarberia503')", [business]);
  await pool.query("INSERT INTO branches VALUES ($1,$2,'Centro')", [business, branch]);
  await pool.query("INSERT INTO services VALUES ($1,$2,$3,'Corte',1000)", [business, branch, service]);
  await pool.query('INSERT INTO users (id) VALUES ($1),($2)', [admin, receptionist]);
  await pool.query('INSERT INTO memberships (business_id,user_id) VALUES ($1,$2),($1,$3)', [business, admin, receptionist]);
  await pool.query("INSERT INTO branch_roles VALUES ($1,$2,$3,'admin'),($1,$2,$4,'receptionist')", [business, branch, admin, receptionist]);
  async function token(user: string) {
    const value = randomBytes(32).toString('base64url');
    await pool.query("INSERT INTO access_tokens VALUES ($1,$2,now()+interval '1 day')",
      [createHash('sha256').update(value).digest(), user]);
    return 'Bearer ' + value;
  }
  const adminToken = await token(admin);
  const receptionistToken = await token(receptionist);
  async function appointment(pi: string, expired = false) {
    const id = randomUUID();
    await pool.query(
      `INSERT INTO appointments (business_id,branch_id,id,service_id,first_name,last_name,price_minor,starts_at,status,expires_at)
       VALUES ($1,$2,$3,$4,'Ana','Pérez',1000,date_trunc('hour',now())+interval '1 day','confirmed',
         clock_timestamp()+($5::integer * interval '1 minute'))`, [business, branch, id, service, expired ? -1 : 15]);
    await pool.query(
      `INSERT INTO stripe_payment_intents (business_id,branch_id,appointment_id,stripe_pi_id,amount_minor,currency,status,client_secret)
       VALUES ($1,$2,$3,$4,1000,'usd','requires_payment_method','secret')`, [business, branch, id, pi]);
    return id;
  }
  function webhook(id: string, pi: string, appointmentId: string, amount = 1000, currency = 'usd', branchId = branch) {
    const payload = JSON.stringify({ id, type: 'payment_intent.succeeded', data: { object: {
      id: pi, status: 'succeeded', amount, amount_received: amount, currency,
      metadata: { businessId: business, branchId, appointmentId },
    } } });
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
    return app.inject({ method: 'POST', url: '/webhooks/stripe', payload,
      headers: { 'content-type': 'application/json', 'stripe-signature': signature } });
  }
  const goodId = await appointment('pi_good');
  const [first, retry] = await Promise.all([
    webhook('evt_good', 'pi_good', goodId), webhook('evt_good', 'pi_good', goodId),
  ]);
  assert.equal(first.statusCode, 200, first.body);
  assert.equal(retry.statusCode, 200, retry.body);
  assert.equal((await pool.query('SELECT count(*) FROM payments WHERE appointment_id=$1', [goodId])).rows[0].count, '1');
  assert.equal((await pool.query('SELECT expires_at FROM appointments WHERE id=$1', [goodId])).rows[0].expires_at, null);

  const retryId = await appointment('pi_retry');
  await pool.query("UPDATE stripe_payment_intents SET currency='eur' WHERE stripe_pi_id='pi_retry'");
  assert.equal((await webhook('evt_retry', 'pi_retry', retryId)).statusCode, 409);
  assert.equal((await pool.query("SELECT status FROM stripe_webhook_events WHERE event_id='evt_retry'")).rows[0].status, 'failed');
  await pool.query("UPDATE stripe_payment_intents SET currency='usd' WHERE stripe_pi_id='pi_retry'");
  const retried = await webhook('evt_retry', 'pi_retry', retryId);
  assert.equal(retried.statusCode, 200, retried.body);
  assert.equal((await pool.query("SELECT status FROM stripe_webhook_events WHERE event_id='evt_retry'")).rows[0].status, 'processed');
  assert.equal((await webhook('evt_wrong_amount', 'pi_retry', retryId, 999)).statusCode, 409);
  assert.equal((await webhook('evt_wrong_scope', 'pi_retry', goodId)).statusCode, 409);
  assert.equal((await webhook('evt_wrong_currency', 'pi_retry', retryId, 1000, 'eur')).statusCode, 409);

  const lateId = await appointment('pi_late', true);
  assert.equal((await webhook('evt_late', 'pi_late', lateId)).statusCode, 200);
  assert.equal((await pool.query('SELECT status FROM appointments WHERE id=$1', [lateId])).rows[0].status, 'expired');
  const late = (await pool.query("SELECT p.id,p.requires_review,r.reason FROM payments p JOIN payment_reviews r ON r.payment_id=p.id WHERE p.appointment_id=$1", [lateId])).rows[0];
  assert.equal(late.requires_review, true);
  assert.equal(late.reason, 'late');

  const duplicateId = await appointment('pi_duplicate');
  await pool.query(`INSERT INTO payments (business_id,branch_id,appointment_id,reference,status,recipient,amount_minor,method,requires_review)
    VALUES ($1,$2,$3,'cash-1','paid','branch',1000,'cash',false)`, [business, branch, duplicateId]);
  assert.equal((await webhook('evt_duplicate', 'pi_duplicate', duplicateId)).statusCode, 200);
  assert.equal((await pool.query("SELECT reason FROM payment_reviews r JOIN payments p ON p.id=r.payment_id WHERE p.reference='pi_duplicate'")).rows[0].reason, 'duplicate');

  const pendingId = await appointment('pi_pending');
  const pending = (await pool.query(`INSERT INTO payments (business_id,branch_id,appointment_id,reference,status,recipient,amount_minor,method,requires_review)
    VALUES ($1,$2,$3,'pi_pending','pending','branch',1000,'external',true) RETURNING id`, [business, branch, pendingId])).rows[0];
  await pool.query("INSERT INTO payment_reviews (business_id,branch_id,payment_id,reason) VALUES ($1,$2,$3,'pending')", [business, branch, pending.id]);
  assert.equal((await webhook('evt_pending', 'pi_pending', pendingId)).statusCode, 200);
  const settled = (await pool.query('SELECT status,requires_review FROM payments WHERE id=$1', [pending.id])).rows[0];
  assert.equal(settled.status, 'paid');
  assert.equal(settled.requires_review, false);
  assert.ok((await pool.query('SELECT resolved_at FROM payment_reviews WHERE payment_id=$1', [pending.id])).rows[0].resolved_at);

  const base = `/admin/negocios/${business}/sucursales/${branch}/pagos/${late.id}/reembolso`;
  const write = (step: string, authorization: string, key = randomUUID()) => app.inject({ method: 'POST', url: base + '/' + step,
    headers: { authorization, 'idempotency-key': key } });
  assert.equal((await write('autorizar', receptionistToken)).statusCode, 403);
  assert.equal((await write('autorizar', adminToken)).statusCode, 200);
  const refundKey = randomUUID();
  assert.equal((await write('emitir', receptionistToken, refundKey)).statusCode, 500);
  const [issued, repeated] = await Promise.all([write('emitir', receptionistToken, refundKey), write('emitir', receptionistToken, refundKey)]);
  assert.equal(issued.statusCode, 200, issued.body);
  assert.deepEqual(issued.json(), repeated.json());
  assert.equal(issued.json().status, 'succeeded');
  assert.equal(issued.json().stripe_refund_id, 're_2');
  assert.equal(keys.length, 2);
  assert.equal(keys[0], keys[1]);
  assert.ok((await pool.query('SELECT resolved_at FROM payment_reviews WHERE payment_id=$1', [late.id])).rows[0].resolved_at);

  const duplicatePayment = (await pool.query("SELECT id FROM payments WHERE reference='pi_duplicate'")).rows[0].id;
  const duplicateBase = `/admin/negocios/${business}/sucursales/${branch}/pagos/${duplicatePayment}/reembolso`;
  const refundRequest = (step: string, authorization: string) => app.inject({ method: 'POST', url: duplicateBase + '/' + step,
    headers: { authorization, 'idempotency-key': randomUUID() } });
  assert.equal((await refundRequest('autorizar', adminToken)).statusCode, 200);
  refundStatus = 'pending';
  const pendingRefund = await refundRequest('emitir', receptionistToken);
  assert.equal(pendingRefund.json().status, 'pending');
  assert.equal(pendingRefund.json().issued_by, null);
  assert.equal((await pool.query('SELECT resolved_at FROM payment_reviews WHERE payment_id=$1', [duplicatePayment])).rows[0].resolved_at, null);
  refundStatus = 'succeeded';
  const settledRefund = await refundRequest('emitir', receptionistToken);
  assert.equal(settledRefund.json().status, 'succeeded');
  assert.equal(settledRefund.json().stripe_refund_id, pendingRefund.json().stripe_refund_id);
  assert.equal(keys.length, 3);
});
