import { getUiText, getLandingText, STORAGE_KEYS, initialiseI18n } from './content.js';
import { fetchStories } from './api.js';

const state = {
  language: localStorage.getItem(STORAGE_KEYS.language) || 'en',
  theme:    localStorage.getItem(STORAGE_KEYS.theme)    || 'dark',
  stories:  [],
  currentStory: null,
  menuOpen: false
};

function saveState() {
  localStorage.setItem(STORAGE_KEYS.language, state.language);
  localStorage.setItem(STORAGE_KEYS.theme,    state.theme);
  document.documentElement.lang         = state.language === 'so' ? 'so' : 'en';
  document.documentElement.dataset.theme = state.theme;
}

function esc(v = '') {
  return String(v)
    .replaceAll('&',  '&amp;')
    .replaceAll('<',  '&lt;')
    .replaceAll('>',  '&gt;')
    .replaceAll('"',  '&quot;')
    .replaceAll("'", '&#39;');
}

function labelFor(entry, lang) {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  return entry[lang] || entry.en || '';
}

function pickRandom(stories, excludeId = null) {
  const pool = excludeId ? stories.filter((s) => s.id !== excludeId) : stories;
  return pool[Math.floor(Math.random() * pool.length)] || stories[0] || null;
}

// ── SVG icons (reused from /stories) ─────────────────────────────────────────
const icon = {
  chevronRight: () => '<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  shuffle:      () => '<svg viewBox="0 0 24 24"><path d="M16 3h5v5"/><path d="M4 20 20 4"/><path d="M21 16v5h-5"/><path d="M15 15 21 21"/><path d="M4 4l5 5"/></svg>',
  sliders:      () => '<svg viewBox="0 0 24 24"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/></svg>',
  bookmark:     () => '<svg viewBox="0 0 24 24"><path d="M6 4h12v16l-6-4-6 4z"/></svg>',
  menu:         () => '<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>',
  close:        () => '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  home:         () => '<svg viewBox="0 0 24 24"><path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10.5V20h11V10.5"/></svg>',
  about:        () => '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01"/><path d="M11 12h1v4h1"/></svg>'
};

// ── Render ────────────────────────────────────────────────────────────────────

