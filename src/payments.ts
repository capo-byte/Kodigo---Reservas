import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import type Stripe from 'stripe';
import { z } from 'zod';
import { HttpError, inBranch } from './booking.js';
import type { Scope } from './booking.js';

const uuid = z.uuid();
const intentParamsSchema = z.object({ slug: z.string().min(1).max(100), branchId: uuid });
const intentBodySchema = z.object({ appointmentId: uuid }).strict();
const metadataSchema = z.object({ businessId: uuid, branchId: uuid, appointmentId: uuid });

function input<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new HttpError(400, result.error.issues.map(issue => issue.path.join('.') || 'datos').join(', ') + ': valor inválido');
  }
  return result.data;
}

export function registerPayments(app: FastifyInstance, pool: Pool, stripe: Stripe) {
  app.post('/negocios/:slug/sucursales/:branchId/pagos/intent', async (request, reply) => {
    const params = input(intentParamsSchema, request.params);
    const { appointmentId } = input(intentBodySchema, request.body);

    const { rows: [branch] } = await pool.query<{ business_id: string }>(
      'SELECT s.business_id FROM branches s JOIN businesses b ON b.id=s.business_id WHERE b.slug=$1 AND s.id=$2',
      [params.slug, params.branchId],
    );
    if (!branch) throw new HttpError(404, 'Sucursal no encontrada');
    const scope: Scope = [branch.business_id, params.branchId];

    const result = await inBranch(pool, scope, async (db, now) => {
      const { rows: [appt] } = await db.query<{
        id: string;
        status: string;
        expires_at: Date | null;
        price_minor: string;
      }>(
        'SELECT id, status, expires_at, price_minor FROM appointments WHERE business_id=$1 AND branch_id=$2 AND id=$3',
        [...scope, appointmentId],
      );
      if (!appt) throw new HttpError(404, 'Cita no encontrada');
      if (appt.status !== 'confirmed' || !appt.expires_at || +appt.expires_at <= +now) {
        throw new HttpError(409, 'La cita no admite pago online o ha expirado');
      }

      const { rows: [existing] } = await db.query<{
        id: string;
        client_secret: string;
        amount_minor: string;
        status: string;
      }>(
        `SELECT id, client_secret, amount_minor, status
         FROM stripe_payment_intents
         WHERE business_id=$1 AND branch_id=$2 AND appointment_id=$3`,
        [...scope, appointmentId],
      );
      if (existing) {
        return {
          statusCode: 200 as const,
          body: {
            paymentId: existing.id,
            clientSecret: existing.client_secret,
            amountMinor: Number(existing.amount_minor),
            status: existing.status,
          },
        };
      }

      const [businessId, branchId] = scope;
      const pi = await stripe.paymentIntents.create(
        {
          amount: Number(appt.price_minor),
          currency: 'usd',
          automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
          metadata: { businessId, branchId, appointmentId },
        },
        { idempotencyKey: `pi-${appointmentId}` },
      );
      if (!pi.client_secret) throw new HttpError(502, 'Stripe no devolvió client_secret');

      const { rows: [created] } = await db.query<{
        id: string;
        client_secret: string;
        amount_minor: string;
        status: string;
      }>(
        `INSERT INTO stripe_payment_intents
           (business_id, branch_id, appointment_id, stripe_pi_id, amount_minor, currency, status, client_secret)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, client_secret, amount_minor, status`,
        [...scope, appointmentId, pi.id, Number(appt.price_minor), pi.currency, pi.status, pi.client_secret],
      );

      return {
        statusCode: 201 as const,
        body: {
          paymentId: created.id,
          clientSecret: created.client_secret,
          amountMinor: Number(created.amount_minor),
          status: created.status,
        },
      };
    });

    return reply.code(result.statusCode).send(result.body);
  });

  app.post('/webhooks/stripe', { config: { rawBody: true } }, async request => {
    const signature = request.headers['stripe-signature'];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const rawBody =
      (request as FastifyRequest & { rawBody?: Buffer | string }).rawBody ||
      (request.body as Buffer | string | undefined);
    if (!signature || typeof signature !== 'string' || !secret || !rawBody) {
      throw new HttpError(400, 'Firma de webhook inválida');
    }

    console.log('Buffer.isBuffer(rawBody):', Buffer.isBuffer(rawBody));

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      throw new HttpError(400, 'Firma de webhook inválida');
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const { businessId, branchId, appointmentId } = input(metadataSchema, pi.metadata);
      const scope: Scope = [businessId, branchId];

      try {
        await inBranch(pool, scope, async db => {
          const inserted = await db.query(
            `INSERT INTO stripe_webhook_events (event_id, type, payload, status, attempts)
             VALUES ($1, $2, $3, 'received', 1)
             ON CONFLICT (event_id) DO NOTHING`,
            [event.id, event.type, JSON.stringify(event)],
          );
          if (!inserted.rowCount) return;

          await db.query(
            `UPDATE stripe_payment_intents
             SET status=$1, updated_at=clock_timestamp()
             WHERE business_id=$2 AND branch_id=$3 AND stripe_pi_id=$4`,
            [pi.status, ...scope, pi.id],
          );

          await db.query(
            `UPDATE appointments
             SET expires_at=NULL
             WHERE business_id=$1 AND branch_id=$2 AND id=$3 AND status='confirmed'`,
            [...scope, appointmentId],
          );

          await db.query(
            `INSERT INTO payments
               (business_id, branch_id, appointment_id, reference, status, recipient, amount_minor, method, requires_review)
             VALUES ($1, $2, $3, $4, 'paid', 'branch', $5, 'external', false)
             ON CONFLICT (business_id, branch_id, recipient, reference) DO NOTHING`,
            [...scope, appointmentId, pi.id, pi.amount],
          );

          await db.query(
            `UPDATE stripe_webhook_events
             SET status='processed', processed_at=clock_timestamp()
             WHERE event_id=$1`,
            [event.id],
          );
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await pool.query(
          `INSERT INTO stripe_webhook_events (event_id, type, payload, status, attempts, last_error)
           VALUES ($1, $2, $3, 'failed', 1, $4)
           ON CONFLICT (event_id) DO UPDATE
           SET status='failed', attempts=stripe_webhook_events.attempts + 1, last_error=EXCLUDED.last_error`,
          [event.id, event.type, JSON.stringify(event), message],
        );
        throw error;
      }
    }

    return { received: true };
  });
}
