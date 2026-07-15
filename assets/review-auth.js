import {
  REQUIRE_REVIEW_AUTH,
  REVIEW_AUTH_USERNAME_DOMAIN
} from './supabase-config.js';
import { getSupabaseClient, isSupabaseConfigured } from './supabase-client.js';

const IMAGE_CACHE_PREFIX = 'photostory_images_';

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function clearSignedImageCache() {
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith(IMAGE_CACHE_PREFIX))
    .forEach((key) => sessionStorage.removeItem(key));
}

function loginEmail(value = '') {
  const identity = String(value).trim().toLowerCase();
  if (!identity || identity.includes('@')) return identity;
  return `${identity}@${REVIEW_AUTH_USERNAME_DOMAIN}`;
}

function renderLogin(app, errorMessage = '') {
  app.innerHTML = `
    <main class="review-login-shell">
      <form class="review-login-card" data-review-login novalidate>
        <p class="review-login-kicker">Southwest State photostories</p>
        <h1>Private review</h1>
        <p class="review-login-intro">Enter the username and password provided with your review link.</p>
        <label>
          <span>Username or email</span>
          <input name="identity" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required />
        </label>
        <label>
          <span>Password</span>
          <input name="password" type="password" autocomplete="current-password" required />
        </label>
        <button type="submit">Sign in</button>
        <p class="review-login-error" data-review-login-error ${errorMessage ? '' : 'hidden'}>${escapeHtml(errorMessage)}</p>
      </form>
    </main>
  `;
}

export async function requireReviewSession(appSelector = '#app') {
  if (!REQUIRE_REVIEW_AUTH) return null;
  const app = document.querySelector(appSelector);
  if (!app) throw new Error(`Review login could not find ${appSelector}.`);
  if (!isSupabaseConfigured) {
    renderLogin(app, 'Supabase is not configured for review access.');
    throw new Error('Supabase is not configured for review access.');
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (data.session) return data.session;

  document.documentElement.classList.add('is-review-locked');
  renderLogin(app);

  return new Promise((resolve) => {
    const form = app.querySelector('[data-review-login]');
    const errorBox = app.querySelector('[data-review-login-error]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submit = form.querySelector('button[type="submit"]');
      const identity = form.elements.identity.value;
      const password = form.elements.password.value;
      errorBox.hidden = true;

      if (!identity.trim() || !password) {
        errorBox.textContent = 'Please enter both username and password.';
        errorBox.hidden = false;
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Signing in…';
      const result = await supabase.auth.signInWithPassword({
        email: loginEmail(identity),
        password
      });

      if (result.error || !result.data.session) {
        errorBox.textContent = 'Invalid username or password.';
        errorBox.hidden = false;
        submit.disabled = false;
        submit.textContent = 'Sign in';
        return;
      }

      clearSignedImageCache();
      document.documentElement.classList.remove('is-review-locked');
      app.innerHTML = '';
      resolve(result.data.session);
    });
  });
}

export async function signOutReviewSession() {
  const supabase = await getSupabaseClient();
  clearSignedImageCache();
  await supabase?.auth.signOut({ scope: 'local' });
  window.location.reload();
}
