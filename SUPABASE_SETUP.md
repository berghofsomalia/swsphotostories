# Supabase connection setup

This version keeps the existing UI but fetches story data from Supabase when credentials are configured.

## 1. Add browser credentials

Open `assets/supabase-config.js` and replace the placeholders:

```js
export const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'YOUR_PUBLISHABLE_OR_LEGACY_ANON_KEY';
```

Use the public publishable key or legacy anon key from Supabase Project Settings > API.
Do not use the service role key in GitHub Pages or any frontend file.

## 2. Required tables and relationships

The frontend expects these public tables and relationship names:

- `stories`
- `districts`
- `story_tags`
- `tags`
- `tag_clusters`
- `community_reflections`

The query expects `stories.district_id` to reference `districts.id`, `story_tags.story_id` to reference `stories.id`, `story_tags.tag_id` to reference `tags.id`, and `tags.cluster_id` to reference `tag_clusters.id`.

## 3. RLS

Make sure anonymous users can read:

- published stories only
- districts
- tags
- tag clusters
- story_tags belonging to published stories
- published community reflections belonging to published stories

## 4. Images

Right now the UI uses generated placeholders.

When Supabase Storage is ready, upload files like this:

```text
story-photos/
  BD01/
    01.jpg
    02.jpg
  BW03/
    01.jpg
    02.webp
```

Then update `assets/supabase-config.js`:

```js
export const USE_SUPABASE_IMAGES = true;
export const SUPABASE_STORY_PHOTO_BUCKET = 'story-photos';
```

The folder name must match `stories.code` exactly.

## 5. Local fallback

If Supabase credentials are still placeholders, the site loads `data/stories.json` so you can preview layout changes before connecting the database.
