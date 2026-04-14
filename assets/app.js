import { initialiseApp } from './bootstrap.js';
import { qs } from './render.js';

initialiseApp().catch((error) => {
  console.error(error);
  const app = qs('#app');
  if (app) {
    app.innerHTML = '<div class="error-state">Failed to load the site data. Check the browser console and verify that data/stories.json and the images folder were published.</div>';
  }
});
