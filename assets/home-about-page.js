import { getUiText, getLandingText, STORAGE_KEYS, initialiseI18n } from './content.js?v=20260607-home-carousel23';
import { ensureStoryImages, fetchHomeStories } from './api.js?v=20260715-private-images';
import { renderMenu as renderSharedMenu } from './menu.js';
import { requireReviewSession, signOutReviewSession } from './review-auth.js';
import { REQUIRE_REVIEW_AUTH } from './supabase-config.js';

const HOME_CAROUSEL_INTERVAL_MS = 10000;

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

function leadImageSrcFor(story) {
  return hasUsableLeadImage(story) ? story.images[0] : '';
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
  chevronDown:  () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  pause:        () => '<svg viewBox="0 0 24 24"><path d="M9 5v14"/><path d="M15 5v14"/></svg>',
  play:         () => '<svg viewBox="0 0 24 24"><path d="M7 5v14l11-7-11-7Z"/></svg>',
  sliders:      () => '<svg viewBox="0 0 24 24"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/></svg>',
  close:        () => '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  glasses:      () => '<svg viewBox="0 0 24 24"><circle cx="7.5" cy="14" r="3.2"/><circle cx="16.5" cy="14" r="3.2"/><path d="M10.7 13.5c.7-.5 1.9-.5 2.6 0"/><path d="M4.5 13.2 3 8.5"/><path d="M19.5 13.2 21 8.5"/></svg>'
};

let backgroundMountPromise = null;
let backgroundCarouselObserver = null;
let backgroundContextHandler = null;
const backgroundCarouselTimers = new Map();

function backgroundRoot() {
  return document.querySelector('#background-root');
}

function backgroundLabel() {
  return state.language === 'so' ? 'Akhri macluumaadka asalka ah' : 'Read the background';
}

function scrollToBackground() {
  const root = backgroundRoot();
  if (!root) return;
  root.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start'
  });
}

function hydrateDeferredImage(image) {
  if (!image || image.getAttribute('src') || !image.dataset.src) return;
  image.setAttribute('src', image.dataset.src);
}

function advanceBackgroundCarousel(carousel) {
  if (document.hidden || !carousel.isConnected) return;
  const slides = Array.from(carousel.querySelectorAll('.about-v2-carousel-image'));
  const bgSlides = Array.from(carousel.querySelectorAll('.about-v2-carousel-bg'));
  const bars = Array.from(carousel.querySelectorAll('.about-carousel-progress span'));
  if (slides.length < 2) return;

  const currentIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
  const nextIndex = (currentIndex + 1) % slides.length;
  const followingIndex = (nextIndex + 1) % slides.length;
  hydrateDeferredImage(slides[nextIndex]);
  hydrateDeferredImage(bgSlides[nextIndex]);
  hydrateDeferredImage(slides[followingIndex]);
  hydrateDeferredImage(bgSlides[followingIndex]);

  slides[currentIndex]?.classList.remove('is-active');
  bgSlides[currentIndex]?.classList.remove('is-active');
  bars[currentIndex]?.classList.remove('is-active');
  slides[nextIndex]?.classList.add('is-active');
  bgSlides[nextIndex]?.classList.add('is-active');
  bars[nextIndex]?.classList.add('is-active');

  const nextSrc = slides[nextIndex]?.getAttribute('src') || slides[nextIndex]?.dataset.src || '';
  if (nextSrc) {
    carousel.style.setProperty('--about-image-url', `url('${nextSrc}')`);
    carousel.closest('.about-v2-grid--two-col')?.style.setProperty('--about-image-url', `url('${nextSrc}')`);
  }
}

function stopBackgroundCarousel(carousel) {
  const timer = backgroundCarouselTimers.get(carousel);
  if (timer) window.clearInterval(timer);
  backgroundCarouselTimers.delete(carousel);
}

