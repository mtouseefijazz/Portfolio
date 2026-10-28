/*
# Create portfolio schema for Muhammad Touseef Ejaz

This migration sets up the data layer for a personal portfolio website.
The site has a single owner (Muhammad Touseef) who signs in to manage
projects and blog posts. Visitors can browse everything read-only.

## Tables created
1. `profile` — single row holding the owner's display info (name, bio,
   tagline, photo URL, phone, email, location). Public read, owner-only
   write. Only the signed-in owner can update it.
2. `projects` — portfolio project entries with title, description,
   image URL, tech tags, and an external link. Public read, owner-only
   CRUD. `user_id` defaults to `auth.uid()` so inserts work without
   the client passing it.
3. `blog_posts` — blog articles with title, slug, excerpt, content
   (markdown), cover image URL, published flag, and timestamps.
   Public SELECT for published posts (and all posts for the owner);
   owner-only INSERT/UPDATE/DELETE.

## Security
- RLS enabled on every table.
- Grants: `anon, authenticated` get SELECT where public reading is
  intended; `authenticated` gets INSERT/UPDATE/DELETE where the owner
  can manage. `service_role` is granted for any future server-side use.
- Policies use `auth.uid() = user_id` for ownership checks.
- `user_id` columns default to `auth.uid()` so client inserts that omit
  the owner still satisfy `WITH CHECK (auth.uid() = user_id)`.
*/

-- ───────────────────────── profile ─────────────────────────
CREATE TABLE IF NOT EXISTS profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Muhammad Touseef Ejaz',
  tagline text NOT NULL DEFAULT 'Data & Programming Enthusiast',
  bio text,
  photo_url text,
  phone text DEFAULT '03223517968',
  email text DEFAULT 'mtouseefijazz@gmail.com',
  location text,
  github_url text,
  linkedin_url text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profile ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON profile TO anon, authenticated;
GRANT UPDATE ON profile TO authenticated;

DROP POLICY IF EXISTS "profile_public_read" ON profile;
CREATE POLICY "profile_public_read"
  ON profile FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profile_owner_update" ON profile;
CREATE POLICY "profile_owner_update"
  ON profile FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ───────────────────────── projects ─────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  project_url text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON projects TO authenticated;

DROP POLICY IF EXISTS "projects_public_read" ON projects;
CREATE POLICY "projects_public_read"
  ON projects FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "projects_owner_insert" ON projects;
CREATE POLICY "projects_owner_insert"
  ON projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_owner_update" ON projects;
CREATE POLICY "projects_owner_update"
  ON projects FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_owner_delete" ON projects;
CREATE POLICY "projects_owner_delete"
  ON projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ───────────────────────── blog_posts ─────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  excerpt text,
  content text,
  cover_url text,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON blog_posts TO authenticated;

-- Public can read published posts; owner can read all their posts.
DROP POLICY IF EXISTS "blog_posts_public_read" ON blog_posts;
CREATE POLICY "blog_posts_public_read"
  ON blog_posts FOR SELECT TO anon, authenticated
  USING (published = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "blog_posts_owner_insert" ON blog_posts;
CREATE POLICY "blog_posts_owner_insert"
  ON blog_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "blog_posts_owner_update" ON blog_posts;
CREATE POLICY "blog_posts_owner_update"
  ON blog_posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "blog_posts_owner_delete" ON blog_posts;
CREATE POLICY "blog_posts_owner_delete"
  ON blog_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Index for ordering and slug lookups
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects (created_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_created_at_idx ON blog_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts (slug);

-- ─────────────────────── storage bucket ───────────────────────
-- Public bucket for portfolio photos / project images / blog covers.
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

-- Public read of portfolio bucket
DROP POLICY IF EXISTS "portfolio_public_read" ON storage.objects;
CREATE POLICY "portfolio_public_read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'portfolio');

-- Authenticated users can upload/update/delete in portfolio bucket
DROP POLICY IF EXISTS "portfolio_auth_insert" ON storage.objects;
CREATE POLICY "portfolio_auth_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portfolio');

DROP POLICY IF EXISTS "portfolio_auth_update" ON storage.objects;
CREATE POLICY "portfolio_auth_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'portfolio') WITH CHECK (bucket_id = 'portfolio');

DROP POLICY IF EXISTS "portfolio_auth_delete" ON storage.objects;
CREATE POLICY "portfolio_auth_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'portfolio');
