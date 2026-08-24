-- ============================================================
-- Fa-ray Backend — Initial Schema
-- Multi-tenant pharmacy inventory SaaS
-- ============================================================



-- ── Pharmacies (tenants) ─────────────────────────────────────────────────────

CREATE TABLE pharmacies (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  -- Mirrors the sortPreference stored in faray_pharmacy_profile on the client.
  -- NULL means "not chosen yet"; callers fall back to their own default.
  sort_preference TEXT        CHECK (sort_preference IN ('alpha', 'status', 'code')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ── User profiles ─────────────────────────────────────────────────────────────
-- Extends Supabase auth.users. Each authenticated user belongs to exactly one
-- pharmacy. Created server-side after signup or invitation acceptance.

CREATE TABLE user_profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pharmacy_id  UUID        NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  role         TEXT        NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  display_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ── Staff invitations ─────────────────────────────────────────────────────────
-- Owner emails an invitation; recipient clicks the link and a user_profile
-- is created tied to the same pharmacy.

CREATE TABLE invitations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID        NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  -- Opaque token sent in the invite link — long enough to be unguessable.
  token       TEXT        NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  accepted_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ── Medicines ─────────────────────────────────────────────────────────────────

CREATE TABLE medicines (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id   UUID          NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  name          TEXT          NOT NULL,
  amharic       TEXT,
  code          TEXT,
  price         NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  -- Auto-calibrates upward on each restock (mirrors client logic in StoreContext).
  reorder_point INTEGER       NOT NULL DEFAULT 10 CHECK (reorder_point >= 0),
  -- Cached projection of net stock from the event log. Recomputable at any
  -- time via: SUM(qty) FILTER (type='restock') - SUM(qty) FILTER (type='sale')
  -- from activity_log. The API updates this atomically with each event insert.
  stock         INTEGER       NOT NULL DEFAULT 0,
  is_active     BOOLEAN       NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),

  -- Codes are pharmacy-scoped (two pharmacies can both stock 'PCM500').
  UNIQUE (pharmacy_id, code)
);


-- ── Batches (expiry-tracked stock, FEFO) ─────────────────────────────────────
-- Each restock creates one batch. Sales decrement qty_remaining in FEFO order
-- (soonest-expiring first). Matches the batch shape from src/utils/batches.js.

CREATE TABLE batches (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id     UUID        NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  medicine_id     UUID        NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  qty_original    INTEGER     NOT NULL CHECK (qty_original > 0),
  qty_remaining   INTEGER     NOT NULL CHECK (qty_remaining >= 0),
  expiry_date     DATE,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Expo push notification ID stored so it can be cancelled when the batch
  -- sells out (mirrors notificationId on the client batch object).
  notification_id TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (qty_remaining <= qty_original)
);


-- ── Activity log (append-only event store) ────────────────────────────────────
-- The canonical record of every stock movement. The `stock` column on medicines
-- is a cached projection of this log — fast to read, recomputable from here.
-- Devices upload local events on reconnect; client_event_id makes uploads
-- idempotent so retrying after a network failure never double-counts.

CREATE TABLE activity_log (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id     UUID          NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  medicine_id     UUID          NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  type            TEXT          NOT NULL CHECK (type IN ('sale', 'restock')),
  qty             INTEGER       NOT NULL CHECK (qty > 0),
  -- Snapshot of the price at the moment of sale. NULL for restocks.
  -- Must use this value (not medicine.price) for revenue calculations because
  -- price can be edited after the fact — see StoreContext.updatePrice.
  price_per_unit  NUMERIC(10,2),
  -- For restocks: the batch this event created (set after batch insert).
  -- For sales: NULL (FEFO deductions update batch.qty_remaining directly).
  batch_id        UUID          REFERENCES batches(id),
  -- When the event actually happened on the device (client clock).
  occurred_at     TIMESTAMPTZ   NOT NULL,
  -- When this row arrived on the server — used to detect upload ordering issues.
  synced_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  -- Stable ID generated on the client (format: isoDate + random suffix,
  -- matching the existing batch id pattern in batches.js).
  -- Unique per pharmacy so sync uploads are safe to retry.
  client_event_id TEXT          NOT NULL,
  -- Which device recorded this event (useful for debugging sync conflicts).
  device_id       TEXT,

  UNIQUE (pharmacy_id, client_event_id)
);


-- ── Triggers ──────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER medicines_set_updated_at
  BEFORE UPDATE ON medicines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Tenant-scoped table scans (every query filters by pharmacy_id first)
CREATE INDEX idx_medicines_pharmacy      ON medicines    (pharmacy_id);
CREATE INDEX idx_batches_pharmacy        ON batches      (pharmacy_id);
CREATE INDEX idx_activity_log_pharmacy   ON activity_log (pharmacy_id);
CREATE INDEX idx_user_profiles_pharmacy  ON user_profiles (pharmacy_id);
CREATE INDEX idx_invitations_pharmacy    ON invitations  (pharmacy_id);

-- FEFO batch selection: soonest expiry first, only active batches
CREATE INDEX idx_batches_fefo            ON batches (medicine_id, expiry_date NULLS LAST)
  WHERE qty_remaining > 0;

-- Sync cursor: "give me all events newer than timestamp X for my pharmacy"
CREATE INDEX idx_activity_log_sync       ON activity_log (pharmacy_id, occurred_at DESC);

-- Per-medicine history feed (MedicineDetailScreen / ActivityHistoryScreen)
CREATE INDEX idx_activity_log_medicine   ON activity_log (medicine_id, occurred_at DESC);

-- Invitation acceptance flow looks up by token
CREATE INDEX idx_invitations_token       ON invitations (token);


-- ── Row Level Security ────────────────────────────────────────────────────────

-- Returns the pharmacy_id for the currently authenticated user.
-- SECURITY DEFINER so it can read user_profiles even before that table's own
-- RLS policy is evaluated (avoids a chicken-and-egg boot problem).
CREATE OR REPLACE FUNCTION auth_pharmacy_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT pharmacy_id FROM user_profiles WHERE id = auth.uid()
$$;

ALTER TABLE pharmacies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines     ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log  ENABLE ROW LEVEL SECURITY;

-- Each table: members of a pharmacy see only that pharmacy's rows.
CREATE POLICY pharmacy_isolation    ON pharmacies    FOR ALL USING (id = auth_pharmacy_id());
CREATE POLICY user_profiles_isolation ON user_profiles FOR ALL USING (pharmacy_id = auth_pharmacy_id());
CREATE POLICY invitations_isolation ON invitations   FOR ALL USING (pharmacy_id = auth_pharmacy_id());
CREATE POLICY medicines_isolation   ON medicines     FOR ALL USING (pharmacy_id = auth_pharmacy_id());
CREATE POLICY batches_isolation     ON batches       FOR ALL USING (pharmacy_id = auth_pharmacy_id());
CREATE POLICY activity_log_isolation ON activity_log FOR ALL USING (pharmacy_id = auth_pharmacy_id());