function startBackgroundCarousel(carousel) {
  if (backgroundCarouselTimers.has(carousel)) return;
  const slides = Array.from(carousel.querySelectorAll('.about-v2-carousel-image'));
  const bgSlides = Array.from(carousel.querySelectorAll('.about-v2-carousel-bg'));
  const currentIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
  const nextIndex = (currentIndex + 1) % slides.length;
  hydrateDeferredImage(slides[currentIndex]);
  hydrateDeferredImage(bgSlides[currentIndex]);
  hydrateDeferredImage(slides[nextIndex]);
  hydrateDeferredImage(bgSlides[nextIndex]);
  backgroundCarouselTimers.set(carousel, window.setInterval(() => advanceBackgroundCarousel(carousel), 7000));
}

function setupBackgroundCarousels(root) {
  backgroundCarouselObserver?.disconnect();
  backgroundCarouselTimers.forEach((timer) => window.clearInterval(timer));
  backgroundCarouselTimers.clear();

  backgroundCarouselObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) startBackgroundCarousel(entry.target);
      else stopBackgroundCarousel(entry.target);
    });
  }, { rootMargin: '20% 0px', threshold: 0.01 });

  root.querySelectorAll('[data-about-carousel]').forEach((carousel) => {
    backgroundCarouselObserver.observe(carousel);
  });
}

function setupBackgroundContextFlaps(wrapper) {
  if (backgroundContextHandler) window.removeEventListener('scroll', backgroundContextHandler);
  backgroundContextHandler = () => {
    const root = backgroundRoot();
    if (!root || !wrapper.isConnected) return;
    wrapper.classList.toggle('is-context-active', root.getBoundingClientRect().top <= 1);
  };
  window.addEventListener('scroll', backgroundContextHandler, { passive: true });
  backgroundContextHandler();
}

function resetBackground() {
  backgroundCarouselObserver?.disconnect();
  backgroundCarouselObserver = null;
  backgroundCarouselTimers.forEach((timer) => window.clearInterval(timer));
  backgroundCarouselTimers.clear();
  if (backgroundContextHandler) window.removeEventListener('scroll', backgroundContextHandler);
  backgroundContextHandler = null;
  backgroundMountPromise = null;
  const root = backgroundRoot();
  if (root) {
    root.className = '';
    root.innerHTML = '';
    delete root.dataset.mounted;
    delete root.dataset.language;
  }
}

function waitForAboutMarkup(frame) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const inspect = () => {
      const contentError = frame.contentDocument?.querySelector('.error-state');
      if (contentError) {
        reject(new Error(contentError.textContent?.trim() || 'The About text could not be loaded.'));
        return;
      }
      const main = frame.contentDocument?.querySelector('.about-v2-scroll');
      if (main?.querySelector('.about-v2-section--intro')) {
        resolve(main);
        return;
      }
      if (Date.now() - startedAt > 15000) {
        reject(new Error('Timed out while loading the background sections.'));
        return;
      }
      window.setTimeout(inspect, 80);
    };
    frame.addEventListener('load', inspect, { once: true });
  });
}

