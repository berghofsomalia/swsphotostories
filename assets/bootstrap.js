import { renderApp, qs, qsa, syncGalleryCardHeights } from './render.js';
import { state, createEmptyFilters } from './state.js';
import {
  buildShareUrl,
  currentStory,
  getStoryById,
  hasActiveFilters,
  pickRandomRelatedStory,
  savePersistentState,
  isSaved,
  resolveSlug
} from './story-data.js';
import { getUiText, labelFor } from './content.js';
import { fetchStories } from './api.js';

let actionMessageTimerId = null;
let touchStartX = null;
let listenersAttached = false;

// ── URL sync ─────────────────────────────────────────────────────────────────

/**
 * Writes the full application state into the URL search params so that
 * filters and the current story are bookmarkable and shareable.
 * Hash is managed separately via state.urlHash.
 */
function syncUrl(state) {
  const url = new URL(window.location.href);
  url.pathname = url.pathname.replace(/index\.html$/, '');
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  url.searchParams.delete('random');

  const story = currentStory(state);
  setOrDelete(url.searchParams, 'code', story?.id ?? '');
  setOrDelete(url.searchParams, 'district', state.filters.district);
  setOrDelete(url.searchParams, 'cluster', state.filters.cluster);
  setOrDelete(url.searchParams, 'primary', state.filters.primaryTheme);
  setOrDelete(url.searchParams, 'secondary', state.filters.secondaryThemes.join(','));
  setOrDelete(url.searchParams, 'people', state.filters.people.join(','));

  url.hash = state.urlHash;
  history.replaceState({}, '', url);
}

function setOrDelete(params, key, value) {
  if (value) params.set(key, value);
  else params.delete(key);
}

/**
 * Reads filter values from URL search params on initial load.
 * This lets users share filtered views via URL.
 */
