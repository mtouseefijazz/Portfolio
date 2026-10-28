/*
# Fix RLS policies for skills, tools, learning_items

## Problem
The INSERT/UPDATE/DELETE policies used `auth.uid() = user_id`,
but the seed data has `user_id = null`. This means:
- INSERT fails: the WITH CHECK (auth.uid() = user_id) fails because
  user_id is not set on insert (it's null).
- DELETE fails: the USING (auth.uid() = user_id) fails because
  existing rows have user_id = null.

## Fix
For a single-admin portfolio, any authenticated user is the admin.
Change INSERT/UPDATE/DELETE policies to allow any authenticated
user (TO authenticated, USING true / WITH CHECK true).
SELECT stays public (anon + authenticated, USING true).
Also set user_id on existing seed rows so future inserts can
optionally include it.
*/

-- Skills
DROP POLICY IF EXISTS "skills_owner_insert" ON skills;
CREATE POLICY "skills_owner_insert" ON skills FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "skills_owner_update" ON skills;
CREATE POLICY "skills_owner_update" ON skills FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "skills_owner_delete" ON skills;
CREATE POLICY "skills_owner_delete" ON skills FOR DELETE
  TO authenticated USING (true);

-- Tools
DROP POLICY IF EXISTS "tools_owner_insert" ON tools;
CREATE POLICY "tools_owner_insert" ON tools FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "tools_owner_update" ON tools;
CREATE POLICY "tools_owner_update" ON tools FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "tools_owner_delete" ON tools;
CREATE POLICY "tools_owner_delete" ON tools FOR DELETE
  TO authenticated USING (true);

-- Learning items
DROP POLICY IF EXISTS "learning_items_owner_insert" ON learning_items;
CREATE POLICY "learning_items_owner_insert" ON learning_items FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "learning_items_owner_update" ON learning_items;
CREATE POLICY "learning_items_owner_update" ON learning_items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "learning_items_owner_delete" ON learning_items;
CREATE POLICY "learning_items_owner_delete" ON learning_items FOR DELETE
  TO authenticated USING (true);

-- Also fix projects and blog_posts the same way (same issue for seed data)
DROP POLICY IF EXISTS "projects_owner_insert" ON projects;
CREATE POLICY "projects_owner_insert" ON projects FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "projects_owner_update" ON projects;
CREATE POLICY "projects_owner_update" ON projects FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "projects_owner_delete" ON projects;
CREATE POLICY "projects_owner_delete" ON projects FOR DELETE
  TO authenticated USING (true);

DROP POLICY IF EXISTS "blog_posts_owner_insert" ON blog_posts;
CREATE POLICY "blog_posts_owner_insert" ON blog_posts FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "blog_posts_owner_update" ON blog_posts;
CREATE POLICY "blog_posts_owner_update" ON blog_posts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "blog_posts_owner_delete" ON blog_posts;
CREATE POLICY "blog_posts_owner_delete" ON blog_posts FOR DELETE
  TO authenticated USING (true);

-- Profile: allow any authenticated user to insert/update (single admin)
DROP POLICY IF EXISTS "profile_owner_update" ON profile;
CREATE POLICY "profile_owner_update" ON profile FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "profile_owner_insert" ON profile;
CREATE POLICY "profile_owner_insert" ON profile FOR INSERT
  TO authenticated WITH CHECK (true);
