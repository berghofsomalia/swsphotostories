import { renderApp, qs, qsa, syncGalleryCardHeights, syncImageLoadStates, markImageLoaded } from './render.js?v=20260716-filtered-gallery-pages';
import { state, createEmptyFilters, PAGE_SIZE } from './state.js?v=20260608-gallery-batches';
import {
  buildShareUrl,
  buildGalleryShareUrl,
  currentStory,
  getStoryById,
  hasActiveFilters,
  hasMoreStories,
  filteredStories,
  pagedStories,
  pickRandomRelatedStory,
  savePersistentState,
  scoreRelated,
  selectedDistricts,
  shuffle,
  updateUrlForStory,
  isSaved
} from './story-data.js?v=20260709-gallery-facets';
import { getUiText, labelFor, initialiseI18n, STORAGE_KEYS } from './content.js?v=20260715-shared-questions';
import { ensureStoryImages, fetchStories, fetchStoryByCode, fetchTagCatalogue } from './api.js?v=20260715-private-images';
import { signOutReviewSession } from './review-auth.js';

let actionMessageTimerId = null;
let touchStartX = null;
let listenersAttached = false;
let imageHydrationRun = 0;
let imageHydrationScheduled = false;
let filterResizeDrag = null;
let pendingSearchFocus = null;
let pendingStoryTopId = null;
let pendingStoryTopTimerId = null;

async function loadGalleryDataset() {
  if (state.galleryDatasetLoaded) return;
  if (state.galleryDatasetPromise) return state.galleryDatasetPromise;

  state.galleryDatasetPromise = (async () => {
    const stories = await fetchStories();
    state.stories = stories;
    state.tagClusters = await fetchTagCatalogue(stories);
    state.galleryDatasetLoaded = true;
  })();

  try {
    await state.galleryDatasetPromise;
  } finally {
    state.galleryDatasetPromise = null;
  }
}

// ── Viewport-aware initial gallery count ──────────────────────────────────────
function viewportInitialPageCount() {
  return 1;
}

function randomizeGalleryOrder() {
  state.galleryOrder = shuffle(state.stories || []).map((story) => String(story.id));
}

function ensureGalleryOrder() {
  if (!Array.isArray(state.galleryOrder) || state.galleryOrder.length === 0) {
    randomizeGalleryOrder();
  }
}

