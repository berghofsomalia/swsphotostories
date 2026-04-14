import { renderApp, qs, qsa, syncGalleryCardHeights } from './render.js';
import { state, createEmptyFilters } from './state.js';
import {
  buildShareUrl,
  currentStory,
  getStoryById,
  hasActiveFilters,
  pickRandomRelatedStory,
  savePersistentState,
  updateUrlForStory,
  isSaved
} from './story-data.js';
import { getUiText, labelFor } from './content.js';

let actionMessageTimerId = null;
let touchStartX = null;
let listenersAttached = false;

function renderSite() {
  renderApp(state);
  startAutoplay();
  requestAnimationFrame(syncGalleryCardHeights);
}

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
  state.storyVisible = options.storyVisible ?? true;
  state.galleryVisible = options.galleryVisible ?? false;
  updateUrlForStory(story, { hash: options.hash || '' });
  renderSite();

  if (options.scrollTop) {
    scrollStoryTop();
  }
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

const ACTIONS = {
  'set-language': async ({ value }) => {
    state.language = value === 'so' ? 'so' : 'en';
    savePersistentState(state);
    renderSite();
  },
  'open-saved': async () => {
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
    const body = encodeURIComponent(`${labelFor(story.summary, state.language)}

${shareUrl}`);
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
      primaryTheme: story.primaryTheme.slug,
      secondaryThemes: story.secondaryThemes.map((theme) => theme.slug),
      people: [...story.actors]
    };
    state.galleryMode = 'related';
    state.storyVisible = true;
    state.galleryVisible = true;
    renderSite();
    scrollGallery();
  },
  'explore-all': async () => {
    state.filters = createEmptyFilters();
    state.galleryMode = 'total';
    state.storyVisible = true;
    state.galleryVisible = true;
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
  window.addEventListener('beforeunload', stopAutoplay);
  listenersAttached = true;
}

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

export async function initialiseApp() {
  attachGlobalListeners();

  const dataUrl = new URL('../data/stories.json', import.meta.url);
  const response = await fetch(dataUrl);
  const payload = await response.json();
  state.stories = payload.stories || [];

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
