import { getUiText, labelFor } from './content.js';
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

function setCurrentStory(id, options = {}) {
  const story = getStoryById(state.stories, id);
  if (!story) return;

  state.currentStoryId = story.id;
  state.currentImageIndex = 0;
  state.shareOpen = false;
  updateUrlForStory(story);
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
  'set-theme': async ({ value }) => {
    state.theme = value === 'light' ? 'light' : 'dark';
    savePersistentState(state);
    renderSite();
  },
  'intro-random': async () => {
    const fallback = currentStory(state);
    const candidate = state.stories[Math.floor(Math.random() * state.stories.length)] || fallback;
    if (!candidate) return;

    state.currentStoryId = candidate.id;
    state.currentImageIndex = 0;
    state.introOpen = false;
    renderSite();
    scrollStoryTop();
  },
  'intro-explore': async () => {
    state.introOpen = false;
    renderSite();
    window.setTimeout(scrollGallery, 120);
  },
  'intro-share-own': async () => {
    window.location.href = 'mailto:?subject=Photostory submission';
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
      primaryTheme: story.primaryTheme.slug,
      secondaryThemes: story.secondaryThemes.map((theme) => theme.slug),
      people: [...story.actors]
    };
    state.galleryMode = 'related';
    renderSite();
    scrollGallery();
  },
  'explore-all': async () => {
    state.filters = createEmptyFilters();
    state.galleryMode = 'total';
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
  const story = currentStory(state);
  if (state.introOpen || !story || story.images.length <= 1) return;

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

async function imageExists(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadSectionImage(sectionNumber) {
  const probes = [];
  const extensions = ['jpg', 'png'];

  for (let index = 1; index <= 6; index += 1) {
    extensions.forEach((extension) => {
      probes.push(`images/landing/${sectionNumber} (${index}).${extension}`);
    });
  }

  const existing = (await Promise.all(probes.map((src) => imageExists(src)))).filter(Boolean);
  const shuffled = existing.sort(() => Math.random() - 0.5);

  if (shuffled.length > 0) return shuffled[0];

  const fallbackStory = state.stories[Math.floor(Math.random() * state.stories.length)];
  return fallbackStory?.images?.[0] || '';
}

async function loadLandingAssets() {
  const primaryMap = await imageExists('images/landing/map 2.png');
  const fallbackMap = await imageExists('images/landing/sws on somalia map_wrinkle.png');
  state.landingMap = primaryMap || fallbackMap || 'assets/sws-map-wrinkle.png';

  const sections = [1, 3, 4, 5];
  const resolved = await Promise.all(sections.map((section) => loadSectionImage(section)));
  state.landingSectionImages = Object.fromEntries(sections.map((section, index) => [section, resolved[index]]));
}

export async function initialiseApp() {
  attachGlobalListeners();

  const dataUrl = new URL('../data/stories.json', import.meta.url);
  const response = await fetch(dataUrl);
  const payload = await response.json();
  state.stories = payload.stories || [];

  await loadLandingAssets();

  const code = new URLSearchParams(window.location.search).get('code');
  const existing = getStoryById(state.stories, code);
  const randomStory = state.stories[Math.floor(Math.random() * state.stories.length)] || null;

  state.currentStoryId = existing?.id || randomStory?.id || null;
  state.introOpen = !existing;

  savePersistentState(state);
  renderSite();
}