async function mountBackground({ scroll = true } = {}) {
  const root = backgroundRoot();
  if (!root) return;
  if (root.dataset.mounted === 'true' && root.dataset.language === state.language) {
    if (scroll) scrollToBackground();
    return;
  }
  if (backgroundMountPromise) {
    if (scroll) scrollToBackground();
    return backgroundMountPromise;
  }

  root.className = 'is-loading';
  root.innerHTML = '<div class="loading-state loading-state--page"><span class="loading-spinner" aria-hidden="true"></span><span>Loading background…</span></div>';
  if (scroll) scrollToBackground();

  backgroundMountPromise = (async () => {
    const frame = document.createElement('iframe');
    frame.hidden = true;
    frame.tabIndex = -1;
    frame.setAttribute('aria-hidden', 'true');
    frame.src = new URL('_about-source/', window.location.href).href;
    document.body.appendChild(frame);

    try {
      const sourceMain = await waitForAboutMarkup(frame);
      const sourceUrl = frame.contentWindow.location.href;
      const clonedMain = sourceMain.cloneNode(true);
      clonedMain.removeAttribute('id');
      clonedMain.querySelector('.about-title-panel')?.remove();
      const guideCopy = clonedMain.querySelector('.about-guide-copy');
      if (guideCopy) guideCopy.innerHTML = guideCopy.innerHTML.replace('...', String(state.stories.length));
      const homeGuideLink = clonedMain.querySelector('[data-about-home-link]');
      if (homeGuideLink) {
        homeGuideLink.href = '#home-carousel';
        homeGuideLink.dataset.action = 'scroll-home';
      }
      const intro = clonedMain.querySelector('.about-v2-section--intro');
      if (intro) intro.id = 'background-map';

      clonedMain.querySelectorAll('img').forEach((image) => {
        const src = image.getAttribute('src');
        if (src) image.setAttribute('src', new URL(src, sourceUrl).href);
        image.loading = 'lazy';
        image.removeAttribute('fetchpriority');
      });

      clonedMain.querySelectorAll('[data-about-carousel]').forEach((carousel) => {
        carousel.querySelectorAll('img').forEach((image) => {
          if (image.classList.contains('is-active')) return;
          const src = image.getAttribute('src');
          if (!src) return;
          image.dataset.src = src;
          image.removeAttribute('src');
        });
      });

      const wrapper = document.createElement('div');
      wrapper.className = 'intro-modal intro-modal--pdfstyle landing-page-shell about-v2-shell home-about-background';
      wrapper.appendChild(clonedMain);
      root.className = '';
      root.innerHTML = '';
      root.appendChild(wrapper);
      root.dataset.mounted = 'true';
      root.dataset.language = state.language;
      setupBackgroundCarousels(wrapper);
      setupBackgroundContextFlaps(wrapper);
      if (scroll) scrollToBackground();
    } finally {
      frame.remove();
      backgroundMountPromise = null;
    }
  })().catch((error) => {
    console.error(error);
    root.className = 'is-loading';
    root.innerHTML = '<div class="error-state">The background could not be loaded. Please try again.</div>';
    backgroundMountPromise = null;
  });

  return backgroundMountPromise;
}

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
          <div class="drawer-title">${esc(t.savedPhotostories)}</div>
          <button type="button" class="icon-button drawer-close-button" data-action="close-saved" aria-label="${esc(t.close)}">${icon.close()}</button>
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
    basePaths: { home: '#home-carousel', about: '#background-map', stories: 'stories/' },
    savedCount: state.savedIds.length,
    savedAction: 'open-saved',
    signOutAction: REQUIRE_REVIEW_AUTH ? 'review-sign-out' : '',
    showSwitchers: true,
    shellClass: 'home-menu-shell'
  });
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

// ── Crossfade helpers ──────────────────────────────────────────────────────────
// All visual transitions run here, directly on DOM nodes — no re-render mid-flight.

let _crossfadeId = 0; // guards stale async completions

function revealStaticPage() {
  // Called on first load when no crossfade is needed.
  document.querySelectorAll('[data-home-bg-fade]').forEach((el) => el.classList.add('is-home-bg-loaded'));
  document.querySelectorAll('img[data-image-fade]').forEach((img) => {
    if (img.naturalWidth > 0) {
      img.classList.add('is-image-loaded');
      img.closest('.home-card-image')?.classList.add('is-home-image-loaded');
    } else if (!img.dataset.imageLoadWatch) {
      img.dataset.imageLoadWatch = 'true';
      img.addEventListener('load', () => {
        img.classList.add('is-image-loaded');
        img.closest('.home-card-image')?.classList.add('is-home-image-loaded');
      }, { once: true });
    }
  });
  document.querySelectorAll('[data-story-fade]').forEach((el) => el.classList.add('is-home-content-loaded'));
  fitHomeTeaserText();
}

/**
 * Crossfade the hero image and blurred background to a new story.
 *
 * Both the blurred BG and the hero image use a fixed A/B two-slot system.
 * Slots are created once by renderPage() and stay in the DOM forever —
 * no appending or removing elements mid-transition, which was the source
 * of the ghost-image bug (a re-render would create a new img that crossfade
 * had never snapshotted, leaving it permanently opaque underneath).
 *
 * To navigate back (prev button), pass direction: 'back' — the slots simply
 * swap roles in reverse, showing whatever src is already in the outgoing slot.
 */
