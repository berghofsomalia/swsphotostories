import { getLandingText, getUiText, STORAGE_KEYS, initialiseI18n } from './content.js';
import { fetchStories } from './api.js?v=20260709-gallery-facets';
import { renderMenu } from './menu.js';

const ABOUT_COPY_FIELDS = [
  'title',
  'processIntro',
  'processPhotographed',
  'processOutreach',
  'sharedPhotos',
  'communityPicked',
  'processFinal',
  'questionsIntro',
  'guideStoryIntro',
  'guideStoryActions',
  'guideDiscoverPrefix',
  'guideHomeLink',
  'guideDiscoverMiddle',
  'guideGalleryLink',
  'guideDiscoverSuffix',
  'guideMenuPrefix',
  'guideMenuSuffix'
];

let ABOUT_COPY = null;

function validateAboutCopy(copy) {
  ['en', 'so'].forEach((language) => {
    const entry = copy?.[language];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`Missing "${language}" object.`);
    }
    ABOUT_COPY_FIELDS.forEach((field) => {
      if (typeof entry[field] !== 'string') {
        throw new Error(`"${language}.${field}" must be text inside double quotation marks.`);
      }
    });
    if (!Array.isArray(entry.questions) || entry.questions.length !== 6 || entry.questions.some((question) => typeof question !== 'string')) {
      throw new Error(`"${language}.questions" must contain exactly six quoted text items.`);
    }
  });
  return copy;
}

