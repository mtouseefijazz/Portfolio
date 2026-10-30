DROP FUNCTION IF EXISTS public.admin_list_members();

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('login', 'logout', 'page_view')),
  page text CHECK (page IS NULL OR char_length(page) <= 500),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_logs_user_created_idx ON activity_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_created_idx ON activity_logs (created_at DESC);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON activity_logs TO authenticated;
GRANT SELECT ON activity_logs TO authenticated;

DROP POLICY IF EXISTS "activity_logs_member_insert" ON activity_logs;
CREATE POLICY "activity_logs_member_insert" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "activity_logs_admin_select" ON activity_logs;
CREATE POLICY "activity_logs_admin_select" ON activity_logs FOR SELECT
  TO authenticated USING (public.is_current_user_admin());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'activity_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.admin_list_members()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  is_admin boolean,
  login_count bigint,
  last_login_at timestamptz,
  pages_visited bigint,
  action_count bigint
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
    (u.id = (SELECT f.id FROM auth.users f ORDER BY f.created_at ASC LIMIT 1)) AS is_admin,
    coalesce(s.login_count, 0)::bigint,
    coalesce(s.last_login_at, u.last_sign_in_at),
    coalesce(s.pages_visited, 0)::bigint,
    coalesce(s.action_count, 0)::bigint
  FROM auth.users u
  LEFT JOIN (
    SELECT
      a.user_id,
      count(*) FILTER (WHERE a.action = 'login') AS login_count,
      max(a.created_at) FILTER (WHERE a.action = 'login') AS last_login_at,
      count(DISTINCT a.page) FILTER (WHERE a.action = 'page_view') AS pages_visited,
      count(*) AS action_count
    FROM public.activity_logs a
    GROUP BY a.user_id
  ) s ON s.user_id = u.id
  ORDER BY u.created_at ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_members() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_members() TO authenticated;