async function crossfadeToStory(story) {
  const id = ++_crossfadeId;
  const src = leadImageSrcFor(story);
  if (!src) return;

  // ── 1. Hide teaser so the next line can slide in after the image swap ─────
  const teaser = document.querySelector('[data-story-fade]');
  teaser?.classList.remove('is-home-content-loaded');

  // ── 2. Identify slots ─────────────────────────────────────────────────────
  const imgA = document.querySelector('.home-card-image .img-slot--a');
  const imgB = document.querySelector('.home-card-image .img-slot--b');
  const bgA  = document.querySelector('.home-bg-layer--a');
  const bgB  = document.querySelector('.home-bg-layer--b');
  if (!imgA || !imgB) return;

  const aIsActive   = imgA.dataset.imgActive === 'true';
  const imgIncoming = aIsActive ? imgB : imgA;
  const imgOutgoing = aIsActive ? imgA : imgB;
  const bgIncoming  = bgA && bgB ? (aIsActive ? bgB : bgA) : null;
  const bgOutgoing  = bgA && bgB ? (aIsActive ? bgA : bgB) : null;

  // ── 3. Pre-load both hero img and blurred bg before touching opacity ──────
  // Set img src while slot is still invisible.
  imgIncoming.src = src;
  imgIncoming.alt = story.storyteller || '';

  // Prime the bg slot src via an Image() so it's decoded before we reveal it.
  if (bgIncoming) bgIncoming.style.backgroundImage = `url("${src}")`;

  await Promise.all([
    new Promise((resolve) => {
      if (imgIncoming.complete && imgIncoming.naturalWidth > 0) { resolve(); return; }
      imgIncoming.addEventListener('load',  resolve, { once: true });
      imgIncoming.addEventListener('error', resolve, { once: true });
    }),
    new Promise((resolve) => {
      const probe = new Image();
      probe.onload  = resolve;
      probe.onerror = resolve;
      probe.src = src;
      if (probe.complete) resolve();
    }),
  ]);

  if (id !== _crossfadeId) return;

  // ── 4. Swap text content while teaser is still invisible ──────────────────
  const readBtn = document.querySelector('.home-read-button');
  if (teaser)  teaser.textContent = labelFor(story.summary, state.language);
  if (readBtn) readBtn.href = `stories/?code=${story.id}`;
  fitHomeTeaserText();

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  if (id !== _crossfadeId) return;

  // ── 5. Single rAF: reveal everything together ─────────────────────────────
  requestAnimationFrame(() => {
    if (id !== _crossfadeId) return;

    // Hero image
    imgIncoming.classList.add('is-image-loaded');
    imgOutgoing.classList.remove('is-image-loaded');
    imgIncoming.dataset.imgActive = 'true';
    imgOutgoing.dataset.imgActive = 'false';

    // Blurred bg
    if (bgIncoming && bgOutgoing) {
      bgIncoming.classList.add('is-home-bg-loaded');
      bgOutgoing.classList.remove('is-home-bg-loaded');
      bgIncoming.dataset.bgActive = 'true';
      bgOutgoing.dataset.bgActive = 'false';
    }

    // Text
    teaser?.classList.add('is-home-content-loaded');
  });
}

function fitHomeTeaserText() {
  const teaser = document.querySelector('.home-card-teaser');
  const actions = document.querySelector('.home-card-actions');
  if (!teaser || !actions) return;

  const isMobile = window.matchMedia('(max-width: 680px)').matches;
  teaser.style.removeProperty('font-size');
  teaser.style.removeProperty('line-height');
  teaser.style.removeProperty('max-height');
  teaser.style.removeProperty('-webkit-line-clamp');

  if (!isMobile) return;

  const teaserTop = teaser.getBoundingClientRect().top;
  const actionsTop = actions.getBoundingClientRect().top;
  const availableHeight = Math.max(44, actionsTop - teaserTop - 14);
  const computed = window.getComputedStyle(teaser);
  let fontSize = parseFloat(computed.fontSize) || 15;
  let lineHeight = parseFloat(computed.lineHeight) || fontSize * 1.24;
  const minFontSize = 9.5;
  const ratio = lineHeight / fontSize;

  teaser.style.maxHeight = `${availableHeight}px`;
  teaser.style.webkitLineClamp = 'unset';

  while (teaser.scrollHeight > availableHeight + 1 && fontSize > minFontSize) {
    fontSize -= 0.5;
    teaser.style.fontSize = `${fontSize}px`;
    teaser.style.lineHeight = `${Math.max(fontSize * ratio, fontSize + 2)}px`;
  }
}