function readFiltersFromUrl(params) {
  return {
    district: params.get('district') || '',
    cluster: params.get('cluster') || '',
    primaryTheme: params.get('primary') || '',
    secondaryThemes: params.get('secondary')
      ? params.get('secondary').split(',').filter(Boolean)
      : [],
    people: params.get('people')
      ? params.get('people').split(',').filter(Boolean)
      : []
  };
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderSite() {
  syncUrl(state);
  renderApp(state);
  startAutoplay();
  requestAnimationFrame(syncGalleryCardHeights);
}

function renderLoading() {
  const app = qs('#app');
  if (!app) return;
  const t = getUiText(state.language);
  app.innerHTML = `<div class="loading-state">${t.loading}</div>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clearActionMessageSoon() {
  if (!state.actionMessage) return;
  clearTimeout(actionMessageTimerId);
  actionMessageTimerId = window.setTimeout(() => {
    state.actionMessage = '';
    renderSite();
  }, 2200);
}

function scrollStoryTop() {
  qs('#story-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollGallery() {
  qs('#gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollFromHash(options = {}) {
  const hash = window.location.hash;
  const behavior = options.behavior || 'smooth';
  if (hash === '#gallery') {
    qs('#gallery')?.scrollIntoView({ behavior, block: 'start' });
    return;
  }
  if (hash === '#story-top') {
    qs('#story-top')?.scrollIntoView({ behavior, block: 'start' });
  }
}

function setCurrentStory(id, options = {}) {
  const story = getStoryById(state.stories, id);
  if (!story) return;

  state.currentStoryId = story.id;
  state.currentImageIndex = 0;
  state.shareOpen = false;
  state.menuOpen = false;
  state.storyVisible = options.storyVisible ?? true;
  state.galleryVisible = options.galleryVisible ?? false;
  state.urlHash = options.hash || '';
  renderSite();

  if (options.scrollTop) scrollStoryTop();
}

function setGalleryModeFromFilters() {
  state.galleryMode = hasActiveFilters(state.filters) ? 'filtered' : 'total';
}

function toggleSaved(storyId) {
  const t = getUiText(state.language);
  if (isSaved(state, storyId)) {
    state.savedIds = state.savedIds.filter((savedId) => savedId !== storyId);
    state.actionMessage = t.removedMessage;
  } else {
    state.savedIds = [...state.savedIds, storyId];
    state.actionMessage = t.savedMessage;
  }
  savePersistentState(state);
  renderSite();
  clearActionMessageSoon();
}

async function writeToClipboard(textToCopy) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(textToCopy);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = textToCopy;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

function moveToPreviousImage() {
  const story = currentStory(state);
  if (!story) return;
  state.currentImageIndex = (state.currentImageIndex - 1 + story.images.length) % story.images.length;
  restartAutoplay();
  renderSite();
}

function moveToNextImage() {
  const story = currentStory(state);
  if (!story) return;
  state.currentImageIndex = (state.currentImageIndex + 1) % story.images.length;
  restartAutoplay();
  renderSite();
}

function setCurrentImage(index) {
  state.currentImageIndex = Number(index) || 0;
  restartAutoplay();
  renderSite();
}

function openUrlInNewTab(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function currentStoryLabel(story) {
  return `${story.storyteller} - ${labelFor(story.district, state.language)}`;
}

// ── Actions ───────────────────────────────────────────────────────────────────

const ACTIONS = {
  'set-language': async ({ value }) => {
    state.language = value === 'so' ? 'so' : 'en';
    savePersistentState(state);
    renderSite();
  },
  'set-theme': async ({ value }) => {
    state.theme = value === 'light' ? 'light' : 'dark';
    savePersistentState(state);
    renderSite();
  },
  'toggle-menu': async () => {
    state.menuOpen = !state.menuOpen;
    renderSite();
  },
  'close-menu': async () => {
    state.menuOpen = false;
    renderSite();
  },
  'open-saved': async () => {
    state.menuOpen = false;
    state.savedOpen = !state.savedOpen;
    renderSite();
  },
  'close-saved': async () => {
    state.savedOpen = false;
    renderSite();
  },
  'open-saved-story': async ({ value }) => {
    state.savedOpen = false;
    setCurrentStory(value, { scrollTop: true });
  },
  'open-share': async () => {
    state.menuOpen = false;
    state.shareOpen = true;
    renderSite();
  },
  'close-share': async () => {
    state.shareOpen = false;
    renderSite();
  },
  'share-copy': async ({ story }) => {
    if (!story) return;
    await writeToClipboard(buildShareUrl(story));
    state.shareOpen = false;
    state.actionMessage = getUiText(state.language).copied;
    renderSite();
    clearActionMessageSoon();
  },
  'share-facebook': async ({ story }) => {
    if (!story) return;
    openUrlInNewTab(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(buildShareUrl(story))}`);
    state.shareOpen = false;
    renderSite();
  },
  'share-instagram': async ({ story }) => {
    if (!story) return;
    await writeToClipboard(buildShareUrl(story));
    openUrlInNewTab('https://www.instagram.com/');
    state.shareOpen = false;
    state.actionMessage = getUiText(state.language).instagramHint;
    renderSite();
    clearActionMessageSoon();
  },
  'share-x': async ({ story }) => {
    if (!story) return;
    const shareUrl = buildShareUrl(story);
    const text = currentStoryLabel(story);
    openUrlInNewTab(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`);
    state.shareOpen = false;
    renderSite();
  },
  'share-email': async ({ story }) => {
    if (!story) return;
    const shareUrl = buildShareUrl(story);
    const subject = encodeURIComponent(currentStoryLabel(story));
    const body = encodeURIComponent(`${labelFor(story.summary, state.language)}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    state.shareOpen = false;
    renderSite();
  },
  'toggle-save': async ({ story }) => {
    if (story) toggleSaved(story.id);
  },
  'random-related': async ({ story }) => {
    if (!story) return;
    setCurrentStory(pickRandomRelatedStory(state, story).id, { scrollTop: true });
  },
  'show-related': async ({ story }) => {
    if (!story) return;
    state.filters = {
      district: story.district.slug,
      cluster: resolveSlug(story.cluster),
      primaryTheme: story.primaryTheme.slug,
      secondaryThemes: story.secondaryThemes.map((theme) => theme.slug),
      people: [...story.actors]
    };
    state.galleryMode = 'related';
    state.storyVisible = true;
    state.galleryVisible = true;
    state.urlHash = '#gallery';
    renderSite();
    scrollGallery();
  },
  'explore-all': async () => {
    state.filters = createEmptyFilters();
    state.galleryMode = 'total';
    state.storyVisible = true;
    state.galleryVisible = true;
    state.urlHash = '#gallery';
    renderSite();
    scrollGallery();
  },
  'reset-filters': async () => {
    state.filters = createEmptyFilters();
    state.galleryMode = 'total';
    renderSite();
  },
  'filter-district': async ({ value }) => {
    state.filters.district = state.filters.district === value ? '' : value;
    setGalleryModeFromFilters();
    renderSite();
  },
  'filter-district-all': async () => {
    state.filters.district = '';
    setGalleryModeFromFilters();
    renderSite();
  },
  // ── Cluster filter (new) ──────────────────────────────────────────────────
  'filter-cluster': async ({ value }) => {
    state.filters.cluster = state.filters.cluster === value ? '' : value;
    setGalleryModeFromFilters();
    renderSite();
  },
  'filter-cluster-all': async () => {
    state.filters.cluster = '';
    setGalleryModeFromFilters();
    renderSite();
  },
  // ── Theme filters ─────────────────────────────────────────────────────────
  'filter-primary': async ({ value }) => {
    state.filters.primaryTheme = state.filters.primaryTheme === value ? '' : value;
    setGalleryModeFromFilters();
    renderSite();
  },
  'filter-primary-all': async () => {
    state.filters.primaryTheme = '';
    setGalleryModeFromFilters();
    renderSite();
  },
  'filter-secondary': async ({ value }) => {
    state.filters.secondaryThemes = state.filters.secondaryThemes.includes(value)
      ? state.filters.secondaryThemes.filter((slug) => slug !== value)
      : [...state.filters.secondaryThemes, value];
    setGalleryModeFromFilters();
    renderSite();
  },
  'filter-secondary-all': async () => {
    state.filters.secondaryThemes = [];
    setGalleryModeFromFilters();
    renderSite();
  },
  'filter-people': async ({ value }) => {
    state.filters.people = state.filters.people.includes(value)
      ? state.filters.people.filter((person) => person !== value)
      : [...state.filters.people, value];
    setGalleryModeFromFilters();
    renderSite();
  },
  'filter-people-all': async () => {
    state.filters.people = [];
    setGalleryModeFromFilters();
    renderSite();
  },
  'open-story': async ({ value }) => {
    setCurrentStory(value, { scrollTop: true });
  },
  'prev-image': async () => {
    moveToPreviousImage();
  },
  'next-image': async () => {
    moveToNextImage();
  },
  'go-image': async ({ value }) => {
    setCurrentImage(value);
  }
};

