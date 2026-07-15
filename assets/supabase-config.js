// Supabase browser configuration.
// Fill these two values from Supabase Project Settings > API.
// Keep service_role or secret keys out of this file. GitHub Pages exposes frontend code.

export const SUPABASE_URL = 'https://rgxuqfbyhbtypsahqdcr.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_F2zIJicjf01D6KJUuFAtUw_lZdFJxZF';

// Optional. The site currently falls back to generated placeholders.
// When your Storage bucket is ready, set USE_SUPABASE_IMAGES to true and keep
// each story's photos in a folder named exactly like stories.code, for example:
// story-photos/BD01/01.jpg
export const USE_SUPABASE_IMAGES = true;
export const SUPABASE_STORY_PHOTO_BUCKET = 'story-photos';

// Temporary review access. When enabled, Home and Stories require an existing
// Supabase Auth user and private Storage images use short-lived signed URLs.
// Rollback after review: set this to false and make the bucket public again.
export const REQUIRE_REVIEW_AUTH = true;
export const REVIEW_AUTH_USERNAME_DOMAIN = 'private.local';
export const SIGNED_IMAGE_URL_TTL_SECONDS = 3600;
