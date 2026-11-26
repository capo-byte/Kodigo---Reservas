import { Pool } from 'pg';
import { makeApp } from './app.js';
import { inBranch } from './booking.js';
import { NotificationWorker, SimulatedEmailProvider } from './notifications/worker.js';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL es obligatoria');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const notifications = new NotificationWorker(pool, new SimulatedEmailProvider());
const app = makeApp(pool, undefined, notifications);
notifications.start();

let sweep: Promise<void> | undefined;
const expiration = setInterval(() => {
  if (sweep) return;
  sweep = (async () => {
    const { rows } = await pool.query(
      'SELECT DISTINCT business_id, branch_id FROM appointments WHERE expires_at <= clock_timestamp()',
    );
    for (const row of rows) {
      await inBranch(pool, [row.business_id, row.branch_id], async () => undefined);
    }
  })().catch(error => console.error('Error al actualizar citas expiradas', error))
    .finally(() => { sweep = undefined; });
}, 30_000);
expiration.unref();

app.addHook('onClose', async () => {
  clearInterval(expiration);
  await notifications.stop();
  await sweep;
  await pool.end();
});
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { void app.close(); });

try {
  const address = await app.listen({ port: Number(process.env.PORT ?? 3000), host: process.env.HOST ?? '127.0.0.1' });
  console.log(`API de reservas escuchando en ${address}. Pulsa Ctrl+C para detenerla.`);
} catch (error) {
  await app.close();
  throw error;
}
