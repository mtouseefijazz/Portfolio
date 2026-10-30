/*
# Admin-only writes, member list, member group chat, admin email history

## Plain-English summary
1. Only the admin (the first user who ever registered) can change portfolio content
   (profile, projects, blog posts, skills, tools, learning items) and reply to visitor messages.
   Previously any signed-in account could edit them.
2. A new admin-only function returns every member's email, sign-up date and last sign-in date.
3. A new group chat table lets every signed-in member post messages that all members can read.
4. Changing the admin's login email is recorded so the previous email can be shown in the admin panel.

## New tables
- `community_messages`: group chat posts. Columns: id, user_id (the poster), author_email
  (filled automatically from the poster's account, cannot be faked), content (1-1000 characters), created_at.
- `account_email_history`: one row per login-email change of an account. Columns: id, user_id,
  old_email, new_email, changed_at. Filled automatically by a database trigger.

## Modified policies
- profile, projects, blog_posts, skills, tools, learning_items: public read unchanged;
  insert/update/delete now require is_current_user_admin().
- messages: admin reply, update and delete now require is_current_user_admin().
  Visitor inserts and public reads are unchanged.

## New functions
- admin_list_members(): admin only. Returns members with email, created_at, last_sign_in_at, is_admin.
- record_email_change(): trigger function that writes account_email_history.
- set_community_author(): trigger function that stamps author_email on group chat posts.

## Security notes
- Helper and admin functions are not callable by anonymous visitors.
- Group chat is intentionally shared among signed-in members (USING true is limited to the authenticated role).
- Members can delete only their own group chat posts; the admin can delete any.
- Passwords are never stored or returned; Supabase keeps only a one-way hash.
*/

-- 1. Admin-only portfolio content writes

DROP POLICY IF EXISTS "profile_owner_update" ON profile;
CREATE POLICY "profile_owner_update" ON profile FOR UPDATE
  TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "profile_owner_insert" ON profile;
CREATE POLICY "profile_owner_insert" ON profile FOR INSERT
  TO authenticated WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "projects_owner_insert" ON projects;
CREATE POLICY "projects_owner_insert" ON projects FOR INSERT
  TO authenticated WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "projects_owner_update" ON projects;
CREATE POLICY "projects_owner_update" ON projects FOR UPDATE
  TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "projects_owner_delete" ON projects;
CREATE POLICY "projects_owner_delete" ON projects FOR DELETE
  TO authenticated USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "blog_posts_owner_insert" ON blog_posts;
CREATE POLICY "blog_posts_owner_insert" ON blog_posts FOR INSERT
  TO authenticated WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "blog_posts_owner_update" ON blog_posts;
CREATE POLICY "blog_posts_owner_update" ON blog_posts FOR UPDATE
  TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "blog_posts_owner_delete" ON blog_posts;
CREATE POLICY "blog_posts_owner_delete" ON blog_posts FOR DELETE
  TO authenticated USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "skills_owner_insert" ON skills;
CREATE POLICY "skills_owner_insert" ON skills FOR INSERT
  TO authenticated WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "skills_owner_update" ON skills;
CREATE POLICY "skills_owner_update" ON skills FOR UPDATE
  TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "skills_owner_delete" ON skills;
CREATE POLICY "skills_owner_delete" ON skills FOR DELETE
  TO authenticated USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "tools_owner_insert" ON tools;
CREATE POLICY "tools_owner_insert" ON tools FOR INSERT
  TO authenticated WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "tools_owner_update" ON tools;
CREATE POLICY "tools_owner_update" ON tools FOR UPDATE
  TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "tools_owner_delete" ON tools;
CREATE POLICY "tools_owner_delete" ON tools FOR DELETE
  TO authenticated USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "learning_items_owner_insert" ON learning_items;
CREATE POLICY "learning_items_owner_insert" ON learning_items FOR INSERT
  TO authenticated WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "learning_items_owner_update" ON learning_items;
CREATE POLICY "learning_items_owner_update" ON learning_items FOR UPDATE
  TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "learning_items_owner_delete" ON learning_items;
CREATE POLICY "learning_items_owner_delete" ON learning_items FOR DELETE
  TO authenticated USING (public.is_current_user_admin());

-- 2. Admin-only message replies, updates and deletes

DROP POLICY IF EXISTS "messages_admin_insert" ON messages;
CREATE POLICY "messages_admin_insert" ON messages FOR INSERT
  TO authenticated WITH CHECK (sender = 'admin' AND public.is_current_user_admin());

DROP POLICY IF EXISTS "messages_admin_update" ON messages;
CREATE POLICY "messages_admin_update" ON messages FOR UPDATE
  TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "messages_admin_delete" ON messages;
CREATE POLICY "messages_admin_delete" ON messages FOR DELETE
  TO authenticated USING (public.is_current_user_admin());

-- 3. Member list for the admin

CREATE OR REPLACE FUNCTION public.admin_list_members()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  is_admin boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    (u.id = (SELECT f.id FROM auth.users f ORDER BY f.created_at ASC LIMIT 1)) AS is_admin
  FROM auth.users u
  ORDER BY u.created_at ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_members() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_members() TO authenticated;

-- 4. Member group chat

CREATE TABLE IF NOT EXISTS community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  author_email text NOT NULL DEFAULT '',
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_messages_created_at_idx ON community_messages (created_at);
CREATE INDEX IF NOT EXISTS community_messages_user_id_idx ON community_messages (user_id);

CREATE OR REPLACE FUNCTION public.set_community_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  SELECT u.email::text INTO NEW.author_email FROM auth.users u WHERE u.id = NEW.user_id;
  NEW.author_email := coalesce(NEW.author_email, '');
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_community_author() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS community_messages_set_author ON community_messages;
CREATE TRIGGER community_messages_set_author
  BEFORE INSERT ON community_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_community_author();

ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON community_messages TO authenticated;

DROP POLICY IF EXISTS "community_messages_member_select" ON community_messages;
CREATE POLICY "community_messages_member_select" ON community_messages FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "community_messages_member_insert" ON community_messages;
CREATE POLICY "community_messages_member_insert" ON community_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_messages_member_delete" ON community_messages;
CREATE POLICY "community_messages_member_delete" ON community_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR public.is_current_user_admin());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'community_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE community_messages;
  END IF;
END
$$;

-- 5. Admin login email history

CREATE TABLE IF NOT EXISTS account_email_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_email text,
  new_email text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS account_email_history_user_id_idx ON account_email_history (user_id);

CREATE OR REPLACE FUNCTION public.record_email_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.account_email_history (user_id, old_email, new_email)
  VALUES (NEW.id, OLD.email::text, NEW.email::text);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_email_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS auth_users_record_email_change ON auth.users;
CREATE TRIGGER auth_users_record_email_change
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.record_email_change();

ALTER TABLE account_email_history ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON account_email_history TO authenticated;

DROP POLICY IF EXISTS "account_email_history_owner_select" ON account_email_history;
CREATE POLICY "account_email_history_owner_select" ON account_email_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
