import { getUiText, getLandingText, STORAGE_KEYS, initialiseI18n } from './content.js';
import { ensureStoryImages, fetchStories } from './api.js';

const state = {
  language:     localStorage.getItem(STORAGE_KEYS.language) || 'en',
  theme:        localStorage.getItem(STORAGE_KEYS.theme)    || 'dark',
  stories:      [],
  currentStory: null,
  menuOpen:     false,
  savedOpen:    false,
  savedIds:     [],
  storyTrail:   [],
  trailIndex:   -1
};

// Load saved IDs from localStorage
try { state.savedIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.saved) || '[]').map(String); } catch {}

function savePrefs() {
  localStorage.setItem(STORAGE_KEYS.language, state.language);
  localStorage.setItem(STORAGE_KEYS.theme,    state.theme);
  document.documentElement.lang          = state.language === 'so' ? 'so' : 'en';
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

// ── SVG icons ─────────────────────────────────────────────────────────────────
const icon = {
  chevronLeft:  () => '<svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg>',
  chevronRight: () => '<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  shuffle:      () => '<svg viewBox="0 0 24 24"><path d="M16 3h5v5"/><path d="M4 20 20 4"/><path d="M21 16v5h-5"/><path d="M15 15 21 21"/><path d="M4 4l5 5"/></svg>',
  sliders:      () => '<svg viewBox="0 0 24 24"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/></svg>',
  bookmark:     () => '<svg viewBox="0 0 24 24"><path d="M6 4h12v16l-6-4-6 4z"/></svg>',
  menu:         () => '<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>',
  close:        () => '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  home:         () => '<svg viewBox="0 0 24 24"><path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10.5V20h11V10.5"/></svg>',
  about:        () => '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01"/><path d="M11 12h1v4h1"/></svg>',
  glasses:      () => '<svg viewBox="0 0 24 24"><circle cx="7.5" cy="14" r="3.2"/><circle cx="16.5" cy="14" r="3.2"/><path d="M10.7 13.5c.7-.5 1.9-.5 2.6 0"/><path d="M4.5 13.2 3 8.5"/><path d="M19.5 13.2 21 8.5"/></svg>'
};

// ── Saved drawer (same logic as /stories renderSavedDrawer) ───────────────────
function renderSavedDrawer(t) {
  const savedStories = state.stories.filter((s) => state.savedIds.includes(s.id));
  return `
    ${state.savedOpen
      ? `<button type="button" class="saved-drawer-backdrop is-open" data-action="close-saved" aria-label="${esc(t.close)}"></button>`
      : ''}
    <aside class="saved-drawer ${state.savedOpen ? 'is-open' : ''}" aria-hidden="${!state.savedOpen}">
      <div class="drawer-header drawer-header--inline">
        <div class="drawer-title-row">
          <button type="button" class="icon-button drawer-close-button" data-action="close-saved" aria-label="${esc(t.close)}">${icon.close()}</button>
          <div class="drawer-title">${esc(t.savedPhotostories)}</div>
        </div>
      </div>
      <div class="drawer-body">
        ${savedStories.length === 0
          ? `<div class="drawer-empty">${esc(t.noSaved)}</div>`
          : savedStories.map((s) => `
            <div class="saved-item">
              <a class="saved-item-main" href="stories/?code=${esc(s.id)}">
                <div class="saved-thumb">
                  <img src="${esc(s.images?.[0] || '')}" alt="${esc(s.storyteller)}" style="width:100%;height:100%;object-fit:cover;">
                </div>
                <div class="saved-copy">
                  <div class="saved-name">${esc(s.storyteller)}</div>
                  <div class="saved-summary">${esc(labelFor(s.summary, state.language))}</div>
                </div>
              </a>
              <button type="button" class="saved-remove-button" data-action="remove-saved" data-value="${esc(s.id)}" aria-label="${esc(t.close)}">${icon.close()}</button>
            </div>
          `).join('')}
      </div>
    </aside>
  `;
}

// ── Unified menu (always contains the switchers) ──────────────────────────────
function renderMenu(t) {
  // When menu is closed: show only the toggle button
  // When menu is open: show full panel (with switchers inside)
  const savedCount = state.savedIds.length;
  return `
    <div class="utility-menu-shell home-menu-shell">
      ${state.menuOpen
        ? `<button type="button" class="utility-menu-backdrop" data-action="close-menu" aria-label="${esc(t.close)}"></button>`
        : ''}
      <div class="utility-menu ${state.menuOpen ? 'is-open' : ''}">
        <button type="button" class="utility-menu-toggle" data-action="toggle-menu"
          aria-label="${esc(t.menu)}" aria-expanded="${state.menuOpen}">
          ${icon.menu()}
        </button>
        <div class="utility-menu-panel" aria-hidden="${!state.menuOpen}">

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
            <button type="button" class="utility-menu-control utility-menu-control--single" data-action="open-saved">
              <span class="utility-menu-control-copy">
                <span class="utility-menu-control-icon">${icon.bookmark()}</span>
                <span>${esc(t.saved)}</span>
              </span>
              ${savedCount > 0 ? `<span class="utility-menu-badge">${savedCount}</span>` : ''}
            </button>
          </div>


        </div>
      </div>
    </div>
  `;
}

function renderHomeSwitchers(t) {
  const soLabel = 'Soomali';
  const enLabel = 'English';
  return `
    <div class="home-inline-switchers" aria-label="Display options">
      <div class="home-inline-switcher" role="group" aria-label="Language">
        <button type="button" class="home-switch-button ${state.language === 'so' ? 'is-active' : ''}" data-action="set-language" data-value="so">${esc(soLabel)}</button>
        <button type="button" class="home-switch-button ${state.language === 'en' ? 'is-active' : ''}" data-action="set-language" data-value="en">${esc(enLabel)}</button>
      </div>
      <div class="home-inline-switcher" role="group" aria-label="Theme">
        <button type="button" class="home-switch-button ${state.theme === 'light' ? 'is-active' : ''}" data-action="set-theme" data-value="light">${esc(t.light)}</button>
        <button type="button" class="home-switch-button ${state.theme === 'dark' ? 'is-active' : ''}" data-action="set-theme" data-value="dark">${esc(t.dark)}</button>
      </div>
    </div>
  `;
}

function renderLoading() {
  savePrefs();
  const app = document.querySelector('#app');
  if (!app) return;
  const loadingText = state.language === 'so' ? 'Bogga waa la raraya…' : 'Loading…';
  app.innerHTML = `<div class="home-shell"><div class="loading-state loading-state--page"><span class="loading-spinner" aria-hidden="true"></span><span>${esc(loadingText)}</span></div></div>`;
}

async function setHomeStory(story, options = {}) {
  if (!story) return;
  state.currentStory = story;
  if (options.push !== false) {
    state.storyTrail = state.storyTrail.slice(0, state.trailIndex + 1);
    state.storyTrail.push(story.id);
    state.trailIndex = state.storyTrail.length - 1;
  }
  renderPage();
  await ensureStoryImages(story);
  renderPage();
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderPage() {
  savePrefs();
  const app = document.querySelector('#app');
  if (!app) return;

  const t       = getUiText(state.language);
  const landing = getLandingText(state.language);
  const story   = state.currentStory;

  document.title = t.siteTitle;

  const leadSrc = story?.images?.[0] || '';

  const storyCard = story ? `
    <div class="home-card">
      <div class="home-card-image">
        <img src="${esc(leadSrc)}" alt="${esc(story.storyteller)}" loading="eager">
      </div>
      <div class="home-card-body">
        <p class="home-card-teaser">${esc(labelFor(story.summary, state.language))}</p>
        <div class="home-card-actions">
          <div class="home-card-action-row home-card-action-row--primary">
            <a class="action-button" href="stories/?code=${esc(story.id)}">
              ${icon.glasses()}<span>${esc(t.readStory)}</span>
            </a>
            <a class="action-button" href="stories/#gallery">
              ${icon.sliders()}<span>${esc(t.exploreFilters)}</span>
            </a>
          </div>
          <div class="home-card-action-row home-card-action-row--nav">
            <button type="button" class="action-button home-random-nav ${state.trailIndex <= 0 ? 'is-disabled' : ''}" data-action="previous-home-story" aria-label="Previous story" ${state.trailIndex <= 0 ? 'disabled' : ''}>
              ${icon.chevronLeft()}<span>${esc(t.previousStory || 'Previous')}</span>
            </button>
            <button type="button" class="action-button home-random-nav" data-action="next-home-story" aria-label="Next random story">
              ${icon.chevronRight()}<span>${esc(t.nextStory || 'Next random')}</span>
            </button>
          </div>
        </div>
        ${renderHomeSwitchers(t)}
      </div>
    </div>
  ` : `<div class="home-loading">${esc(t.loading)}</div>`;

  app.innerHTML = `
    <div class="home-shell">

      ${renderMenu(t)}

      <main class="home-main">
        <div class="home-hero-grid">
          <div class="landing-copy-card landing-copy-card--nexus home-badge-nexus" aria-hidden="true">
            <p>${(landing.section1NexusLines || []).map((l) => `<span>${esc(l)}</span>`).join('')}</p>
          </div>
          ${storyCard}
          <div class="landing-copy-card landing-copy-card--title home-badge-title" aria-hidden="true">
            <p>${(landing.section1TitleLines || []).map((l) => `<span>${esc(l)}</span>`).join('')}</p>
          </div>
        </div>
      </main>

      ${renderSavedDrawer(t)}
    </div>
  `;
}

// ── Listeners ─────────────────────────────────────────────────────────────────
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
    if (action === 'open-saved') {
      state.menuOpen  = false;
      state.savedOpen = true;
      renderPage();
      return;
    }
    if (action === 'close-saved') {
      state.savedOpen = false;
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
      state.theme    = value === 'light' ? 'light' : 'dark';
      state.menuOpen = false;
      renderPage();
      return;
    }
    if (action === 'remove-saved') {
      state.savedIds = state.savedIds.filter((id) => String(id) !== String(value));
      localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(state.savedIds.map(String)));
      renderPage();
      return;
    }
    if (action === 'previous-home-story') {
      if (state.trailIndex > 0) {
        state.trailIndex -= 1;
        const previousId = state.storyTrail[state.trailIndex];
        const previous = state.stories.find((story) => String(story.id) === String(previousId));
        await setHomeStory(previous, { push: false });
      }
      return;
    }
    if (action === 'next-home-story') {
      await setHomeStory(pickRandom(state.stories, state.currentStory?.id));
      return;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.savedOpen) { state.savedOpen = false; renderPage(); }
      else if (state.menuOpen) { state.menuOpen = false; renderPage(); }
    }
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  attachListeners();
  renderLoading();
  await Promise.all([
    initialiseI18n(state.language),
    fetchStories().then((stories) => {
      state.stories      = stories;
      state.currentStory = pickRandom(stories);
      if (state.currentStory) {
        state.storyTrail = [state.currentStory.id];
        state.trailIndex = 0;
      }
    })
  ]);
  renderPage();
  if (state.currentStory) {
    await ensureStoryImages(state.currentStory);
    renderPage();
  }
}

init().catch((err) => {
  console.error(err);
  const app = document.querySelector('#app');
  if (app) app.innerHTML = '<div class="error-state">Failed to load. Check the browser console and verify Supabase configuration.</div>';
});
