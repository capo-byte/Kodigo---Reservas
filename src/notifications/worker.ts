import type { Pool } from 'pg';
import type { NotificationJob, NotificationProvider, NotificationQueue } from './types.js';

// Simulación explícita: no dispone de dirección de correo ni contacta a un proveedor.
export class SimulatedEmailProvider implements NotificationProvider {
  async send(job: NotificationJob): Promise<void> {
    console.info('Notificación simulada', { kind: job.kind, appointmentId: job.appointmentId });
  }
}

export class NotificationWorker implements NotificationQueue {
  private readonly pending = new Map<string, NotificationJob>();
  private readonly sent = new Set<string>();
  private running = false;
  private timer?: NodeJS.Timeout;
  private tickPromise?: Promise<void>;

  constructor(private readonly pool: Pool, private readonly provider: NotificationProvider) {}

  enqueue(job: NotificationJob): void {
    const id = [job.businessId, job.branchId, job.appointmentId, job.kind].join(':');
    if (!this.sent.has(id) && !this.pending.has(id)) this.pending.set(id, job);
  }

  async run(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const { rows } = await this.pool.query<{ business_id: string; branch_id: string; id: string }>(
        `SELECT business_id, branch_id, id FROM appointments
         WHERE status='confirmed' AND starts_at > clock_timestamp()
           AND starts_at <= clock_timestamp() + interval '24 hours'
           AND (expires_at IS NULL OR expires_at > clock_timestamp())`,
      );
      for (const row of rows) this.enqueue({ businessId: row.business_id, branchId: row.branch_id,
        appointmentId: row.id, kind: 'reminder' });
      for (const [id, job] of this.pending) {
        try {
          await this.provider.send(job);
          this.pending.delete(id);
          this.sent.add(id);
        } catch (error) {
          console.error('Error al simular notificación', error);
        }
      }
    } finally {
      this.running = false;
    }
  }

  start(): void {
    if (this.timer) return;
    const tick = () => {
      if (this.tickPromise) return;
      this.tickPromise = this.run().catch(error => console.error('Error en notificaciones', error))
        .finally(() => { this.tickPromise = undefined; });
    };
    tick();
    this.timer = setInterval(tick, 60_000);
    this.timer.unref();
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    await this.tickPromise;
  }
}
