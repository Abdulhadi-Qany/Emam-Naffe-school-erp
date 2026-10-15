// NEW: drizzle/migrations/0001_roles_permissions_indexes.sql
-- 1. Make permissions safely typed at the DB layer.
ALTER TABLE roles
  ALTER COLUMN permissions TYPE jsonb USING permissions::jsonb,
  ALTER COLUMN permissions SET DEFAULT '[]'::jsonb,
  ALTER COLUMN permissions SET NOT NULL;

-- Reject anything that isn't a JSON array of strings.
ALTER TABLE roles
  ADD CONSTRAINT roles_permissions_is_array
  CHECK (jsonb_typeof(permissions) = 'array');

-- Optional: tighten to strings only.
ALTER TABLE roles
  ADD CONSTRAINT roles_permissions_elements_are_strings
  CHECK (
    NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(permissions) elem
      WHERE jsonb_typeof(elem) <> 'string'
    )
  );

-- 2. Indexes that make permission resolution a single fast JOIN (PERF-001).
CREATE INDEX IF NOT EXISTS user_roles_user_school_idx
  ON user_roles (user_id, school_id);

CREATE INDEX IF NOT EXISTS user_roles_role_idx
  ON user_roles (role_id);

CREATE UNIQUE INDEX IF NOT EXISTS roles_name_school_unique
  ON roles (name, school_id)
  WHERE school_id IS NOT NULL;

-- 3. Guard against duplicate grants.
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_unique_grant
  ON user_roles (user_id, role_id, school_id)
  WHERE school_id IS NOT NULL;