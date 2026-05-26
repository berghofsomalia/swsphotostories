// Supabase browser configuration.
// Fill these two values from Supabase Project Settings > API.
// Keep service_role or secret keys out of this file. GitHub Pages exposes frontend code.

export const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'YOUR_PUBLISHABLE_OR_LEGACY_ANON_KEY';

// Optional. The site currently falls back to generated placeholders.
// When your Storage bucket is ready, set USE_SUPABASE_IMAGES to true and keep
// each story's photos in a folder named exactly like stories.code, for example:
// story-photos/BD01/01.jpg
export const USE_SUPABASE_IMAGES = false;
export const SUPABASE_STORY_PHOTO_BUCKET = 'story-photos';
