ALTER TABLE admin_users
    ADD COLUMN phone TEXT,
    ADD COLUMN photo TEXT,
    ADD COLUMN bio   TEXT,
    ADD COLUMN title TEXT,
    ADD COLUMN slug  TEXT;

CREATE UNIQUE INDEX idx_admin_users_slug ON admin_users(slug) WHERE slug IS NOT NULL;
