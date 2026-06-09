import { initialiseApp } from './bootstrap.js?v=20260608-gallery-batches';
import { qs } from './render.js?v=20260608-gallery-batches';

initialiseApp().catch((error) => {
  console.error(error);
  const app = qs('#app');
  if (app) {
    app.innerHTML = '<div class="error-state">Failed to load the story archive. Check the browser console and verify your Supabase URL, key and RLS policies.</div>';
  }
});
