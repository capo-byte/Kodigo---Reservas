import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Pool } from 'pg';
import Stripe from 'stripe';
import { makeApp } from '../src/app.js';

test('health informa si PostgreSQL responde', async () => {
  let available = true;
  const pool = { query: async () => {
    if (!available) throw new Error('database unavailable');
    return { rows: [{ '?column?': 1 }] };
  } } as unknown as Pool;
  const app = makeApp(pool, new Stripe('sk_test_dummy'));
  try {
    const healthy = await app.inject('/health');
    assert.equal(healthy.statusCode, 200);
    assert.deepEqual(healthy.json(), { status: 'ok', db: 'connected' });
    available = false;
    const unhealthy = await app.inject('/health');
    assert.equal(unhealthy.statusCode, 503);
    assert.deepEqual(unhealthy.json(), { status: 'error', db: 'disconnected' });
  } finally {
    await app.close();
  }
});
