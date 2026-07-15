# Temporary Supabase review access

The review switch is `REQUIRE_REVIEW_AUTH` in `assets/supabase-config.js`.
When enabled, the Home and Stories pages wait for a Supabase Auth session and
private `story-photos` images are loaded through one-hour signed URLs.

## Supabase dashboard

1. Keep the `story-photos` bucket **private**.
2. Under Authentication > Sign In / Providers > Email, disable public signup.
3. Create each reviewer under Authentication > Users. Confirm the user when it
   is created. Reviewers may sign in with their email, or with a username when
   their account uses `username@private.local`.
4. Add this Storage read policy in the SQL editor:

```sql
drop policy if exists "Reviewers can read story photos" on storage.objects;

create policy "Reviewers can read story photos"
on storage.objects
for select
to authenticated
using (bucket_id = 'story-photos');
```

The public story and text policies do not need to change. Existing admin write
policies remain separate; authenticated reviewers receive image read access but
not admin write access.

## Rollback after review

1. Set `REQUIRE_REVIEW_AUTH = false` in `assets/supabase-config.js`.
2. Make the `story-photos` bucket public again.
3. Optionally remove the `Reviewers can read story photos` policy and reviewer
   users. Leaving the policy in place is harmless while the bucket is public.

No other code rollback is required: with the switch disabled, the previous
public URL image path is used and the login screen and sign-out menu item are
omitted.
