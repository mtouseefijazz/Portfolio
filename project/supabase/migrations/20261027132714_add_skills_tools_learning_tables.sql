/*
# Add skills, tools, learning_items tables for admin-managed content

Makes skills, tools, and learning items database-backed so the admin can
add, edit, and delete them from the admin panel. Seed rows are inserted
for the existing hardcoded content.

## Tables
1. `skills` — name, description, icon_name, color, sort_order
2. `tools` — same shape
3. `learning_items` — same shape

user_id is nullable on these tables because seed rows are inserted by
the service/migration role (no auth session). Owner-scoped writes are
still enforced via RLS WITH CHECK for authenticated inserts/updates.

## Security
- RLS enabled on every table.
- Public SELECT; authenticated INSERT/UPDATE/DELETE.
*/

-- ───────────────────────── skills ─────────────────────────
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon_name text NOT NULL DEFAULT 'Code2',
  color text NOT NULL DEFAULT 'text-sky-400',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON skills TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON skills TO authenticated;

DROP POLICY IF EXISTS "skills_public_read" ON skills;
CREATE POLICY "skills_public_read" ON skills FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "skills_owner_insert" ON skills;
CREATE POLICY "skills_owner_insert" ON skills FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "skills_owner_update" ON skills;
CREATE POLICY "skills_owner_update" ON skills FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "skills_owner_delete" ON skills;
CREATE POLICY "skills_owner_delete" ON skills FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ───────────────────────── tools ─────────────────────────
CREATE TABLE IF NOT EXISTS tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon_name text NOT NULL DEFAULT 'Terminal',
  color text NOT NULL DEFAULT 'text-sky-400',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON tools TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON tools TO authenticated;

DROP POLICY IF EXISTS "tools_public_read" ON tools;
CREATE POLICY "tools_public_read" ON tools FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "tools_owner_insert" ON tools;
CREATE POLICY "tools_owner_insert" ON tools FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tools_owner_update" ON tools;
CREATE POLICY "tools_owner_update" ON tools FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tools_owner_delete" ON tools;
CREATE POLICY "tools_owner_delete" ON tools FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ───────────────────── learning_items ─────────────────────
CREATE TABLE IF NOT EXISTS learning_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon_name text NOT NULL DEFAULT 'BookOpen',
  color text NOT NULL DEFAULT 'text-emerald-400',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE learning_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON learning_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON learning_items TO authenticated;

DROP POLICY IF EXISTS "learning_items_public_read" ON learning_items;
CREATE POLICY "learning_items_public_read" ON learning_items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "learning_items_owner_insert" ON learning_items;
CREATE POLICY "learning_items_owner_insert" ON learning_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "learning_items_owner_update" ON learning_items;
CREATE POLICY "learning_items_owner_update" ON learning_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "learning_items_owner_delete" ON learning_items;
CREATE POLICY "learning_items_owner_delete" ON learning_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ─────────────────────── seed data ───────────────────────
INSERT INTO skills (name, description, icon_name, color, sort_order)
SELECT * FROM (VALUES
  ('Python', 'Scripting, automation, and data analysis', 'Code2', 'text-sky-400', 1),
  ('SQL', 'Querying and managing relational databases', 'Database', 'text-amber-400', 2),
  ('MS Office', 'Word, Excel, PowerPoint for reporting', 'FileSpreadsheet', 'text-orange-400', 3),
  ('PowerBI', 'Building interactive dashboards and reports', 'BarChart3', 'text-yellow-400', 4),
  ('NumPy', 'Numerical computing with arrays', 'Sigma', 'text-teal-400', 5),
  ('Pandas', 'Data manipulation and analysis', 'Table2', 'text-indigo-400', 6)
) AS v(name, description, icon_name, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM skills);

INSERT INTO tools (name, description, icon_name, color, sort_order)
SELECT * FROM (VALUES
  ('MySQL Workbench', 'Database design and administration', 'Database', 'text-blue-400', 1),
  ('VS Code', 'Primary code editor', 'Terminal', 'text-sky-400', 2),
  ('Jupyter', 'Notebooks for data exploration', 'BookOpen', 'text-orange-400', 3),
  ('GitHub', 'Version control and collaboration', 'GitBranch', 'text-purple-400', 4)
) AS v(name, description, icon_name, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM tools);

INSERT INTO learning_items (name, description, icon_name, color, sort_order)
SELECT * FROM (VALUES
  ('Matplotlib', 'Data visualization in Python', 'LineChart', 'text-emerald-400', 1),
  ('Scikit Learn', 'Machine learning fundamentals', 'Brain', 'text-rose-400', 2),
  ('PyTorch', 'Deep learning framework', 'Flame', 'text-red-400', 3)
) AS v(name, description, icon_name, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM learning_items);

CREATE INDEX IF NOT EXISTS skills_sort_order_idx ON skills (sort_order);
CREATE INDEX IF NOT EXISTS tools_sort_order_idx ON tools (sort_order);
CREATE INDEX IF NOT EXISTS learning_items_sort_order_idx ON learning_items (sort_order);
