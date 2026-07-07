-- Scope push subscriptions to a client. Admin (lead-alert) subscriptions keep a
-- NULL client_id; client subscriptions set it, so new-listing pushes go only to
-- the right people and lead alerts stay admin-only.
ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES client_users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_client ON push_subscriptions(client_id);