async function loadAboutCopy() {
  const url = new URL('../content/about.json', import.meta.url);
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not load content/about.json (HTTP ${response.status}).`);
  try {
    ABOUT_COPY = validateAboutCopy(await response.json());
  } catch (error) {
    throw new Error(`content/about.json is not valid: ${error.message}`);
  }
}

const ABOUT_IMAGE_SETS = {
  shir0: ['images/shir0 (1).jpg', 'images/shir0 (2).jpg', 'images/shir0 (3).jpg', 'images/shir0 (4).jpg', 'images/shir0 (5).jpg'],
  shir1: ['images/shir1 (1).jpg', 'images/shir1 (5).JPG', 'images/shir1 (6).jpg', 'images/shir1 (7).jpg', 'images/shir1 (8).jpg'],
  shir2: ['images/shir2 (1).JPG', 'images/shir2 (2).jpg', 'images/shir2 (3).jpg', 'images/shir2 (4).jpg', 'images/shir2 (5).jpg', 'images/shir2 (6).jpg', 'images/shir2 (7).jpg', 'images/shir2 (8).jpg', 'images/shir2 (9).JPG', 'images/shir2 (10).JPG'],
  shir3: ['images/shir3 (1).JPG', 'images/shir3 (2).JPG', 'images/shir3 (3).JPG', 'images/shir3 (4).jpg', 'images/shir3 (5).JPG', 'images/shir3 (6).JPG', 'images/shir3 (7).JPG', 'images/shir3 (8).JPG', 'images/shir3 (9).JPG', 'images/shir3 (10).JPG']
};

const FIXED_IMAGES = {
  map: 'images/map.png',
  process1: 'images/process1.png',
  process2: 'images/process2.png',
  process3: 'images/process3.png',
  process4: 'images/process4.png'
};

const ABOUT_CAROUSEL_INTERVAL_MS = 7000;
let aboutCarouselTimer = null;

const state = {
  language: localStorage.getItem(STORAGE_KEYS.language) || 'en',
  theme: localStorage.getItem(STORAGE_KEYS.theme) || 'dark',
  stories: [],
  menuOpen: false,
  savedOpen: false,
  savedIds: [],
  siteStats: { stories: null, reflections: null }
};

try {
  state.savedIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.saved) || '[]').map(String);
} catch {}

function saveState() {
  localStorage.setItem(STORAGE_KEYS.language, state.language);
  localStorage.setItem(STORAGE_KEYS.theme, state.theme);
  document.documentElement.lang = state.language === 'so' ? 'so' : 'en';
  document.documentElement.dataset.theme = state.theme;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderQuestionIcon(index) {
  const icons = [
    `<svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="5" y="14" width="54" height="36" rx="6"/>
      <path d="M12 19v26h40V19H12Z"/>
      <circle cx="17" cy="25" r="2.5"/>
      <path d="m12 41 10-10 8 8 6-6 16 12M8.5 28v8M55.5 30h.1"/>
    </svg>`,
    `<svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="17" cy="35" r="8"/>
      <path d="M4 57v-5c0-7.5 5.8-12 13-12s13 4.5 13 12v5H4Z"/>
      <circle cx="30" cy="32" r="2.5"/><circle cx="36" cy="25" r="4"/>
      <path d="M42 20c-4.4 0-7.5-3.1-7.5-7s3-7 7.2-7c1.7-3.5 5.3-5.5 9.2-5 3.3.4 5.9 2.5 7 5.4 3.5.4 6.1 3.2 6.1 6.7 0 3.8-3 6.9-6.9 6.9H42Z"/>
    </svg>`,
    `<svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="16" cy="18" r="7"/><circle cx="48" cy="18" r="7"/>
      <path d="M5 52v-9c0-8 4.8-13 11-13 4.5 0 8.3 2.7 10 7M59 52v-9c0-8-4.8-13-11-13-4.5 0-8.3 2.7-10 7"/>
      <path d="M17 43c6.5-5 11.2-6.4 15-4.2M47 39c-5.6 0-9.5 2.1-15 7.2"/>
      <path d="M32 46c-4-4-7.5-5.8-10.5-5.4M44 35c2.5 1.4 3.8 3.8 3.8 7"/>
    </svg>`,
    `<svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M18 8 3.8 33h28.4L18 8Z"/><path d="M18 18v7M18 29h.1"/>
      <path d="M42 53S25.5 44.1 25.5 32.3c0-5.5 7-8.5 11.3-3.2L42 35l5.2-5.9c4.3-5.3 11.3-2.3 11.3 3.2C58.5 44.1 42 53 42 53Z"/>
    </svg>`,
    `<svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="3" y="12" width="24" height="38" rx="3"/>
      <path d="M15 44V27M15 31l-6-6M15 35l7-8M10 44h10M8 20l3 2M21 19l-3 3"/>
      <path d="M30 31h6M33 27l4 4-4 4"/>
      <rect x="39" y="12" width="22" height="38" rx="3"/>
      <path d="M50 44V28M50 32l-5-5M50 35l6-7M44 44h12"/>
      <circle cx="45" cy="25" r="3"/><circle cx="50" cy="21" r="3.5"/><circle cx="56" cy="25" r="3"/>
      <path d="M43 35c-3-3-3-6 1-7M57 35c3-3 3-6-1-7"/>
    </svg>`,
    `<svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M7 14h29a5 5 0 0 1 5 5v19a5 5 0 0 1-5 5H20l-9 7v-7H7a5 5 0 0 1-5-5V19a5 5 0 0 1 5-5Z"/>
      <path d="M11 32c0-5 2.2-8 6.5-9M11 32h7v-7h-4M23 32c0-5 2.2-8 6.5-9M23 32h7v-7h-4"/>
      <path d="M52 17a13 13 0 1 0 7 22 11 11 0 1 1-7-22Z"/>
      <path d="m55 12 1.5 3.2 3.5.4-2.6 2.4.7 3.5-3.1-1.8-3.1 1.8.7-3.5-2.6-2.4 3.5-.4L55 12Z"/>
    </svg>`
  ];

  return `<span class="about-question-icon">${icons[index] || icons[0]}</span>`;
}

function countReflections(stories = []) {
  return stories.reduce((total, story) => total + Number(story.reflectionCount || (story.reflection?.en || story.reflection?.so ? 1 : 0)), 0);
}

function renderContextStrips(landing) {
  const nexusLines = landing.section1NexusLines || [];
  const titleLines = landing.section1TitleLines || [];
  return `
    <div class="context-strip context-strip--top context-strip--nexus" aria-hidden="true">${nexusLines.map((line) => `<span>${escapeHtml(line)}</span>`).join('')}</div>
    <div class="context-strip context-strip--bottom context-strip--title" aria-hidden="true">${titleLines.map((line) => `<span>${escapeHtml(line)}</span>`).join('')}</div>
  `;
}

function pageImage(src, alt = '', eager = false) {
  if (!src) return '';
  return eager
    ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="eager" fetchpriority="high" decoding="async">`
    : `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">`;
}

function cssImageUrl(src = '') {
  if (!src) return '';
  if (/^(?:https?:|data:|\/)/i.test(src)) return src;
  return src.startsWith('images/') ? `../about/${src}` : src;
}