function renderPage() {
  saveState();
  const app = document.querySelector('#app');
  if (!app) return;

  const t       = getUiText(state.language);
  const landing = getLandingText(state.language);
  const story   = state.currentStory;

  document.title = t.siteTitle;

  // Flat context strips — same as /stories
  const nexusLine = (landing.section1NexusLines || []).slice(1).join(' · ');
  const titleLine = (landing.section1TitleLines || []).join(' · ');

  // Lead image: story images are stored relative to /stories/
  const leadSrc = story ? `stories/${story.images?.[0] || ''}` : '';

  // Saved count from localStorage
  let savedCount = 0;
  try { savedCount = JSON.parse(localStorage.getItem(STORAGE_KEYS.saved) || '[]').length; } catch {}

  const storyCard = story ? `
    <div class="home-card">
      <div class="home-card-image">
        <img src="${esc(leadSrc)}" alt="${esc(story.storyteller)}" loading="eager">
      </div>
      <div class="home-card-body">
        <p class="home-card-name">${esc(story.storyteller)}</p>
        <p class="home-card-teaser">${esc(labelFor(story.summary, state.language))}</p>
        <div class="home-card-actions">
          <a class="action-button" href="stories/?code=${esc(story.id)}">
            ${icon.chevronRight()}<span>${esc(t.readStory)}</span>
          </a>
          <button type="button" class="action-button" data-action="another-story">
            ${icon.shuffle()}<span>${esc(t.anotherStory)}</span>
          </button>
          <a class="action-button" href="stories/#gallery">
            ${icon.sliders()}<span>${esc(t.exploreFilters)}</span>
          </a>
          <a class="action-button" href="stories/?saved=1">
            ${icon.bookmark()}<span>${esc(t.saved)}${savedCount > 0 ? ` (${savedCount})` : ''}</span>
          </a>
        </div>
      </div>
    </div>
  ` : `<div class="home-loading">${esc(t.loading)}</div>`;

  // Menu panel — shown/hidden; contains the same switchers for returning users
  const menuPanel = state.menuOpen ? `
    <div class="home-menu-backdrop" data-action="close-menu"></div>
    <div class="home-menu-panel">
      <div class="utility-menu-pill utility-menu-pill--single">
        <a class="utility-menu-control utility-menu-control--single" href="./">
          <span class="utility-menu-control-copy">
            <span class="utility-menu-control-icon">${icon.home()}</span>
            <span>${esc(t.home)}</span>
          </span>
        </a>
      </div>
      <div class="utility-menu-pill utility-menu-pill--single">
        <a class="utility-menu-control utility-menu-control--single" href="about/">
          <span class="utility-menu-control-copy">
            <span class="utility-menu-control-icon">${icon.about()}</span>
            <span>${esc(t.about)}</span>
          </span>
        </a>
      </div>
      <div class="utility-menu-pill utility-menu-pill--single">
        <a class="utility-menu-control utility-menu-control--single" href="stories/?saved=1">
          <span class="utility-menu-control-copy">
            <span class="utility-menu-control-icon">${icon.bookmark()}</span>
            <span>${esc(t.saved)}</span>
          </span>
          ${savedCount > 0 ? `<span class="utility-menu-badge">${savedCount}</span>` : ''}
        </a>
      </div>
      <div class="utility-menu-group">
        <div class="utility-menu-pill utility-menu-switchers" role="group" aria-label="Language">
          <button type="button" class="utility-menu-control ${state.language === 'so' ? 'is-active' : ''}" data-action="set-language" data-value="so">${esc(t.shortSo)}</button>
          <button type="button" class="utility-menu-control ${state.language === 'en' ? 'is-active' : ''}" data-action="set-language" data-value="en">${esc(t.shortEn)}</button>
        </div>
      </div>
      <div class="utility-menu-group">
        <div class="utility-menu-pill utility-menu-switchers" role="group" aria-label="Theme">
          <button type="button" class="utility-menu-control ${state.theme === 'dark' ? 'is-active' : ''}" data-action="set-theme" data-value="dark">${esc(t.dark)}</button>
          <button type="button" class="utility-menu-control ${state.theme === 'light' ? 'is-active' : ''}" data-action="set-theme" data-value="light">${esc(t.light)}</button>
        </div>
      </div>
    </div>
  ` : '';

  app.innerHTML = `
    <div class="home-shell">

      <div class="context-strip context-strip--top">${esc(nexusLine)}</div>
      <div class="context-strip context-strip--bottom">${esc(titleLine)}</div>

      <!-- Always-visible switchers + menu toggle in top-right -->
      <div class="home-controls">
        <div class="home-switchers">
          <div class="home-switcher-row" role="group" aria-label="Language">
            <button type="button" class="${state.language === 'so' ? 'is-active' : ''}" data-action="set-language" data-value="so">${esc(t.shortSo)}</button>
            <button type="button" class="${state.language === 'en' ? 'is-active' : ''}" data-action="set-language" data-value="en">${esc(t.shortEn)}</button>
          </div>
          <div class="home-switcher-row" role="group" aria-label="Theme">
            <button type="button" class="${state.theme === 'dark' ? 'is-active' : ''}" data-action="set-theme" data-value="dark">${esc(t.dark)}</button>
            <button type="button" class="${state.theme === 'light' ? 'is-active' : ''}" data-action="set-theme" data-value="light">${esc(t.light)}</button>
          </div>
        </div>
        <button type="button" class="home-menu-toggle" data-action="toggle-menu"
          aria-label="${esc(t.menu)}" aria-expanded="${state.menuOpen}">
          ${state.menuOpen ? icon.close() : icon.menu()}
        </button>
        ${menuPanel}
      </div>

      <main class="home-main">
        ${storyCard}
      </main>

    </div>
  `;
}

function attachListeners() {
  document.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const { action, value } = target.dataset;

    if (action === 'toggle-menu') {
      state.menuOpen = !state.menuOpen;
      renderPage();
      return;
    }
    if (action === 'close-menu') {
      state.menuOpen = false;
      renderPage();
      return;
    }
    if (action === 'set-language') {
      state.language = value === 'so' ? 'so' : 'en';
      state.menuOpen = false;
      await initialiseI18n(state.language);
      renderPage();
      return;
    }
    if (action === 'set-theme') {
      state.theme = value === 'light' ? 'light' : 'dark';
      state.menuOpen = false;
      renderPage();
      return;
    }
    if (action === 'another-story') {
      state.currentStory = pickRandom(state.stories, state.currentStory?.id);
      renderPage();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.menuOpen) {
      state.menuOpen = false;
      renderPage();
    }
  });
}

async function init() {
  attachListeners();
  await Promise.all([
    initialiseI18n(state.language),
    fetchStories().then((stories) => {
      state.stories = stories;
      state.currentStory = pickRandom(stories);
    })
  ]);
  renderPage();
}

init().catch((err) => {
  console.error(err);
  const app = document.querySelector('#app');
  if (app) app.innerHTML = '<div class="error-state">Failed to load.</div>';
});
