import { getUiText, getLandingText, STORAGE_KEYS, initialiseI18n } from './content.js?v=20260607-home-carousel23';
import { ensureStoryImages, fetchStories } from './api.js';
import { renderMenu as renderSharedMenu } from './menu.js';

const HOME_CAROUSEL_INTERVAL_MS = 7000;

const state = {
  language:     localStorage.getItem(STORAGE_KEYS.language) || 'en',
  theme:        localStorage.getItem(STORAGE_KEYS.theme)    || 'dark',
  stories:      [],
  currentStory: null,
  menuOpen:     false,
  savedOpen:    false,
  savedIds:     [],
  storyTrail:   [],
  trailIndex:   -1,
  carouselPaused: false,
  carouselTimer:  null,
  carouselBusy:   false,
  queuedStory:    null,
  queuedStoryReady: false,
  queuedStoryPromise: null,
  animateStoryContent: false
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
  const blockedId = excludeId == null ? null : String(excludeId);
  const pool = blockedId ? stories.filter((s) => String(s.id) !== blockedId) : stories;
  return pool[Math.floor(Math.random() * pool.length)] || stories[0] || null;
}

function findStoryById(id) {
  return state.stories.find((story) => String(story.id) === String(id)) || null;
}

function pickNextRandomStory() {
  const seenIds = new Set(state.storyTrail.map(String));
  const unseenStories = state.stories.filter((story) => !seenIds.has(String(story.id)));
  const pool = unseenStories.length ? unseenStories : state.stories;
  return pickRandom(pool, state.currentStory?.id);
}

function stopHomeCarousel() {
  if (!state.carouselTimer) return;
  window.clearInterval(state.carouselTimer);
  state.carouselTimer = null;
}

function startHomeCarousel() {
  stopHomeCarousel();
  if (state.carouselPaused || state.stories.length <= 1) return;
  state.carouselTimer = window.setInterval(() => {
    void goNextHomeStory({ resetTimer: false });
  }, HOME_CAROUSEL_INTERVAL_MS);
}

function restartHomeCarousel() {
  if (!state.carouselPaused) startHomeCarousel();
}

function hasUsableLeadImage(story) {
  return !!story?.images?.[0] && !isLoadingImageSrc(story.images[0]);
}

function clearQueuedHomeStory() {
  state.queuedStory = null;
  state.queuedStoryReady = false;
  state.queuedStoryPromise = null;
}

function preloadNextHomeStory() {
  if (state.stories.length <= 1) {
    clearQueuedHomeStory();
    return;
  }
  const nextStory = pickNextRandomStory();
  if (!nextStory) {
    clearQueuedHomeStory();
    return;
  }
  if (String(state.queuedStory?.id) === String(nextStory.id)) return;
  state.queuedStory = nextStory;
  state.queuedStoryReady = hasUsableLeadImage(nextStory);
  state.queuedStoryPromise = ensureStoryImages(nextStory)
    .then(() => {
      if (String(state.queuedStory?.id) === String(nextStory.id)) {
        state.queuedStoryReady = hasUsableLeadImage(nextStory);
      }
    })
    .catch((err) => {
      console.warn('Failed to preload home carousel image', err);
      if (String(state.queuedStory?.id) === String(nextStory.id)) clearQueuedHomeStory();
    });
}

function takeQueuedHomeStory() {
  if (!state.queuedStory || !state.queuedStoryReady) return null;
  const story = state.queuedStory;
  clearQueuedHomeStory();
  return story;
}

async function goPreviousHomeStory({ resetTimer = true } = {}) {
  if (state.carouselBusy || state.trailIndex <= 0) return;
  state.carouselBusy = true;
  try {
    state.trailIndex -= 1;
    const previous = findStoryById(state.storyTrail[state.trailIndex]);
    if (previous) await setHomeStory(previous, { push: false, preloaded: hasUsableLeadImage(previous) });
  } finally {
    state.carouselBusy = false;
    if (resetTimer) restartHomeCarousel();
  }
}

