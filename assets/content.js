export const STORAGE_KEYS = {
  language: 'photostory_language',
  gallerySession: 'photostory_gallery_session',
  saved: 'photostory_saved',
  theme: 'photostory_theme'
};

// ── i18n cache ────────────────────────────────────────────────────────────────
// Loaded once on first call to loadI18n(), then reused.
const cache = {};
const I18N_CACHE_VERSION = '20260607-home-carousel23';

/**
 * Loads the i18n JSON for a given language and caches it.
 * All callers in the app await initialiseI18n() before first render, so
 * getUiText() / getLandingText() / getGuidanceText() are always sync after that.
 *
 * To swap in a different translation source (e.g. a database API), replace
 * only this function — the rest of the module is unchanged.
 */
async function loadI18n(language) {
  if (cache[language]) return;
  const base = new URL('../i18n/', import.meta.url);
  const response = await fetch(`${base}${language}.json?v=${I18N_CACHE_VERSION}`);
  if (!response.ok) throw new Error(`Failed to load i18n/${language}.json (HTTP ${response.status})`);
  cache[language] = await response.json();
}

export async function initialiseI18n(language = 'en') {
  // Load the requested language; always ensure English is also loaded as fallback
  await Promise.all([loadI18n(language), language !== 'en' ? loadI18n('en') : Promise.resolve()]);
}

function get(language, section) {
  return (cache[language] || cache.en || {})[section] || {};
}

// ── Public API (same shape as before — callers don't change) ──────────────────

export function getUiText(language = 'en') {
  return get(language, 'ui') || get('en', 'ui');
}

export function getLandingText(language = 'en') {
  return get(language, 'landing') || get('en', 'landing');
}

export function getGuidanceText(language = 'en') {
  return get(language, 'guidance') || get('en', 'guidance');
}

export function labelFor(entry, language = 'en') {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  return entry[language] || entry.en || '';
}

export function actorLabel(actor, language = 'en') {
  const actors = get(language, 'actors') || get('en', 'actors');
  return actors[actor] || actor;
}
