CREATE TABLE stripe_payment_intents (
  business_id uuid,
  branch_id uuid,
  id uuid DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL,
  stripe_pi_id text NOT NULL UNIQUE,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency char(3) NOT NULL DEFAULT 'usd',
  status text NOT NULL,
  client_secret text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, branch_id, id),
  UNIQUE (business_id, branch_id, appointment_id),
  FOREIGN KEY (business_id, branch_id, appointment_id)
    REFERENCES appointments (business_id, branch_id, id)
);

CREATE TABLE stripe_webhook_events (
  event_id text PRIMARY KEY,
  type text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received','processed','failed')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  processed_at timestamptz,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX stripe_webhook_pending
  ON stripe_webhook_events (status, received_at)
  WHERE status <> 'processed';