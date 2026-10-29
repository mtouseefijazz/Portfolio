-- Function to check if the current authenticated user is the admin.
-- The admin is defined as the FIRST user who registered (earliest created_at in auth.users).
-- All subsequent users are NOT admin.

-- SECURITY DEFINER so it can read auth.users (which is not accessible to anon/authenticated roles)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = auth.uid()
    AND u.created_at = (
      SELECT MIN(created_at) FROM auth.users
    )
  );
$$;

-- Grant execute to authenticated role only (not anon)
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