function renderImagePanel(src, modifier = '', eager = false) {
  return `
    <div class="about-v2-image ${modifier}" style="--about-image-url: url('${escapeHtml(cssImageUrl(src))}')">
      ${pageImage(src, '', eager)}
    </div>
  `;
}

function renderCarouselPanel(images = [], key = '', modifier = '', eager = false) {
  const slides = images.filter(Boolean);
  if (slides.length <= 1) return renderImagePanel(slides[0] || '', modifier, eager);

  const bgImages = [];
  const fgImages = [];
  const progressBars = [];

  slides.forEach((src, index) => {
    const isFirst = index === 0;
    const activeClass = isFirst ? 'is-active' : '';
    const loading = eager && isFirst ? 'eager' : 'lazy';
    const escapedSrc = escapeHtml(src);

    bgImages.push(`
      <img
        class="about-v2-carousel-bg ${activeClass}"
        src="${escapedSrc}"
        alt=""
        aria-hidden="true"
        loading="${loading}"
        decoding="async"
      >
    `);

    fgImages.push(`
      <img
        class="about-v2-carousel-image ${activeClass}"
        src="${escapedSrc}"
        alt=""
        loading="${loading}"
        ${eager && isFirst ? 'fetchpriority="high"' : ''}
        decoding="async"
      >
    `);

    progressBars.push(`<span class="${activeClass}"></span>`);
  });

  return `
    <div class="about-v2-image ${modifier} about-v2-carousel" data-about-carousel="${escapeHtml(key)}" style="--about-image-url: url('${escapeHtml(cssImageUrl(slides[0]))}')">
      ${bgImages.join('')}
      ${fgImages.join('')}
      <div class="about-carousel-progress" aria-hidden="true">
        ${progressBars.join('')}
      </div>
    </div>
  `;
}

function aboutImageStyle(src = '') {
  return `style="--about-image-url: url('${escapeHtml(cssImageUrl(src))}')"`;
}

function renderProcessStep(text, image, index) {
  return `
    <article class="about-process-step about-process-step--${index}">
      <div class="about-process-copy"><p>${escapeHtml(text)}</p></div>
      ${renderImagePanel(image, 'about-v2-image--process')}
    </article>
  `;
}

function renderExploreGuide(copy) {
  const stories = state.siteStats.stories == null ? '...' : String(state.siteStats.stories);
  const homeLink = '../';
  const searchLink = '../stories/?focus=search#gallery';

  return `
    <div class="about-guide-copy">
      <div class="about-guide-column">
        <p>${escapeHtml(copy.guideStoryIntro)}</p>
        <p>${escapeHtml(copy.guideStoryActions)}</p>
      </div>
      <div class="about-guide-column">
        <p>${escapeHtml(copy.guideDiscoverPrefix.replace('{stories}', stories))}<a data-about-home-link href="${escapeHtml(homeLink)}">${escapeHtml(copy.guideHomeLink)}</a>${escapeHtml(copy.guideDiscoverMiddle)}<a href="${escapeHtml(searchLink)}">${escapeHtml(copy.guideGalleryLink)}</a>${escapeHtml(copy.guideDiscoverSuffix)}</p>
        <p>${escapeHtml(copy.guideMenuPrefix)}<span class="about-guide-menu-icon" aria-hidden="true">☰</span>${escapeHtml(copy.guideMenuSuffix)}</p>
      </div>
    </div>
  `;
}

const closeIcon = () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

function renderSavedDrawer(t) {
  const savedStories = state.stories.filter((s) => state.savedIds.includes(String(s.id)));
  return `
    ${state.savedOpen ? `<button type="button" class="saved-drawer-backdrop is-open" data-action="close-saved" aria-label="${escapeHtml(t.close)}"></button>` : ''}
    <aside class="saved-drawer ${state.savedOpen ? 'is-open' : ''}" aria-hidden="${!state.savedOpen}">
      <div class="drawer-header drawer-header--inline">
        <div class="drawer-title-row">
          <button type="button" class="icon-button drawer-close-button" data-action="close-saved">${closeIcon()}</button>
          <div class="drawer-title">${escapeHtml(t.savedPhotostories)}</div>
        </div>
      </div>
      <div class="drawer-body">
        ${savedStories.length === 0
          ? `<div class="drawer-empty">${escapeHtml(t.noSaved)}</div>`
          : savedStories.map((s) => `
            <div class="saved-item">
              <a class="saved-item-main" href="../stories/?code=${escapeHtml(s.id)}">
                <div class="saved-thumb"><img src="${escapeHtml(s.images?.[0] || '')}" alt="${escapeHtml(s.storyteller)}"></div>
                <div class="saved-copy">
                  <div class="saved-name">${escapeHtml(s.storyteller)}</div>
                  <div class="saved-summary">${escapeHtml(s.summary?.[state.language] || s.summary?.en || '')}</div>
                </div>
              </a>
              <button type="button" class="saved-remove-button" data-action="remove-saved" data-value="${escapeHtml(s.id)}" aria-label="${escapeHtml(t.close)}">${closeIcon()}</button>
            </div>`).join('')}
      </div>
    </aside>
  `;
}

