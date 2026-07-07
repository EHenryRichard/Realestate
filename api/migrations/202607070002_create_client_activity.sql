-- Client activity: the data behind the dashboard cards.
-- All rows belong to a client and cascade-delete with the account/property.

-- Properties a client has bookmarked (one row per client+property).
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, property_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_properties_client ON saved_properties(client_id);

-- "Recently viewed" — one row per client+property, its timestamp refreshed on
-- each view (so the list is a de-duplicated, most-recent-first history).
CREATE TABLE IF NOT EXISTS property_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, property_id)
);
CREATE INDEX IF NOT EXISTS idx_property_views_client ON property_views(client_id, viewed_at DESC);

-- Messages a client sends to the team about a property (or in general). Agents
-- read/respond to these from the admin side. client_id/property_id are nullable
-- so a record survives if the account or listing is later removed.
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES client_users(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inquiries_client ON inquiries(client_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