async function handleAction(action, value = '') {
  const handler = ACTIONS[action];
  if (!handler) return;
  await handler({ action, value, story: currentStory(state) });
}

// ── Event listeners ───────────────────────────────────────────────────────────

function handleAppClick(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  event.preventDefault();
  handleAction(target.dataset.action, target.dataset.value || '').catch((error) => {
    console.error(error);
  });
}

function handleTouchStart(event) {
  if (!event.target.closest('.story-slides')) return;
  touchStartX = event.touches[0].clientX;
}

function handleTouchEnd(event) {
  if (!event.target.closest('.story-slides') || touchStartX == null) return;
  const story = currentStory(state);
  if (!story) {
    touchStartX = null;
    return;
  }
  const diff = touchStartX - event.changedTouches[0].clientX;
  if (Math.abs(diff) > 40) {
    state.currentImageIndex = diff > 0
      ? (state.currentImageIndex + 1) % story.images.length
      : (state.currentImageIndex - 1 + story.images.length) % story.images.length;
    restartAutoplay();
    renderSite();
  }
  touchStartX = null;
}

function attachGlobalListeners() {
  if (listenersAttached) return;

  const app = qs('#app');
  app?.addEventListener('click', handleAppClick);
  app?.addEventListener('touchstart', handleTouchStart, { passive: true });
  app?.addEventListener('touchend', handleTouchEnd, { passive: true });

  window.addEventListener('resize', () => {
    window.clearTimeout(window.__photostoryResizeTimer);
    window.__photostoryResizeTimer = window.setTimeout(syncGalleryCardHeights, 120);
  });

  window.addEventListener('hashchange', () => {
    requestAnimationFrame(() => scrollFromHash());
  });

  window.addEventListener('keydown', (event) => {
    // Close overlays
    if (event.key === 'Escape') {
      if (!state.menuOpen && !state.shareOpen && !state.savedOpen) return;
      state.menuOpen = false;
      state.shareOpen = false;
      state.savedOpen = false;
      renderSite();
      return;
    }

    // Keyboard image navigation (only when no overlay is open and story is visible)
    if (state.storyVisible && !state.menuOpen && !state.shareOpen && !state.savedOpen) {
      if (event.key === 'ArrowLeft') {
        moveToPreviousImage();
        return;
      }
      if (event.key === 'ArrowRight') {
        moveToNextImage();
      }
    }
  });

  window.addEventListener('beforeunload', stopAutoplay);
  listenersAttached = true;
}