function renderLoading() {
  savePrefs();
  const app = document.querySelector('#app');
  if (!app) return;
  const loadingText = state.language === 'so' ? 'Sheekada waa la raraya…' : 'Loading story…';
  app.innerHTML = `<div class="home-shell"><div class="loading-state loading-state--page"><span class="loading-spinner" aria-hidden="true"></span><span>${esc(loadingText)}</span></div></div>`;
}

async function setHomeStory(story, options = {}) {
  if (!story) return;
  const isSameStory = state.currentStory && String(state.currentStory.id) === String(story.id);
  state.currentStory = story;
  if (options.push !== false) {
    state.storyTrail = state.storyTrail.slice(0, state.trailIndex + 1);
    if (String(state.storyTrail[state.storyTrail.length - 1]) !== String(story.id)) {
      state.storyTrail.push(story.id);
    }
    state.trailIndex = state.storyTrail.length - 1;
  }

  // Update prev/next button states without a full re-render.
  _syncCarouselButtons();

  if (isSameStory) return;

  if (!options.preloaded) {
    await ensureStoryImages(story);
  } else if (!hasUsableLeadImage(story)) {
    await ensureStoryImages(story);
  }

  await crossfadeToStory(story);
  window.setTimeout(() => {
    document.querySelector('[data-story-fade]')?.classList.add('is-home-content-loaded');
  }, 80);
  preloadNextHomeStory();
}

