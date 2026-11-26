CREATE TABLE businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE
);

CREATE TABLE branches (
  business_id uuid NOT NULL REFERENCES businesses,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  PRIMARY KEY (business_id, id)
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_admin boolean NOT NULL DEFAULT false
);

CREATE TABLE access_tokens (
  digest bytea PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users,
  expires_at timestamptz NOT NULL
);

CREATE TABLE memberships (
  business_id uuid REFERENCES businesses,
  user_id uuid REFERENCES users,
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (business_id, user_id)
);

CREATE TABLE branch_roles (
  business_id uuid,
  branch_id uuid,
  user_id uuid,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'receptionist', 'employee', 'member')),
  PRIMARY KEY (business_id, branch_id, user_id),
  FOREIGN KEY (business_id, branch_id) REFERENCES branches,
  FOREIGN KEY (business_id, user_id) REFERENCES memberships
);

CREATE TABLE services (
  business_id uuid,
  branch_id uuid,
  id uuid DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_minor bigint NOT NULL CHECK (price_minor >= 0),
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (business_id, branch_id, id),
  FOREIGN KEY (business_id, branch_id) REFERENCES branches
);

CREATE TABLE schedules (
  business_id uuid,
  branch_id uuid,
  weekday smallint CHECK (weekday BETWEEN 1 AND 6),
  branch_open smallint NOT NULL DEFAULT 480,
  branch_close smallint NOT NULL DEFAULT 960,
  labor_open smallint NOT NULL DEFAULT 480,
  labor_close smallint NOT NULL DEFAULT 1020,
  CHECK (branch_open >= 0 AND branch_close <= 1440 AND branch_open < branch_close),
  CHECK (labor_open >= 0 AND labor_close <= 1440 AND labor_open < labor_close),
  PRIMARY KEY (business_id, branch_id, weekday),
  FOREIGN KEY (business_id, branch_id) REFERENCES branches
);

CREATE TABLE breaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 1 AND 6),
  starts_minute smallint NOT NULL,
  ends_minute smallint NOT NULL,
  CHECK (starts_minute >= 0 AND ends_minute <= 1440 AND starts_minute < ends_minute),
  FOREIGN KEY (business_id, branch_id) REFERENCES branches
);

CREATE TABLE appointments (
  business_id uuid,
  branch_id uuid,
  id uuid DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  price_minor bigint NOT NULL CHECK (price_minor >= 0),
  starts_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'expired', 'no_show')),
  expires_at timestamptz,
  rescheduled boolean NOT NULL DEFAULT false,
  PRIMARY KEY (business_id, branch_id, id),
  UNIQUE (business_id, branch_id, id, starts_at),
  FOREIGN KEY (business_id, branch_id, service_id) REFERENCES services,
  CHECK (mod(extract(epoch FROM starts_at), 1800) = 0)
);

CREATE TABLE occupations (
  business_id uuid,
  branch_id uuid,
  starts_at timestamptz,
  appointment_id uuid NOT NULL,
  PRIMARY KEY (business_id, branch_id, starts_at),
  UNIQUE (business_id, branch_id, appointment_id),
  FOREIGN KEY (business_id, branch_id, appointment_id, starts_at)
    REFERENCES appointments (business_id, branch_id, id, starts_at)
);

CREATE INDEX appointments_expiration ON appointments (business_id, branch_id, expires_at)
  WHERE expires_at IS NOT NULL;

CREATE TABLE payments (
  business_id uuid,
  branch_id uuid,
  id uuid DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL,
  reference text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'failed', 'paid')),
  recipient text NOT NULL CHECK (recipient IN ('branch', 'platform')),
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  method text NOT NULL CHECK (method IN ('external', 'cash')),
  requires_review boolean NOT NULL,
  PRIMARY KEY (business_id, branch_id, id),
  UNIQUE (business_id, branch_id, recipient, reference),
  FOREIGN KEY (business_id, branch_id, appointment_id) REFERENCES appointments
);

CREATE TABLE payment_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  payment_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('pending', 'failed', 'late', 'duplicate')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (business_id, branch_id, payment_id, reason),
  FOREIGN KEY (business_id, branch_id, payment_id) REFERENCES payments
);

CREATE TABLE refunds (
  business_id uuid,
  branch_id uuid,
  id uuid DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL,
  authorized_by uuid NOT NULL REFERENCES users,
  issued_by uuid REFERENCES users,
  PRIMARY KEY (business_id, branch_id, id),
  UNIQUE (business_id, branch_id, payment_id),
  FOREIGN KEY (business_id, branch_id, payment_id) REFERENCES payments
);

CREATE TABLE idempotency_operations (
  business_id uuid,
  branch_id uuid,
  actor text,
  operation text,
  key text,
  fingerprint text NOT NULL,
  response jsonb NOT NULL,
  PRIMARY KEY (business_id, branch_id, actor, operation, key),
  FOREIGN KEY (business_id, branch_id) REFERENCES branches
);
