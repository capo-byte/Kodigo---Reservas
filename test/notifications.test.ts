import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Pool } from 'pg';
import { NotificationWorker } from '../src/notifications/worker.js';
import type { NotificationJob } from '../src/notifications/types.js';

test('simula confirmación y recordatorio una vez por proceso', async () => {
  const job: NotificationJob = { businessId: 'business', branchId: 'branch', appointmentId: 'appointment', kind: 'confirmation' };
  const sent: NotificationJob[] = [];
  const pool = { query: async () => ({ rows: [{ business_id: job.businessId, branch_id: job.branchId, id: job.appointmentId }] }) } as unknown as Pool;
  const worker = new NotificationWorker(pool, { send: async message => { sent.push(message); } });
  worker.enqueue(job);
  worker.enqueue(job);
  await worker.run();
  worker.enqueue(job);
  await worker.run();
  assert.deepEqual(sent.map(message => message.kind), ['confirmation', 'reminder']);
});