// ── Light DOM updates (no full re-render) ──────────────────────────────────────
function _syncCarouselButtons() {
  const prevBtn = document.querySelector('[data-action="previous-home-story"]');
  if (prevBtn) {
    const disabled = state.trailIndex <= 0;
    prevBtn.disabled = disabled;
    prevBtn.classList.toggle('is-disabled', disabled);
  }
  const nextBtn = document.querySelector('[data-action="next-home-story"]');
  if (nextBtn) {
    nextBtn.disabled = false;
    nextBtn.classList.remove('is-disabled');
  }
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
  const currentBgSrc = leadImageLoading ? '' : leadSrc;
  const leadImageStyle = currentBgSrc ? ` style="background-image: url(&quot;${esc(currentBgSrc)}&quot;)"` : '';
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
      <div class="home-card-image is-home-image-loaded"${leadImageStyle}>
        ${leadImageLoading
          ? imageLoadingMarkup(story.code || story.id)
          : `<img class="img-slot--a is-image-loaded" data-image-fade data-img-active="true"  src="${esc(leadSrc)}" alt="${esc(story.storyteller)}" loading="eager">
             <img class="img-slot--b"                 data-image-fade data-img-active="false" src="" alt="">`}
      </div>
      <div class="home-card-body">
        <div class="home-card-primary-panel">
          <p class="home-card-teaser is-home-content-loaded" data-story-fade>${esc(labelFor(story.summary, state.language))}</p>
          <div class="home-card-actions home-card-actions--primary">
            <div class="home-card-action-row home-card-action-row--top">
              <a class="action-button home-read-button" href="stories/?code=${esc(story.id)}">
                ${icon.glasses()}<span>${esc(readLabel)}</span>
              </a>
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
            </div>
          </div>
          <a class="home-explore-link" href="stories/#gallery">${icon.sliders()}<span>${esc(exploreLabel)}</span><span aria-hidden="true">&rarr;</span></a>
        </div>
      </div>
    </div>
  ` : `<div class="home-loading">${esc(t.loadingStory || 'Loading story…')}</div>`;

  app.innerHTML = `
    ${renderMenu(t)}
    <div class="home-shell" id="home-carousel">
      <div class="home-bg-stack" aria-hidden="true">
        ${currentBgSrc ? `<div class="home-bg-layer home-bg-layer--a is-home-bg-loaded" data-bg-active="true" data-home-bg-fade style="background-image: url(&quot;${esc(currentBgSrc)}&quot;)"></div>
        <div class="home-bg-layer home-bg-layer--b"></div>` : ''}
      </div>

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

      <button type="button" class="home-background-link" data-action="read-background">
        <span>${esc(backgroundLabel())}</span>${icon.chevronDown()}
      </button>

    </div>
    ${renderSavedDrawer(t)}
  `;
  requestAnimationFrame(() => revealStaticPage());
}

// ── Listeners ─────────────────────────────────────────────────────────────────
function attachListeners() {
  const swipe = {
    active: false,
    pointerId: null,
    x: 0,
    y: 0,
    startedAt: 0
  };

  document.addEventListener('load', (e) => {
    if (e.target?.matches?.('img[data-image-fade]')) {
      e.target.classList.add('is-image-loaded');
    }
  }, true);

  document.addEventListener('pointerdown', (e) => {
    const card = e.target.closest?.('.home-card');
    if (!card || e.target.closest?.('a, button, input, select, textarea')) return;
    swipe.active = true;
    swipe.pointerId = e.pointerId;
    swipe.x = e.clientX;
    swipe.y = e.clientY;
    swipe.startedAt = Date.now();
  });

  document.addEventListener('pointerup', async (e) => {
    if (!swipe.active || e.pointerId !== swipe.pointerId) return;
    const dx = e.clientX - swipe.x;
    const dy = e.clientY - swipe.y;
    const elapsed = Date.now() - swipe.startedAt;
    swipe.active = false;
    swipe.pointerId = null;
    if (elapsed > 1200 || Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.35) return;
    if (dx < 0) await goNextHomeStory();
    else await goPreviousHomeStory();
  });

  document.addEventListener('pointercancel', () => {
    swipe.active = false;
    swipe.pointerId = null;
  });

  document.addEventListener('click', async (e) => {
    const sectionLink = e.target.closest('.home-menu-shell a[href^="#"]');
    if (sectionLink) {
      const destination = sectionLink.getAttribute('href');
      if (destination === '#background-map' || destination === '#home-carousel') {
        e.preventDefault();
        state.menuOpen = false;
        renderPage();
        if (destination === '#background-map') {
          await mountBackground({ scroll: true });
        } else {
          window.setTimeout(() => {
            document.querySelector('#home-carousel')?.scrollIntoView({
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
              block: 'start'
            });
          }, 0);
        }
        return;
      }
    }

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
      const backgroundWasMounted = backgroundRoot()?.dataset.mounted === 'true';
      state.language = value === 'so' ? 'so' : 'en';
      state.menuOpen = false;
      await initialiseI18n(state.language);
      renderPage();
      if (backgroundWasMounted) {
        resetBackground();
        void mountBackground({ scroll: false });
      }
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
    if (action === 'read-background') {
      await mountBackground({ scroll: true });
      return;
    }
    if (action === 'review-sign-out') {
      await signOutReviewSession();
      return;
    }
    if (action === 'scroll-home') {
      e.preventDefault();
      window.setTimeout(() => {
        document.querySelector('#home-carousel')?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start'
        });
      }, 0);
      return;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.savedOpen) { state.savedOpen = false; renderPage(); }
      else if (state.menuOpen) { state.menuOpen = false; renderPage(); }
    }
  });

  window.addEventListener('resize', () => {
    window.requestAnimationFrame(fitHomeTeaserText);
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  await requireReviewSession();
  attachListeners();
  renderLoading();
  await Promise.all([
    initialiseI18n(state.language),
    fetchHomeStories().then((stories) => {
      state.stories      = stories;
      state.currentStory = pickRandom(stories);
      if (state.currentStory) {
        state.storyTrail = [state.currentStory.id];
        state.trailIndex = 0;
      }
    })
  ]);
  // Fetch images first so renderPage stamps them in already-loaded.
  if (state.currentStory) await ensureStoryImages(state.currentStory);
  renderPage(); // single render — A slot is live, B slot is empty standby
  if (window.location.hash === '#background-map') {
    await mountBackground({ scroll: true });
  }
  preloadNextHomeStory();
  startHomeCarousel();
}

init().catch((err) => {
  console.error(err);
  const app = document.querySelector('#app');
  if (app) app.innerHTML = '<div class="error-state">Failed to load. Check the browser console and verify Supabase configuration.</div>';
});
