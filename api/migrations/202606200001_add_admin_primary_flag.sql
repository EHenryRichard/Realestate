-- Marks the founding super admin so it can never be deleted or demoted.
-- Only one row may carry is_primary = TRUE at a time.

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE;

-- Promote the earliest-created admin to primary if none is set yet. On a fresh
-- database the table is empty, so this is a no-op and the bootstrap signup will
-- set the flag instead.

WITH first_admin AS (
  SELECT id
  FROM admin_users
  WHERE role = 'admin'
  ORDER BY created_at ASC, id ASC
  LIMIT 1
)

UPDATE admin_users a
SET is_primary = TRUE
FROM first_admin f
WHERE a.id = f.id
  AND NOT EXISTS (SELECT 1 FROM admin_users WHERE is_primary = TRUE);

-- Guarantee at most one primary admin.
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_single_primary
  ON admin_users ((is_primary))
  WHERE is_primary = TRUE;