/*
# Allow portfolio content without an owner account

## Plain-English summary
The owner link on the profile, projects and blog posts tables is currently required. Accounts are
being removed so the first new sign-up becomes the admin. Making the link optional keeps the
portfolio content in place once the old accounts are gone.

## Modified tables
- profile.user_id, projects.user_id, blog_posts.user_id: no longer required (existing rows are unchanged).

## Security notes
- Writes to these tables are already restricted to the admin by the previous migration.
- No data is removed by this change.
*/

ALTER TABLE public.profile ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.projects ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.blog_posts ALTER COLUMN user_id DROP NOT NULL;