async function goNextHomeStory({ resetTimer = true } = {}) {
  if (state.carouselBusy || state.stories.length === 0) return;
  state.carouselBusy = true;
  try {
    if (state.trailIndex < state.storyTrail.length - 1) {
      state.trailIndex += 1;
      const next = findStoryById(state.storyTrail[state.trailIndex]);
      if (next) {
        await setHomeStory(next, { push: false, preloaded: hasUsableLeadImage(next) });
        return;
      }
      state.storyTrail = state.storyTrail.slice(0, state.trailIndex);
    }
    const nextRandom = takeQueuedHomeStory() || pickNextRandomStory();
    await setHomeStory(nextRandom, { preloaded: hasUsableLeadImage(nextRandom) });
  } finally {
    state.carouselBusy = false;
    if (resetTimer) restartHomeCarousel();
  }
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
const icon = {
  chevronLeft:  () => '<svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg>',
  chevronRight: () => '<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  pause:        () => '<svg viewBox="0 0 24 24"><path d="M9 5v14"/><path d="M15 5v14"/></svg>',
  play:         () => '<svg viewBox="0 0 24 24"><path d="M7 5v14l11-7-11-7Z"/></svg>',
  sliders:      () => '<svg viewBox="0 0 24 24"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/></svg>',
  close:        () => '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
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
  return renderSharedMenu(state, {
    esc,
    t,
    basePaths: { home: './', about: 'about/', stories: 'stories/' },
    savedCount: state.savedIds.length,
    savedAction: 'open-saved',
    showSwitchers: false,
    shellClass: 'home-menu-shell'
  });
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

function renderHomeTitleLines(lines = []) {
  return lines
    .flatMap((line) => {
      if (line === 'Visual storytelling') return ['Visual', 'storytelling'];
      if (line === 'from Southwest State, Somalia') return ['from Southwest', 'State, Somalia'];
      if (line === 'ka yimid Koonfur Galbeed, Soomaaliya') return ['ka yimid Koonfur', 'Galbeed, Soomaaliya'];
      return [line];
    })
    .map((line) => `<span>${esc(line)}</span>`)
    .join('');
}

function isLoadingImageSrc(src = '') {
  const value = String(src || '');
  return !value || value.startsWith('data:image/svg+xml');
}

function imageLoadingMarkup(code = '') {
  const safeCode = esc(String(code || 'story').trim() || 'story');
  return `
    <div class="image-loading-panel" role="status" aria-label="Loading image ${safeCode}">
      <span class="image-loading-pulse" aria-hidden="true"></span>
    </div>
  `;
}

function syncHomeImageLoadStates(root = document) {
  root.querySelectorAll('img[data-image-fade]').forEach((image) => {
    if (image.naturalWidth > 0) {
      image.classList.add('is-image-loaded');
      return;
    }
    image.classList.remove('is-image-loaded');
    if (!image.dataset.imageLoadWatch) {
      image.dataset.imageLoadWatch = 'true';
      image.addEventListener('load', () => image.classList.add('is-image-loaded'), { once: true });
    }
  });
  root.querySelectorAll('[data-story-fade]').forEach((element) => {
    element.classList.add('is-home-content-loaded');
  });
  state.animateStoryContent = false;
}

function fadeOutCurrentHomeStoryContent() {
  const homeCard = document.querySelector('.home-card');
  if (!homeCard || homeCard.querySelector('.image-loading-panel')) return Promise.resolve();
  homeCard.classList.add('is-home-story-exiting');
  return new Promise((resolve) => window.setTimeout(resolve, 180));
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
  const shouldFadeOut = options.preloaded
    && state.currentStory
    && String(state.currentStory.id) !== String(story.id);
  if (shouldFadeOut) await fadeOutCurrentHomeStoryContent();
  state.animateStoryContent = state.currentStory
    ? String(state.currentStory.id) !== String(story.id)
    : false;
  state.currentStory = story;
  if (options.push !== false) {
    state.storyTrail = state.storyTrail.slice(0, state.trailIndex + 1);
    if (String(state.storyTrail[state.storyTrail.length - 1]) !== String(story.id)) {
      state.storyTrail.push(story.id);
    }
    state.trailIndex = state.storyTrail.length - 1;
  }
  if (!options.preloaded) {
    renderPage();
    await ensureStoryImages(story);
  } else if (!hasUsableLeadImage(story)) {
    await ensureStoryImages(story);
  }
  renderPage();
  preloadNextHomeStory();
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
  const leadImageLoading = isLoadingImageSrc(leadSrc);
  const leadImageLoadedClass = hasUsableLeadImage(story) && !state.animateStoryContent ? ' is-image-loaded' : '';
  const storyContentLoadedClass = state.animateStoryContent ? '' : ' is-home-content-loaded';
  const readLabel = t.homeRead || t.readStory || 'Read';
  const exploreLabel = t.homeExploreAll || t.exploreFilters || 'Explore all';
  const carouselLabel = t.homeCarouselControls || 'Story carousel controls';
  const pauseLabel = state.carouselPaused
    ? (t.resumeCarousel || 'Resume carousel')
    : (t.pauseCarousel || 'Pause carousel');
  const nextLabel = state.trailIndex < state.storyTrail.length - 1
    ? (t.nextStory || 'Next story')
    : (t.nextRandomStory || t.nextStory || 'Next random story');

  const storyCard = story ? `
    <div class="home-card">
      <div class="home-card-image">
        ${leadImageLoading
          ? imageLoadingMarkup(story.code || story.id)
          : `<img class="${leadImageLoadedClass.trim()}" data-image-fade src="${esc(leadSrc)}" alt="${esc(story.storyteller)}" loading="eager">`}
      </div>
      <div class="home-card-body">
        <div class="home-card-primary-panel">
          <p class="home-card-teaser${storyContentLoadedClass}" data-story-fade>${esc(labelFor(story.summary, state.language))}</p>
          <div class="home-card-actions home-card-actions--primary">
            <div class="home-card-action-row home-card-action-row--top">
              <div class="home-card-action-row--carousel" aria-label="${esc(carouselLabel)}">
                <button type="button" class="action-button home-carousel-button ${state.trailIndex <= 0 ? 'is-disabled' : ''}" data-action="previous-home-story" aria-label="${esc(t.previousStory || 'Previous story')}" ${state.trailIndex <= 0 ? 'disabled' : ''}>
                  ${icon.chevronLeft()}
                </button>
                <button type="button" class="action-button home-carousel-button home-carousel-button--pause" data-action="toggle-home-carousel" aria-label="${esc(pauseLabel)}" aria-pressed="${state.carouselPaused ? 'true' : 'false'}">
                  ${state.carouselPaused ? icon.play() : icon.pause()}
                </button>
                <button type="button" class="action-button home-carousel-button" data-action="next-home-story" aria-label="${esc(nextLabel)}">
                  ${icon.chevronRight()}
                </button>
              </div>
              <a class="action-button home-read-button" href="stories/?code=${esc(story.id)}">
                ${icon.glasses()}<span>${esc(readLabel)}</span>
              </a>
            </div>
          </div>
        </div>
        <div class="home-card-secondary-panel">
          ${renderHomeSwitchers(t)}
          <div class="home-card-actions home-card-actions--secondary">
            <div class="home-card-action-row home-card-action-row--secondary">
              <a class="action-button home-explore-button" href="stories/#gallery">
                ${icon.sliders()}<span>${esc(exploreLabel)}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  ` : `<div class="home-loading">${esc(t.loading)}</div>`;

  app.innerHTML = `
    <div class="home-shell">

      ${renderMenu(t)}

      <main class="home-main">
        <div class="home-hero-grid">
          <div class="home-badge-nexus" aria-hidden="true">
            <p>${(landing.section1NexusLines || []).map((l) => `<span>${esc(l)}</span>`).join('')}</p>
          </div>
          ${storyCard}
          <div class="home-badge-title" aria-hidden="true">
            <p>${renderHomeTitleLines(landing.section1TitleLines || [])}</p>
          </div>
        </div>
      </main>

      ${renderSavedDrawer(t)}
    </div>
  `;
  const shouldDelayStoryAnimation = state.animateStoryContent;
  if (shouldDelayStoryAnimation) {
    requestAnimationFrame(() => requestAnimationFrame(() => syncHomeImageLoadStates()));
  } else {
    requestAnimationFrame(() => syncHomeImageLoadStates());
  }
}

// ── Listeners ─────────────────────────────────────────────────────────────────
function attachListeners() {
  document.addEventListener('load', (e) => {
    if (e.target?.matches?.('img[data-image-fade]')) {
      e.target.classList.add('is-image-loaded');
    }
  }, true);

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
      await goPreviousHomeStory();
      return;
    }
    if (action === 'next-home-story') {
      await goNextHomeStory();
      return;
    }
    if (action === 'toggle-home-carousel') {
      state.carouselPaused = !state.carouselPaused;
      if (state.carouselPaused) stopHomeCarousel();
      else startHomeCarousel();
      renderPage();
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
    preloadNextHomeStory();
  }
  startHomeCarousel();
}

init().catch((err) => {
  console.error(err);
  const app = document.querySelector('#app');
  if (app) app.innerHTML = '<div class="error-state">Failed to load. Check the browser console and verify Supabase configuration.</div>';
});
