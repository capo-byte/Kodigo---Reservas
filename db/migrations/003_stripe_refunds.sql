ALTER TABLE refunds
  ADD COLUMN status text NOT NULL DEFAULT 'authorized'
    CHECK (status IN ('authorized', 'pending', 'succeeded', 'failed', 'manual')),
  ADD COLUMN stripe_refund_id text UNIQUE;

-- Las emisiones anteriores se registraron como devoluciones externas manuales.
UPDATE refunds SET status='manual' WHERE issued_by IS NOT NULL;