function renderMenuForAbout(t) {
  return renderMenu(state, {
    esc: escapeHtml,
    t,
    basePaths: { home: '../', about: './', stories: '../stories/' },
    savedCount: state.savedIds.length,
    savedAction: 'open-saved'
  });
}

function renderLoading() {
  saveState();
  const app = document.querySelector('#app');
  if (!app) return;
  const loadingText = state.language === 'so' ? 'Bogga waa la raraya...' : 'Loading...';
  app.innerHTML = `<div class="intro-modal landing-page-shell"><div class="loading-state loading-state--page"><span class="loading-spinner" aria-hidden="true"></span><span>${escapeHtml(loadingText)}</span></div></div>`;
}

function renderLandingPage() {
  saveState();
  const app = document.querySelector('#app');
  if (!app) return;

  const landing = getLandingText(state.language);
  const t = getUiText(state.language);
  const copy = ABOUT_COPY[state.language] || ABOUT_COPY.en;
  document.title = `${t.about} - ${t.siteTitle}`;

  app.innerHTML = `
    <div class="intro-modal intro-modal--pdfstyle landing-page-shell about-v2-shell">
      ${renderMenuForAbout(t)}
      ${renderSavedDrawer(t)}
      <main class="about-v2-scroll" id="about-main">
        <section class="about-v2-section about-v2-section--intro">
          <div class="about-v2-grid about-v2-grid--intro">
            ${renderImagePanel(FIXED_IMAGES.map, 'about-v2-image--map', true)}
            <div class="about-title-panel"><h1>${escapeHtml(copy.title)}</h1></div>
            ${renderContextStrips(landing)}
          </div>
        </section>

        <section class="about-v2-section about-v2-section--process">
          <div class="about-process-grid">
            ${renderProcessStep(copy.processIntro, FIXED_IMAGES.process1, 1)}
            ${renderProcessStep(copy.processPhotographed, FIXED_IMAGES.process2, 2)}
            ${renderProcessStep(copy.processOutreach, FIXED_IMAGES.process3, 3)}
          </div>
        </section>

        <section class="about-v2-section about-v2-section--full-image">
          ${renderCarouselPanel(ABOUT_IMAGE_SETS.shir0, 'shir0', 'about-v2-image--full', true)}
        </section>

        <section class="about-v2-section about-v2-section--two-col">
          <div class="about-v2-grid about-v2-grid--two-col" ${aboutImageStyle(ABOUT_IMAGE_SETS.shir1?.[0])}>
            ${renderCarouselPanel(ABOUT_IMAGE_SETS.shir1, 'shir1', 'about-v2-image--story')}
            <div class="about-copy-panel about-copy-panel--shared"><p>${escapeHtml(copy.sharedPhotos)}</p></div>
          </div>
        </section>

        <section class="about-v2-section about-v2-section--two-col">
          <div class="about-v2-grid about-v2-grid--two-col about-v2-grid--reverse" ${aboutImageStyle(ABOUT_IMAGE_SETS.shir2?.[0])}>
            <div class="about-copy-panel about-copy-panel--community"><p>${escapeHtml(copy.communityPicked)}</p></div>
            ${renderCarouselPanel(ABOUT_IMAGE_SETS.shir2, 'shir2', 'about-v2-image--story')}
          </div>
        </section>

        <section class="about-v2-section about-v2-section--two-col">
          <div class="about-v2-grid about-v2-grid--two-col" ${aboutImageStyle(FIXED_IMAGES.process4)}>
            ${renderImagePanel(FIXED_IMAGES.process4, 'about-v2-image--story')}
            <div class="about-copy-panel about-copy-panel--final"><p>${escapeHtml(copy.processFinal)}</p></div>
          </div>
        </section>

        <section class="about-v2-section about-v2-section--questions">
          <div class="about-question-shell">
            <p class="about-question-intro">${escapeHtml(copy.questionsIntro)}</p>
            <div class="about-question-grid">
              ${copy.questions.map((question, index) => `
                <article class="about-question-item">
                  ${renderQuestionIcon(index)}
                  <p>${escapeHtml(question)}</p>
                </article>
              `).join('')}
            </div>
          </div>
        </section>

        <section class="about-v2-section about-v2-section--full-image about-v2-section--final-image">
          ${renderCarouselPanel(ABOUT_IMAGE_SETS.shir3, 'shir3', 'about-v2-image--full', true)}
        </section>

        <section class="about-v2-section about-v2-section--guide">
          ${renderExploreGuide(copy)}
        </section>
      </main>
    </div>
  `;

  startAboutCarousels();
}