function prepareGalleryEntry() {
  if (hasActiveFilters(state.filters)) {
    ensureGalleryOrder();
    state.galleryMode = 'filtered';
    state.galleryPage = state.galleryPage || viewportInitialPageCount();
  } else {
    randomizeGalleryOrder();
    state.galleryMode = 'total';
    state.galleryPage = viewportInitialPageCount();
  }
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderSite(options = {}) {
  const resetStoryTop = pendingStoryTopId && String(pendingStoryTopId) === String(state.currentStoryId);
  const galleryScroll = options.preserveGalleryScroll && !resetStoryTop ? captureGalleryScroll() : null;
  const activeElement = document.activeElement;
  const activeSearch = activeElement?.matches?.('[data-search-input]') ? captureSearchFocus(activeElement) : null;
  const searchFocus = pendingSearchFocus || activeSearch;
  pendingSearchFocus = null;

  renderApp(state);
  document.documentElement.classList.toggle('is-modal-open', Boolean(
    state.menuOpen || state.shareOpen || state.guidanceOpen || state.savedOpen || state.filterDrawerOpen
  ));
  startAutoplay();
  requestAnimationFrame(() => syncImageLoadStates());
  requestAnimationFrame(syncGalleryCardHeights);
  requestAnimationFrame(syncStoryStageOffset);
  scheduleVisibleImageHydration();

  if (resetStoryTop) maintainPendingStoryTop();

  if (searchFocus) restoreSearchFocus(searchFocus);
  if (galleryScroll) restoreGalleryScroll(galleryScroll);
  if (state.galleryVisible || hasActiveFilters(state.filters) || state.galleryOrder?.length) saveGallerySession();
}

function syncStoryStageOffset() {
  const stageImage = qs('.story-stage-image.adaptive-image');
  if (!stageImage) return;
  const leftOffset = Math.max(0, stageImage.getBoundingClientRect().left);
  stageImage.style.setProperty('--story-stage-left-offset', `${leftOffset}px`);
}

function renderSitePreservingWindowScroll() {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  renderSite();
  requestAnimationFrame(() => window.scrollTo({ left: scrollX, top: scrollY, behavior: 'auto' }));
}

function hydrateRelatedStoriesAfterStoryRender() {
  if (state.galleryDatasetLoaded || state.galleryDatasetPromise || !state.storyVisible || state.galleryVisible) return;

  loadGalleryDataset()
    .then(() => {
      if (!state.storyVisible || state.galleryVisible) return;
      renderSitePreservingWindowScroll();
    })
    .catch((error) => {
      console.warn('Could not load related photostories.', error);
    });
}

function renderLoading() {
  const app = qs('#app');
  if (!app) return;
  const hasStoryCode = new URLSearchParams(window.location.search).has('code');
  const loadingText = state.language === 'so'
    ? (hasStoryCode ? 'Sheekada waa la raraya…' : 'Sheekooyinka waa la raraya…')
    : (hasStoryCode ? 'Loading story…' : 'Loading stories…');
  app.innerHTML = `<div class="loading-state loading-state--page"><span class="loading-spinner" aria-hidden="true"></span><span>${loadingText}</span></div>`;
}

function captureGalleryScroll() {
  const pane = qs('.gallery-results-pane');
  const filterPane = qs('.filter-panel-scroll-body');
  const snapshot = {
    windowX: window.scrollX,
    windowY: window.scrollY,
    paneScrollLeft: pane?.scrollLeft ?? null,
    paneScrollTop: pane?.scrollTop ?? null,
    filterScrollLeft: filterPane?.scrollLeft ?? null,
    filterScrollTop: filterPane?.scrollTop ?? null,
    paneAnchorValue: null,
    paneAnchorOffset: 0
  };

  if (pane) {
    const paneRect = pane.getBoundingClientRect();
    const anchor = qsa('.gallery-card', pane).find((card) => {
      const rect = card.getBoundingClientRect();
      return rect.bottom > paneRect.top + 1 && rect.top < paneRect.bottom - 1;
    });

    if (anchor) {
      snapshot.paneAnchorValue = anchor.dataset.value || null;
      snapshot.paneAnchorOffset = anchor.getBoundingClientRect().top - paneRect.top;
    }
  }

  return snapshot;
}

function restoreGalleryScroll(snapshot) {
  const apply = () => {
    const pane = qs('.gallery-results-pane');
    if (pane && snapshot.paneScrollTop !== null) {
      pane.scrollLeft = snapshot.paneScrollLeft || 0;
      const anchor = snapshot.paneAnchorValue
        ? qsa('.gallery-card', pane).find((card) => card.dataset.value === snapshot.paneAnchorValue)
        : null;
      if (anchor) {
        const paneRect = pane.getBoundingClientRect();
        const anchorRect = anchor.getBoundingClientRect();
        pane.scrollTop += anchorRect.top - paneRect.top - (snapshot.paneAnchorOffset || 0);
      } else {
        pane.scrollTop = snapshot.paneScrollTop;
      }
    }
    const filterPane = qs('.filter-panel-scroll-body');
    if (filterPane && snapshot.filterScrollTop !== null) {
      filterPane.scrollLeft = snapshot.filterScrollLeft || 0;
      filterPane.scrollTop = snapshot.filterScrollTop;
    }
    window.scrollTo(snapshot.windowX || 0, snapshot.windowY || 0);
  };

  apply();
  requestAnimationFrame(() => {
    apply();
    requestAnimationFrame(apply);
    window.setTimeout(apply, 90);
    window.setTimeout(apply, 240);
  });
}

function visibleStoriesForImages() {
  const visible = new Map();
  const story = currentStory(state);
  if (state.storyVisible && story) {
    visible.set(story.id, story);
    const relatedPageSize = (state.relatedPage || 1) * 4;
    state.stories
      .map((item) => ({ story: item, score: scoreRelated(story, item) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, relatedPageSize)
      .forEach((entry) => visible.set(entry.story.id, entry.story));
  }
  if (state.galleryVisible) {
    pagedStories(state).forEach((item) => visible.set(item.id, item));
  }
  return [...visible.values()].filter((item) => item && !item.imagesLoaded && !item.imagesLoading);
}

function scheduleVisibleImageHydration() {
  if (imageHydrationScheduled) return;
  imageHydrationScheduled = true;
  window.setTimeout(async () => {
    imageHydrationScheduled = false;
    const batch = visibleStoriesForImages().slice(0, 8);
    if (!batch.length) return;
    const runId = ++imageHydrationRun;
    await Promise.all(batch.map((story) => ensureStoryImages(story)));
    if (runId === imageHydrationRun) renderSite({ preserveGalleryScroll: true });
  }, 60);
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
  window.scrollTo({ left: 0, top: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function maintainPendingStoryTop() {
  if (!pendingStoryTopId || String(pendingStoryTopId) !== String(state.currentStoryId)) return;
  scrollStoryTop();
  requestAnimationFrame(scrollStoryTop);
}

function cancelPendingStoryTop() {
  pendingStoryTopId = null;
  window.clearTimeout(pendingStoryTopTimerId);
  pendingStoryTopTimerId = null;
}

function beginPendingStoryTop(storyId) {
  pendingStoryTopId = String(storyId);
  window.clearTimeout(pendingStoryTopTimerId);
  pendingStoryTopTimerId = window.setTimeout(() => {
    if (String(pendingStoryTopId) === String(state.currentStoryId)) scrollStoryTop();
    cancelPendingStoryTop();
  }, 2600);
}

function cancelPendingStoryTopOnIntent(event) {
  if (!pendingStoryTopId) return;
  if (event.type === 'keydown') {
    const scrollKeys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '];
    if (!scrollKeys.includes(event.key)) return;
  }
  cancelPendingStoryTop();
}

function scrollGallery() {
  qs('#gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function visibleSearchInput() {
  return qsa('[data-search-input]').find((input) => input.offsetParent !== null) || qs('[data-search-input]');
}

function focusSearchInput() {
  const input = visibleSearchInput();
  if (!input) return;
  pendingSearchFocus = captureSearchFocus(input, { atEnd: true });
  input.focus({ preventScroll: true });
  input.setSelectionRange(input.value.length, input.value.length);
}

function captureSearchFocus(input, options = {}) {
  const fallback = input?.value?.length || 0;
  if (options.atEnd) {
    return {
      selectionStart: fallback,
      selectionEnd: fallback
    };
  }

  return {
    selectionStart: input?.selectionStart ?? fallback,
    selectionEnd: input?.selectionEnd ?? fallback
  };
}

function applySearchFocus(focusState) {
  const restored = visibleSearchInput();
  if (!restored) return;
  try {
    restored.focus({ preventScroll: true });
  } catch (error) {
    restored.focus();
  }
  const length = restored.value.length;
  const start = Math.min(focusState.selectionStart ?? length, length);
  const end = Math.min(focusState.selectionEnd ?? start, length);
  restored.setSelectionRange(start, end);
}

function restoreSearchFocus(focusState) {
  requestAnimationFrame(() => {
    applySearchFocus(focusState);
    requestAnimationFrame(() => applySearchFocus(focusState));
    window.setTimeout(() => applySearchFocus(focusState), 80);
  });
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

function galleryUrl() {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = 'gallery';
  return url.href;
}

function showGalleryOnly() {
  state.currentStoryId = null;
  state.storyVisible = false;
  state.galleryVisible = true;
  state.filterDrawerOpen = false;
}

function clampGallerySplit(value) {
  if (!Number.isFinite(value)) return 50;
  return Math.max(28, Math.min(72, value));
}

function setGallerySplitFromPointer(clientY) {
  const layout = qs('.site-shell.is-filter-split .gallery-layout');
  if (!layout) return;

  const bounds = layout.getBoundingClientRect();
  if (!bounds.height) return;

  const percent = ((clientY - bounds.top) / bounds.height) * 100;
  state.gallerySplitPercent = clampGallerySplit(percent);
  layout.style.setProperty('--gallery-split', `${state.gallerySplitPercent}%`);
}

function cloneFilters(filters) {
  return {
    district: selectedDistricts(filters),
    people: Array.isArray(filters?.people) ? [...filters.people] : [],
    tags: Array.isArray(filters?.tags) ? [...filters.tags] : [],
    searchQuery: filters?.searchQuery || ''
  };
}

function saveGallerySession() {
  try {
    sessionStorage.setItem(STORAGE_KEYS.gallerySession, JSON.stringify({
      filters: cloneFilters(state.filters),
      galleryOrder: Array.isArray(state.galleryOrder) ? [...state.galleryOrder] : [],
      galleryPage: state.galleryPage,
      galleryMode: state.galleryMode,
      filterDrawerOpen: state.filterDrawerOpen,
      gallerySplitPercent: state.gallerySplitPercent
    }));
  } catch {}
}

function restoreGallerySession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.gallerySession);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const filters = cloneFilters(parsed.filters);
    if (!hasActiveFilters(filters)) return false;
    state.filters = filters;
    state.galleryOrder = Array.isArray(parsed.galleryOrder) ? [...parsed.galleryOrder] : [];
    state.galleryPage = Number(parsed.galleryPage) || state.galleryPage || 1;
    state.galleryMode = parsed.galleryMode || (hasActiveFilters(state.filters) ? 'filtered' : 'total');
    state.filterDrawerOpen = false;
    state.gallerySplitPercent = clampGallerySplit(Number(parsed.gallerySplitPercent) || state.gallerySplitPercent || 50);
    return true;
  } catch {
    return false;
  }
}

function makeHistoryState(kind = 'story') {
  return {
    swsPhotostories: true,
    kind,
    currentStoryId: state.currentStoryId,
    currentImageIndex: state.currentImageIndex,
    filters: cloneFilters(state.filters),
    galleryOrder: Array.isArray(state.galleryOrder) ? [...state.galleryOrder] : [],
    galleryPage: state.galleryPage,
    galleryMode: state.galleryMode,
    storyVisible: state.storyVisible,
    galleryVisible: state.galleryVisible,
    filterDrawerOpen: state.filterDrawerOpen,
    gallerySplitPercent: state.gallerySplitPercent
  };
}

function replaceCurrentHistoryState(kind = 'gallery') {
  history.replaceState(makeHistoryState(kind), '', window.location.href);
}

function pushStoryHistory(story) {
  const url = buildShareUrl(story);
  history.pushState(makeHistoryState('story'), '', url);
}

async function restoreHistoryState(snapshot) {
  if (!snapshot || !snapshot.swsPhotostories) {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const story = getStoryById(state.stories, code);
    if (story) {
      setCurrentStory(story.id, { skipUrl: true, scrollTop: true });
      return;
    }
    await loadGalleryDataset();
    showGalleryOnly();
    history.replaceState(makeHistoryState('gallery'), '', galleryUrl());
    renderSite();
    requestAnimationFrame(() => qs('#gallery')?.scrollIntoView({ behavior: 'auto', block: 'start' }));
    return;
  }

  if (snapshot.galleryVisible) {
    await loadGalleryDataset();
  }

  state.currentStoryId = snapshot.currentStoryId || state.currentStoryId;
  state.currentImageIndex = Number(snapshot.currentImageIndex) || 0;
  state.filters = cloneFilters(snapshot.filters);
  state.galleryOrder = Array.isArray(snapshot.galleryOrder) ? [...snapshot.galleryOrder] : [];
  state.galleryPage = Number(snapshot.galleryPage) || 1;
  state.galleryMode = snapshot.galleryMode || 'total';
  state.storyVisible = Boolean(snapshot.storyVisible);
  state.galleryVisible = Boolean(snapshot.galleryVisible);
  state.filterDrawerOpen = Boolean(snapshot.filterDrawerOpen);
  state.gallerySplitPercent = clampGallerySplit(Number(snapshot.gallerySplitPercent) || state.gallerySplitPercent || 50);
  state.menuOpen = false;
  state.shareOpen = false;
  state.guidanceOpen = false;
  state.savedOpen = false;

  renderSite();

  const story = currentStory(state);
  if (story) {
    await ensureStoryImages(story);
    renderSite();
  }

  requestAnimationFrame(() => {
    if (state.galleryVisible && !state.storyVisible) {
      qs('#gallery')?.scrollIntoView({ behavior: 'auto', block: 'start' });
    } else if (state.storyVisible) {
      qs('#story-top')?.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  });
}

function setCurrentStory(id, options = {}) {
  const story = getStoryById(state.stories, id);
  if (!story) return;

  state.currentStoryId = story.id;
  state.currentImageIndex = 0;
  state.shareOpen = false;
  state.guidanceOpen = false;
  state.menuOpen = false;
  state.filterDrawerOpen = false;
  state.storyVisible = options.storyVisible ?? true;
  state.galleryVisible = options.galleryVisible ?? false;
  if (!options.skipUrl) {
    if (options.pushHistory) {
      pushStoryHistory(story);
    } else {
      updateUrlForStory(story, { hash: options.hash || '', state: makeHistoryState('story') });
    }
  }
  if (options.scrollTop) beginPendingStoryTop(story.id);
  renderSite();

  if (options.scrollTop) scrollStoryTop();
}

function resetPage() {
  state.galleryPage = viewportInitialPageCount();
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

  // Set initial page count to fill viewport rather than a fixed number
  state.galleryPage = viewportInitialPageCount();

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
  'review-sign-out': async () => {
    await signOutReviewSession();
  },
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
  'remove-saved': async ({ value }) => {
    state.savedIds = state.savedIds.filter((id) => String(id) !== String(value));
    savePersistentState(state);
    renderSite();
  },
  'open-saved-story': async ({ value }) => {
    state.savedOpen = false;
    setCurrentStory(value, { scrollTop: true });
  },
  'open-share': async () => {
    state.menuOpen = false;
    state.guidanceOpen = false;
    state.shareOpen = true;
    renderSite();
  },
  'close-share': async () => {
    state.shareOpen = false;
    renderSite();
  },
  'open-guidance': async () => {
    state.menuOpen = false;
    state.shareOpen = false;
    state.guidanceOpen = true;
    renderSite();
  },
  'close-guidance': async () => {
    state.guidanceOpen = false;
    renderSite();
  },
  'share-copy': async ({ story }) => {
    const url = story ? buildShareUrl(story) : buildGalleryShareUrl(state.filters);
    await writeToClipboard(url);
    state.shareOpen = false;
    state.actionMessage = getUiText(state.language).copied;
    renderSite();
    clearActionMessageSoon();
  },
  'share-facebook': async ({ story }) => {
    const url = story ? buildShareUrl(story) : buildGalleryShareUrl(state.filters);
    openUrlInNewTab(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
    state.shareOpen = false;
    renderSite();
  },
  'share-instagram': async ({ story }) => {
    const url = story ? buildShareUrl(story) : buildGalleryShareUrl(state.filters);
    await writeToClipboard(url);
    openUrlInNewTab('https://www.instagram.com/');
    state.shareOpen = false;
    state.actionMessage = getUiText(state.language).instagramHint;
    renderSite();
    clearActionMessageSoon();
  },
  'share-x': async ({ story }) => {
    const url = story ? buildShareUrl(story) : buildGalleryShareUrl(state.filters);
    const text = story ? currentStoryLabel(story) : getUiText(state.language).shareThisView || 'Photostories from Southwest State';
    openUrlInNewTab(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
    state.shareOpen = false;
    renderSite();
  },
  'share-email': async ({ story }) => {
    const url = story ? buildShareUrl(story) : buildGalleryShareUrl(state.filters);
    const subject = encodeURIComponent(story ? currentStoryLabel(story) : getUiText(state.language).shareThisView || 'Photostories from Southwest State');
    const body = encodeURIComponent(story ? `${labelFor(story.summary, state.language)}\n\n${url}` : url);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    state.shareOpen = false;
    renderSite();
  },
  'toggle-save': async ({ story }) => {
    if (story) toggleSaved(story.id);
  },
  'random-related': async ({ story }) => {
    if (!story) return;
    await loadGalleryDataset();
    const baseStory = getStoryById(state.stories, story.id) || story;
    const related = pickRandomRelatedStory(state, baseStory);
    if (related) setCurrentStory(related.id, { scrollTop: true });
  },
  'show-related': async ({ story }) => {
    if (!story) return;
    await loadGalleryDataset();
    state.filters = {
      district: [],
      people: (story.people || []).map((tag) => tag.slug).filter(Boolean),
      tags: (story.topicTags || []).map((tag) => tag.slug).filter(Boolean),
      searchQuery: ''
    };
    state.galleryMode = 'related';
    resetPage();
    state.storyVisible = true;
    state.galleryVisible = true;
    state.filterDrawerOpen = false;
    renderSite();
    scrollGallery();
  },
  'load-more': async () => {
    await loadGalleryDataset();
    if (hasMoreStories(state)) {
      state.galleryPage += 1;
      renderSite({ preserveGalleryScroll: true });
    }
  },
  'explore-all': async () => {
    await loadGalleryDataset();
    prepareGalleryEntry();
    state.storyVisible = true;
    state.galleryVisible = true;
    state.filterDrawerOpen = false;
    renderSite();
    scrollGallery();
  },
  'reset-filters': async () => {
    await loadGalleryDataset();
    state.filters = createEmptyFilters();
    state.galleryMode = 'total';
    wasSearchActiveLastKeystroke = false;
    resetPage();
    renderSite();
  },
  'clear-search': async () => {
    state.filters.searchQuery = '';
    wasSearchActiveLastKeystroke = false;
    setGalleryModeFromFilters();
    renderSite({ preserveGalleryScroll: true });
  },
  'filter-district': async ({ value }) => {
    await loadGalleryDataset();
    state.filters.district = state.filters.district.includes(value)
      ? state.filters.district.filter((slug) => slug !== value)
      : [...state.filters.district, value];
    setGalleryModeFromFilters();
    renderSite({ preserveGalleryScroll: true });
  },
  'filter-district-all': async () => {
    await loadGalleryDataset();
    state.filters.district = [];
    setGalleryModeFromFilters();
    renderSite({ preserveGalleryScroll: true });
  },
  'filter-tag': async ({ value }) => {
    await loadGalleryDataset();
    state.filters.tags = state.filters.tags.includes(value)
      ? state.filters.tags.filter((slug) => slug !== value)
      : [...state.filters.tags, value];
    setGalleryModeFromFilters();
    renderSite({ preserveGalleryScroll: true });
  },
  'filter-tag-all': async ({ value }) => {
    await loadGalleryDataset();
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
    renderSite({ preserveGalleryScroll: true });
  },
  'filter-people': async ({ value }) => {
    await loadGalleryDataset();
    state.filters.people = state.filters.people.includes(value)
      ? state.filters.people.filter((p) => p !== value)
      : [...state.filters.people, value];
    setGalleryModeFromFilters();
    renderSite({ preserveGalleryScroll: true });
  },
  'filter-people-all': async () => {
    await loadGalleryDataset();
    state.filters.people = [];
    setGalleryModeFromFilters();
    renderSite({ preserveGalleryScroll: true });
  },
  'open-story': async ({ value }) => {
    const story = getStoryById(state.stories, value);
    if (!story) return;
    // Trigger slide-in animation
    state.storySlideIn = true;
    state.storySlideOut = false;
    state.relatedPage = 1;
    if (state.galleryVisible) {
      replaceCurrentHistoryState('gallery');
      setCurrentStory(story.id, { scrollTop: true, pushHistory: true });
    } else {
      setCurrentStory(story.id, { scrollTop: true });
    }
    // Remove slide-in class after animation completes
    window.setTimeout(() => {
      state.storySlideIn = false;
      qs('.site-shell')?.classList.remove('is-story-sliding-in');
      scrollStoryTop();
    }, 420);
  },
  'close-story': async () => {
    await loadGalleryDataset();
    // Slide story out, reveal gallery
    state.storySlideOut = true;
    state.storySlideIn = false;
    renderSite();
    window.setTimeout(() => {
      state.storySlideOut = false;
      state.currentStoryId = null;
      state.storyVisible = false;
      state.galleryVisible = true;
      state.filterDrawerOpen = false;
      prepareGalleryEntry();
      const url = new URL(window.location.href);
      url.search = '';
      url.hash = 'gallery';
      history.pushState(makeHistoryState('gallery'), '', url.href);
      renderSite();
      requestAnimationFrame(() => qs('#gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }, 350);
  },
  'load-more-related': async () => {
    state.relatedPage = (state.relatedPage || 1) + 1;
    renderSite();
  },
  'prev-image': async () => { moveToPreviousImage(); },
  'next-image': async () => { moveToNextImage(); },
  'go-image': async ({ value }) => { setCurrentImage(value); },
  'toggle-filter-drawer': async () => {
    state.filterDrawerOpen = !state.filterDrawerOpen;
    renderSite();
  },
  'open-filter-drawer': async () => {
    state.filterDrawerOpen = true;
    renderSite();
  },
  'close-filter-drawer': async () => {
    state.filterDrawerOpen = false;
    renderSite();
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
  if (target.disabled || target.getAttribute('aria-disabled') === 'true') return;
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

function handleFilterResizeStart(event) {
  const handle = event.target.closest('[data-filter-resize-handle]');
  if (!handle || !qs('.site-shell.is-filter-split')) return;
  if (event.target.closest('button, a, input, textarea, select')) return;

  event.preventDefault();
  filterResizeDrag = { pointerId: event.pointerId };
  document.documentElement.classList.add('is-filter-resizing');
  handle.setPointerCapture?.(event.pointerId);
  setGallerySplitFromPointer(event.clientY);
}

function handleFilterResizeMove(event) {
  if (!filterResizeDrag) return;
  event.preventDefault();
  setGallerySplitFromPointer(event.clientY);
}

function handleFilterResizeEnd(event) {
  if (!filterResizeDrag) return;
  filterResizeDrag = null;
  document.documentElement.classList.remove('is-filter-resizing');
  replaceCurrentHistoryState(state.galleryVisible ? 'gallery' : 'story');
}

function updateSearchResultCountOnly(query) {
  // Lightweight update while the user types: refresh just the match-count
  // text and toggle visibility on already-rendered cards. Never touches
  // #app's innerHTML, so the live input node — and focus/caret — is never
  // disturbed, no matter how fast someone types.
  const t = getUiText(state.language);
  const q = query.trim().toLowerCase();
  const visibleCount = filteredStories(state).length;
  const visibleLimit = state.galleryPage * PAGE_SIZE;
  const countText = `${visibleCount}/${state.stories.length} ${t.photostories || t.stories || 'photostories'}`;
  const canShowResults = hasActiveFilters(state.filters) && visibleCount > 0;

  let matchingIndex = 0;
  qsa('.gallery-results-pane [data-story-id]').forEach((card) => {
    const haystack = card.dataset.searchHaystack || '';
    const matches = !q || haystack.includes(q);
    const isWithinCurrentPage = matches && matchingIndex < visibleLimit;
    if (matches) matchingIndex += 1;
    card.classList.toggle('is-search-hidden', !isWithinCurrentPage);
  });

  const activeFilterCount = qs('.gallery-active-filter-count');
  if (activeFilterCount) {
    activeFilterCount.textContent = countText;
  }
  qsa('.mobile-filter-footer-count').forEach((label) => {
    label.textContent = countText;
  });
  qsa('.gallery-show-results[data-action="close-filter-drawer"]').forEach((button) => {
    button.disabled = !canShowResults;
  });
  qsa('.mobile-filter-footer-reset[data-action="reset-filters"]').forEach((button) => {
    button.disabled = !hasActiveFilters(state.filters);
  });
  qsa('.filter-summary-text').forEach((label) => {
    label.textContent = countText;
  });

  const emptyState = qs('[data-search-empty-state]');
  if (emptyState) emptyState.style.display = visibleCount === 0 ? '' : 'none';

  const resultsPane = qs('.gallery-results-pane');
  let loadMoreRow = resultsPane ? qs('.load-more-row', resultsPane) : null;
  const hasMore = visibleCount > visibleLimit;
  if (!loadMoreRow && hasMore && resultsPane) {
    loadMoreRow = document.createElement('div');
    loadMoreRow.className = 'load-more-row';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'load-more-button';
    button.dataset.action = 'load-more';
    button.append(document.createTextNode(`${t.loadMore} `));
    const count = document.createElement('span');
    count.className = 'load-more-count';
    button.append(count);
    loadMoreRow.append(button);
    resultsPane.append(loadMoreRow);
  }
  if (loadMoreRow) {
    loadMoreRow.style.display = hasMore ? '' : 'none';
    const count = qs('.load-more-count', loadMoreRow);
    if (count) count.textContent = `${Math.min(visibleLimit, visibleCount)} / ${visibleCount}`;
  }
}

let wasSearchActiveLastKeystroke = false;

function handleSearchInput(event) {
  const input = event.target.closest('[data-search-input]');
  if (!input) return;

  const isNowActive = input.value.trim().length > 0;
  const isMobileFilterSearch = Boolean(input.closest('.mobile-filter-controls'));

  state.filters.searchQuery = input.value;
  qsa('[data-search-input]').forEach((field) => {
    if (field !== input) field.value = input.value;
  });
  setGalleryModeFromFilters();
  wasSearchActiveLastKeystroke = isNowActive;

  if (isMobileFilterSearch) {
    updateSearchResultCountOnly(input.value);
    saveGallerySession();
    return;
  }

  renderSite({ preserveGalleryScroll: true });
}

function attachGlobalListeners() {
  if (listenersAttached) return;

  const app = qs('#app');
  app?.addEventListener('click', handleAppClick);
  app?.addEventListener('input', handleSearchInput);
  app?.addEventListener('pointerdown', handleFilterResizeStart);
  app?.addEventListener('touchstart', handleTouchStart, { passive: true });
  app?.addEventListener('touchend', handleTouchEnd, { passive: true });

  window.addEventListener('pointermove', handleFilterResizeMove);
  window.addEventListener('pointerup', handleFilterResizeEnd);
  window.addEventListener('pointercancel', handleFilterResizeEnd);
  window.addEventListener('wheel', cancelPendingStoryTopOnIntent, { passive: true });
  window.addEventListener('touchstart', cancelPendingStoryTopOnIntent, { passive: true });
  window.addEventListener('pointerdown', cancelPendingStoryTopOnIntent, { passive: true });

  window.addEventListener('resize', () => {
    window.clearTimeout(window.__photostoryResizeTimer);
    window.__photostoryResizeTimer = window.setTimeout(() => {
      syncGalleryCardHeights();
      syncStoryStageOffset();
    }, 120);
  });

  window.addEventListener('hashchange', () => {
    requestAnimationFrame(() => scrollFromHash());
  });

  window.addEventListener('popstate', (event) => {
    restoreHistoryState(event.state).catch(console.error);
  });

  window.addEventListener('keydown', (event) => {
    cancelPendingStoryTopOnIntent(event);
    // Close overlays
    if (event.key === 'Escape') {
      if (!state.menuOpen && !state.shareOpen && !state.guidanceOpen && !state.savedOpen) return;
      state.menuOpen = false;
      state.shareOpen = false;
      state.guidanceOpen = false;
      state.savedOpen = false;
      renderSite();
      return;
    }
    // Arrow key image navigation (only when no overlay is open and story visible)
    if (state.storyVisible && !state.menuOpen && !state.shareOpen && !state.guidanceOpen && !state.savedOpen) {
      if (event.key === 'ArrowLeft') { moveToPreviousImage(); return; }
      if (event.key === 'ArrowRight') { moveToNextImage(); }
    }
  });

  document.addEventListener('load', (event) => {
    if (event.target?.matches?.('img[data-image-fade]')) {
      markImageLoaded(event.target);
    }
  }, true);

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

  await initialiseI18n(state.language);

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const shouldFocusSearch = params.get('focus') === 'search';
  const shouldRandomise = params.has('random') && !code;
  const hasExplicitGalleryParams = ['district', 'people', 'tags', 'q'].some((key) => params.has(key));
  const selectedStory = code ? await fetchStoryByCode(code) : null;

  // Restore gallery filter state from shared URL params
  if (!code) {
    await loadGalleryDataset();
    if (hasExplicitGalleryParams) {
      const pDistrict = params.get('district');
      const pPeople   = params.get('people');
      const pTags     = params.get('tags');
      const pQ        = params.get('q');
      if (pDistrict) state.filters.district = pDistrict.split(',').filter(Boolean);
      if (pPeople)   state.filters.people   = pPeople.split(',').filter(Boolean);
      if (pTags)     state.filters.tags     = pTags.split(',').filter(Boolean);
      if (pQ)        state.filters.searchQuery = pQ;
      wasSearchActiveLastKeystroke = Boolean(pQ && pQ.trim());
    } else {
      restoreGallerySession();
      wasSearchActiveLastKeystroke = Boolean(state.filters.searchQuery && state.filters.searchQuery.trim());
    }
  }
  const randomStory = shouldRandomise
    ? state.stories[Math.floor(Math.random() * state.stories.length)] || null
    : null;
  const activeStory = shouldRandomise ? randomStory : selectedStory;
  const startInGallery = !activeStory;

  if (activeStory && !state.stories.some((story) => String(story.id) === String(activeStory.id))) {
    state.stories = [activeStory];
    state.tagClusters = [];
    state.galleryDatasetLoaded = false;
  }

  if (startInGallery && !state.galleryDatasetLoaded) {
    await loadGalleryDataset();
  }

  if (startInGallery) {
    showGalleryOnly();
    prepareGalleryEntry();
  } else {
    state.currentStoryId = activeStory.id;
    state.storyVisible = true;
    state.galleryVisible = false;
    state.filterDrawerOpen = false;
  }

  const initialUrl = startInGallery
    ? galleryUrl()
    : shouldRandomise && randomStory
    ? buildShareUrl(randomStory)
    : window.location.href;
  history.replaceState(makeHistoryState(startInGallery ? 'gallery' : 'story'), '', initialUrl);

  savePersistentState(state);
  renderSite();
  hydrateRelatedStoriesAfterStoryRender();

  if (window.location.hash && state.galleryVisible) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollFromHash({ behavior: 'auto' });
        if (shouldFocusSearch) focusSearchInput();
      });
    });
  } else if (shouldFocusSearch && state.galleryVisible) {
    requestAnimationFrame(() => focusSearchInput());
  }
}