// ── Autoplay ──────────────────────────────────────────────────────────────────

function stopAutoplay() {
  if (state.autoplayId) {
    clearInterval(state.autoplayId);
    state.autoplayId = null;
  }
}

function startAutoplay() {
  stopAutoplay();
  if (!state.storyVisible) return;
  const story = currentStory(state);
  if (!story || story.images.length <= 1) return;

  state.autoplayId = setInterval(() => {
    state.currentImageIndex = (state.currentImageIndex + 1) % story.images.length;
    qsa('.story-slide').forEach((slide, index) => slide.classList.toggle('is-active', index === state.currentImageIndex));
    qsa('.stage-dot').forEach((dot, index) => dot.classList.toggle('is-active', index === state.currentImageIndex));
  }, 5000);
}

function restartAutoplay() {
  stopAutoplay();
  startAutoplay();
}

// ── Init ──────────────────────────────────────────────────────────────────────

export async function initialiseApp() {
  attachGlobalListeners();
  renderLoading();

  // Fetch all stories through the data access layer (api.js)
  state.stories = await fetchStories();

  const params = new URLSearchParams(window.location.search);

  // Restore filter state from URL so shared/bookmarked filtered views work
  const urlFilters = readFiltersFromUrl(params);
  state.filters = urlFilters;
  if (hasActiveFilters(state.filters)) state.galleryMode = 'filtered';

  const code = params.get('code');
  const existing = getStoryById(state.stories, code);
  const randomStory = state.stories[Math.floor(Math.random() * state.stories.length)] || null;
  const startInGallery = window.location.hash === '#gallery' && !code && !params.has('random');

  state.currentStoryId = existing?.id || randomStory?.id || null;
  state.storyVisible = !startInGallery;
  state.galleryVisible = startInGallery || hasActiveFilters(state.filters);
  state.urlHash = window.location.hash || '';

  savePersistentState(state);
  renderSite();

  if (window.location.hash && state.galleryVisible) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollFromHash({ behavior: 'auto' }));
    });
  }
}
