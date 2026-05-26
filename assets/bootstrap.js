import { renderApp, qs, qsa, syncGalleryCardHeights } from './render.js';
import { state, createEmptyFilters } from './state.js';
import {
  buildShareUrl,
  currentStory,
  getStoryById,
  hasActiveFilters,
  hasMoreStories,
  pickRandomRelatedStory,
  savePersistentState,
  updateUrlForStory,
  isSaved
} from './story-data.js';
import { getUiText, labelFor, initialiseI18n } from './content.js';
import { fetchStories, fetchTagCatalogue } from './api.js';

let actionMessageTimerId = null;
let touchStartX = null;
let listenersAttached = false;

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderSite() {
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
  updateUrlForStory(story, { hash: options.hash || '' });
  renderSite();

  if (options.scrollTop) scrollStoryTop();
}

function resetPage() {
  state.galleryPage = 1;
}

function setGalleryModeFromFilters() {
  state.galleryMode = hasActiveFilters(state.filters) ? 'filtered' : 'total';
  resetPage();
}

function toggleSaved(storyId) {
  const t = getUiText(state.language);
  if (isSaved(state, storyId)) {
    state.savedIds = state.savedIds.filter((id) => String(id) !== String(storyId));
    state.actionMessage = t.removedMessage;
  } else {
    state.savedIds = [...state.savedIds, String(storyId)];
    state.actionMessage = t.savedMessage;
  }
  savePersistentState(state);
  renderSite();
  clearActionMessageSoon();
}

async function writeToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
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
    await initialiseI18n(state.language);
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
    openUrlInNewTab(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(currentStoryLabel(story))}`);
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
      district: '',
      people: (story.people || []).map((tag) => tag.slug).filter(Boolean),
      tags: (story.topicTags || []).map((tag) => tag.slug).filter(Boolean),
      searchQuery: ''
    };
    state.galleryMode = 'related';
    resetPage();
    state.storyVisible = true;
    state.galleryVisible = true;
    renderSite();
    scrollGallery();
  },
  'load-more': async () => {
    if (hasMoreStories(state)) {
      state.galleryPage += 1;
      renderSite();
    }
  },
  'explore-all': async () => {
    state.filters = createEmptyFilters();
    state.galleryMode = 'total';
    resetPage();
    state.storyVisible = true;
    state.galleryVisible = true;
    renderSite();
    scrollGallery();
  },
  'reset-filters': async () => {
    state.filters = createEmptyFilters();
    state.galleryMode = 'total';
    resetPage();
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
  'filter-tag': async ({ value }) => {
    state.filters.tags = state.filters.tags.includes(value)
      ? state.filters.tags.filter((slug) => slug !== value)
      : [...state.filters.tags, value];
    setGalleryModeFromFilters();
    renderSite();
  },
  'filter-tag-all': async ({ value }) => {
    if (!value) {
      state.filters.tags = [];
    } else {
      const activeCluster = state.stories
        .flatMap((story) => story.topicTags || [])
        .filter((tag) => tag.clusterSlug === value)
        .map((tag) => tag.slug);
      state.filters.tags = state.filters.tags.filter((slug) => !activeCluster.includes(slug));
    }
    setGalleryModeFromFilters();
    renderSite();
  },
  'filter-people': async ({ value }) => {
    state.filters.people = state.filters.people.includes(value)
      ? state.filters.people.filter((p) => p !== value)
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
  'prev-image': async () => { moveToPreviousImage(); },
  'next-image': async () => { moveToNextImage(); },
  'go-image': async ({ value }) => { setCurrentImage(value); }
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
  handleAction(target.dataset.action, target.dataset.value || '').catch(console.error);
}

function handleTouchStart(event) {
  if (!event.target.closest('.story-slides')) return;
  touchStartX = event.touches[0].clientX;
}

function handleTouchEnd(event) {
  if (!event.target.closest('.story-slides') || touchStartX == null) return;
  const story = currentStory(state);
  if (!story) { touchStartX = null; return; }

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

/**
 * Search input handler.
 * After re-rendering we restore focus and cursor position so typing feels
 * uninterrupted despite the full DOM rebuild.
 */
function handleSearchInput(event) {
  const input = event.target.closest('[data-search-input]');
  if (!input) return;

  state.filters.searchQuery = input.value;
  setGalleryModeFromFilters();
  renderSite();

  // Restore focus and cursor after re-render
  const restored = qs('[data-search-input]');
  if (restored) {
    restored.focus();
    const len = restored.value.length;
    restored.setSelectionRange(len, len);
  }
}

function attachGlobalListeners() {
  if (listenersAttached) return;

  const app = qs('#app');
  app?.addEventListener('click', handleAppClick);
  app?.addEventListener('input', handleSearchInput);
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
    // Arrow key image navigation (only when no overlay is open and story visible)
    if (state.storyVisible && !state.menuOpen && !state.shareOpen && !state.savedOpen) {
      if (event.key === 'ArrowLeft') { moveToPreviousImage(); return; }
      if (event.key === 'ArrowRight') { moveToNextImage(); }
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
    qsa('.story-slide').forEach((slide, i) => slide.classList.toggle('is-active', i === state.currentImageIndex));
    qsa('.stage-dot').forEach((dot, i) => dot.classList.toggle('is-active', i === state.currentImageIndex));
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

  // Load i18n, stories and the full tag catalogue.
  await initialiseI18n(state.language);
  state.stories = await fetchStories();
  state.tagClusters = await fetchTagCatalogue(state.stories);

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const existing = getStoryById(state.stories, code);
  const randomStory = state.stories[Math.floor(Math.random() * state.stories.length)] || null;
  const startInGallery = window.location.hash === '#gallery' && !code && !params.has('random');

  state.currentStoryId = existing?.id || randomStory?.id || null;
  state.storyVisible = !startInGallery;
  state.galleryVisible = startInGallery;

  savePersistentState(state);
  renderSite();

  if (window.location.hash && state.galleryVisible) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollFromHash({ behavior: 'auto' }));
    });
  }
}
