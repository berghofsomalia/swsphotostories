# SWS Photostories admin setup

This admin page is a static GitHub Pages page at `/admin/`. The page itself can be visited by anyone who knows the URL, so the protection must happen in Supabase: Auth plus Row Level Security. Do not put a `service_role` key in frontend code.

## 1. Files added

```text
admin/index.html
assets/admin.js
assets/admin.css
ADMIN_SETUP.md
```

The admin page lets an approved user:

- sign in with Supabase email/password auth
- edit story status, district, storyteller, teaser and story text
- edit the first community reflection attached to a story
- add/remove tags grouped by tag cluster

## 2. Supabase Auth setup

In Supabase:

1. Go to Authentication > Providers.
2. Keep Email enabled.
3. Prefer manually created or invited users only. Do not enable open public signup for this project.
4. Go to Authentication > URL Configuration.
5. Set the Site URL to your GitHub Pages site.
6. Add the admin URL as an allowed redirect URL, for example:

```text
https://berghofsomalia.github.io/swsphotostories/admin/
```

For email/password login, the admin page uses `supabase.auth.signInWithPassword()`.

## 3. Create the admin allow-list table

Run this in the Supabase SQL editor.

```sql
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin users can read own row" ON public.admin_users;
CREATE POLICY "Admin users can read own row"
ON public.admin_users
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

GRANT SELECT ON public.admin_users TO authenticated;
```

## 4. Create the admin helper function

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
```

## 5. Add one admin user

First create a user in Authentication > Users. Then run:

```sql
INSERT INTO public.admin_users (user_id, email)
SELECT id, email
FROM auth.users
WHERE email = 'YOUR_EMAIL@example.org'
ON CONFLICT (user_id) DO UPDATE
SET email = EXCLUDED.email;
```

Check it:

```sql
SELECT au.user_id, au.email
FROM public.admin_users au;
```

## 6. Grants needed by the admin page

```sql
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.districts TO anon, authenticated;
GRANT SELECT ON public.tag_clusters TO anon, authenticated;
GRANT SELECT ON public.tags TO anon, authenticated;

GRANT SELECT, UPDATE ON public.stories TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.community_reflections TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.story_tags TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

## 7. RLS policies

These policies keep the public site read-only, while allowing only allow-listed admins to update story content and tags.

```sql
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read districts" ON public.districts;
CREATE POLICY "Public can read districts"
ON public.districts
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public can read tag clusters" ON public.tag_clusters;
CREATE POLICY "Public can read tag clusters"
ON public.tag_clusters
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public can read tags" ON public.tags;
CREATE POLICY "Public can read tags"
ON public.tags
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public can read published stories" ON public.stories;
CREATE POLICY "Public can read published stories"
ON public.stories
FOR SELECT
TO anon, authenticated
USING (status = 'published');

DROP POLICY IF EXISTS "Admins can read all stories" ON public.stories;
CREATE POLICY "Admins can read all stories"
ON public.stories
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update stories" ON public.stories;
CREATE POLICY "Admins can update stories"
ON public.stories
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public can read story tags for published stories" ON public.story_tags;
CREATE POLICY "Public can read story tags for published stories"
ON public.story_tags
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.stories s
    WHERE s.id = story_tags.story_id
      AND s.status = 'published'
  )
);

DROP POLICY IF EXISTS "Admins can read all story tags" ON public.story_tags;
CREATE POLICY "Admins can read all story tags"
ON public.story_tags
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert story tags" ON public.story_tags;
CREATE POLICY "Admins can insert story tags"
ON public.story_tags
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete story tags" ON public.story_tags;
CREATE POLICY "Admins can delete story tags"
ON public.story_tags
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Public can read published reflections for published stories" ON public.community_reflections;
CREATE POLICY "Public can read published reflections for published stories"
ON public.community_reflections
FOR SELECT
TO anon, authenticated
USING (
  status = 'published'
  AND EXISTS (
    SELECT 1
    FROM public.stories s
    WHERE s.id = community_reflections.story_id
      AND s.status = 'published'
  )
);

DROP POLICY IF EXISTS "Admins can read all reflections" ON public.community_reflections;
CREATE POLICY "Admins can read all reflections"
ON public.community_reflections
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert reflections" ON public.community_reflections;
CREATE POLICY "Admins can insert reflections"
ON public.community_reflections
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update reflections" ON public.community_reflections;
CREATE POLICY "Admins can update reflections"
ON public.community_reflections
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
```

## 8. Test the setup

After deploying the files, visit:

```text
https://berghofsomalia.github.io/swsphotostories/admin/
```

Expected behaviour:

- not signed in: the admin login screen appears
- signed in but not in `admin_users`: access denied screen appears
- signed in and in `admin_users`: story list and editor appear
- public users can still only read published rows

## 9. Security notes

- The admin page is hidden from navigation and marked `noindex`, but that is not real security.
- Real security is Supabase Auth plus RLS.
- Keep using only the publishable or legacy anon key in `assets/supabase-config.js`.
- Never expose the service role key in GitHub Pages.
- Keep all writes restricted to `authenticated` users where `public.is_admin()` returns true.