function startAboutCarousels() {
  if (aboutCarouselTimer) {
    window.clearInterval(aboutCarouselTimer);
    aboutCarouselTimer = null;
  }

  const carousels = Array.from(document.querySelectorAll('[data-about-carousel]'));
  if (!carousels.length) return;

  aboutCarouselTimer = window.setInterval(() => {
    document.querySelectorAll('[data-about-carousel]').forEach((carousel) => {
      const slides = Array.from(carousel.querySelectorAll('.about-v2-carousel-image'));
      const bgSlides = Array.from(carousel.querySelectorAll('.about-v2-carousel-bg'));
      const bars = Array.from(carousel.querySelectorAll('.about-carousel-progress span'));
      if (slides.length < 2) return;

      const currentIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
      const nextIndex = (currentIndex + 1) % slides.length;
      slides[currentIndex]?.classList.remove('is-active');
      bgSlides[currentIndex]?.classList.remove('is-active');
      bars[currentIndex]?.classList.remove('is-active');
      slides[nextIndex]?.classList.add('is-active');
      bgSlides[nextIndex]?.classList.add('is-active');
      bars[nextIndex]?.classList.add('is-active');
      carousel.style.setProperty('--about-image-url', `url('${cssImageUrl(slides[nextIndex].getAttribute('src') || '')}')`);
      carousel.closest('.about-v2-grid--two-col')?.style.setProperty('--about-image-url', `url('${cssImageUrl(slides[nextIndex].getAttribute('src') || '')}')`);
    });
  }, ABOUT_CAROUSEL_INTERVAL_MS);
}

const ACTION_HANDLERS = {
  'toggle-menu': () => {
    state.menuOpen = !state.menuOpen;
  },
  'close-menu': () => {
    state.menuOpen = false;
  },
  'open-saved': () => {
    state.menuOpen = false;
    state.savedOpen = true;
  },
  'close-saved': () => {
    state.savedOpen = false;
  },
  'remove-saved': (value) => {
    state.savedIds = state.savedIds.filter((id) => String(id) !== String(value));
    localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(state.savedIds.map(String)));
  },
  'set-language': async (value) => {
    state.language = value === 'so' ? 'so' : 'en';
    state.menuOpen = false;
    await initialiseI18n(state.language);
  },
  'set-theme': (value) => {
    state.theme = value === 'light' ? 'light' : 'dark';
    state.menuOpen = false;
  }
};

function attachListeners() {
  document.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action]');
    const handler = target && ACTION_HANDLERS[target.dataset.action];
    if (!handler) return;

    await handler(target.dataset.value);
    renderLandingPage();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    if (state.savedOpen) {
      state.savedOpen = false;
      renderLandingPage();
    } else if (state.menuOpen) {
      state.menuOpen = false;
      renderLandingPage();
    }
  });
}

async function init() {
  attachListeners();
  renderLoading();
  await Promise.all([
    initialiseI18n(state.language),
    loadAboutCopy()
  ]);
  renderLandingPage();

  fetchStories()
    .then((stories) => {
      state.stories = stories;
      state.siteStats = {
        stories: stories.length,
        reflections: countReflections(stories)
      };
      renderLandingPage();
    })
    .catch((error) => console.warn('Could not load story stats', error));
}

init().catch((error) => {
  console.error(error);
  const app = document.querySelector('#app');
  if (app) app.innerHTML = `<div class="error-state">The About text could not be loaded. Check content/about.json.<br>${escapeHtml(error.message || '')}</div>`;
});
