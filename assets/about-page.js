import { getLandingText, getUiText, STORAGE_KEYS, initialiseI18n } from './content.js';
import { fetchStories } from './api.js?v=20260607-story-photos';
import { renderMenu } from './menu.js?v=20260715-no-about-menu';

const LANDING_MAP_IMAGE = 'images/1.png';

const LANDING_SECTION_IMAGE_SETS = {
  2: [
    'images/2 (1).jpg',
    'images/2 (2).jpg',
    'images/2 (3).jpg',
    'images/2 (4).jpg',
    'images/2 (5).jpg'
  ],
  3: [
    'images/3 (1).jpg',
    'images/3 (2).jpg',
    'images/3 (3).jpg',
    'images/3 (4).jpg',
    'images/3 (5).jpg',
    'images/3 (6).jpg',
    'images/3 (7).jpg'
  ],
  4: [
    'images/4 (1).JPG',
    'images/4 (2).jpg',
    'images/4 (3).jpg',
    'images/4 (4).JPG',
    'images/4 (5).JPG',
    'images/4 (6).JPG',
    'images/4 (7).JPG',
    'images/4 (8).JPG',
    'images/4 (9).JPG',
    'images/4 (10).JPG'
  ],
  5: [
    'images/5 (1).JPG',
    'images/5 (2).jpg',
    'images/5 (3).jpg',
    'images/5 (4).JPG',
    'images/5 (5).JPG',
    'images/5 (6).JPG',
    'images/5 (7).jpg',
    'images/5 (8).JPG'
  ]
};

const state = {
  language:   localStorage.getItem(STORAGE_KEYS.language) || 'en',
  theme:      localStorage.getItem(STORAGE_KEYS.theme)    || 'dark',
  stories:    [],
  menuOpen:   false,
  savedOpen:  false,
  savedIds:   [],
  landingMap: LANDING_MAP_IMAGE,
  landingSectionImages: {},
  siteStats: { stories: null, reflections: null }
};


try { state.savedIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.saved) || '[]').map(String); } catch {}

function randomStoryLink(basePath = '../stories/') {
  const story = state.stories[Math.floor(Math.random() * state.stories.length)];
  if (!story) return `${basePath}#gallery`;
  return `${basePath}?code=${encodeURIComponent(story.code || story.id)}`;
}

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

function renderLineBreakCopy(lines) {
  return lines.map((line) => `<span>${escapeHtml(line)}</span>`).join('<br>');
}

function renderContextStrips(landing) {
  const nexusLines = landing.section1NexusLines || [];
  const titleLines = landing.section1TitleLines || [];
  return `
    <div class="context-strip context-strip--top context-strip--nexus" aria-hidden="true">${nexusLines.map((line) => `<span>${escapeHtml(line)}</span>`).join('')}</div>
    <div class="context-strip context-strip--bottom context-strip--title" aria-hidden="true">${titleLines.map((line) => `<span>${escapeHtml(line)}</span>`).join('')}</div>
  `;
}

function countReflections(stories = []) {
  return stories.reduce((total, story) => total + Number(story.reflectionCount || (story.reflection?.en || story.reflection?.so ? 1 : 0)), 0);
}

function formatStat(value) {
  return value == null ? '…' : String(value);
}

function renderExploreCta() {
  const storyCount = formatStat(state.siteStats.stories);
  const searchLink = '../stories/?focus=search#gallery';
  const galleryLink = '../stories/#gallery';
  const randomLink = randomStoryLink('../stories/');
  const paragraphs = state.language === 'so'
    ? [
      `Waxaan kugu martiqaadeynaa inaad sahamiso ${storyCount}-ka sheeko-sawireed.`,
      `Waxaad ${renderCtaLink(searchLink, 'raadin kartaa erayo gaar ah')} oo maskaxdaada ku jira, ama ${renderCtaLink(galleryLink, 'isku dari kartaa mawduucyo, dad iyo goobo')} si aad u raacdo xiriirrada adiga kuu muuqda.`,
      `Ama, haddii aad rabto wax lama-filaan ah, ${renderCtaLink(randomLink, 'fur sheeko-sawireed aan kala sooc lahayn')}.`
    ]
    : [
      `We invite you to explore the ${storyCount} photostories.`,
      `You can ${renderCtaLink(searchLink, 'search for specific words')} you have in mind, or ${renderCtaLink(galleryLink, 'combine themes, people and places')} to follow the connections that matter to you.`,
      `Or, if you are in the mood for a surprise, ${renderCtaLink(randomLink, 'open a random photostory')}.`
    ];

  return `
    <div class="landing-cta-copy">
      ${paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('')}
    </div>
  `;
}

function renderCtaLink(href, text) {
  return `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`;
}

function randomItem(items = []) {
  return items[Math.floor(Math.random() * items.length)] || '';
}

function pickLandingSectionImages() {
  return Object.fromEntries(
    Object.entries(LANDING_SECTION_IMAGE_SETS).map(([section, images]) => [section, randomItem(images)])
  );
}

// Icons
const closeIcon = () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

// Saved drawer
function renderSavedDrawer(t) {
  const savedStories = state.stories.filter((s) => state.savedIds.includes(s.id));
  return `
    ${state.savedOpen
      ? `<button type="button" class="saved-drawer-backdrop is-open" data-action="close-saved" aria-label="${escapeHtml(t.close)}"></button>`
      : ''}
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
                <div class="saved-thumb">
                  <img src="${escapeHtml(s.images?.[0] || '')}" alt="${escapeHtml(s.storyteller)}" style="width:100%;height:100%;object-fit:cover;">
                </div>
                <div class="saved-copy">
                  <div class="saved-name">${escapeHtml(s.storyteller)}</div>
                  <div class="saved-summary">${escapeHtml(s.summary?.en || '')}</div>
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
    basePaths: { home: '../', stories: '../stories/' },
    savedCount:  state.savedIds.length,
    savedAction: 'open-saved'
  });
}

function renderLoading() {
  saveState();
  const app = document.querySelector('#app');
  if (!app) return;
  const loadingText = state.language === 'so' ? 'Bogga waa la raraya…' : 'Loading…';
  app.innerHTML = `<div class="intro-modal landing-page-shell"><div class="loading-state loading-state--page"><span class="loading-spinner" aria-hidden="true"></span><span>${escapeHtml(loadingText)}</span></div></div>`;
}

function renderLandingPage() {
  saveState();
  const app = document.querySelector('#app');
  if (!app) return;

  document.documentElement.classList.toggle('is-modal-open', Boolean(state.menuOpen || state.savedOpen));

  const landing = getLandingText(state.language);
  const t = getUiText(state.language);
  const si = state.landingSectionImages;

  document.title = `${t.about} — ${t.siteTitle}`;

  const pageImage = (src, alt = '', eager = false) => {
    if (!src) return '';
    return eager
      ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="eager" fetchpriority="high" decoding="async" aria-hidden="true">`
      : `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" aria-hidden="true">`;
  };

  app.innerHTML = `
    <div class="intro-modal intro-modal--pdfstyle landing-page-shell">
      ${renderMenuForAbout(t)}
      ${renderSavedDrawer(t)}
      <div class="intro-scroll intro-scroll--pdfstyle">

        <section class="landing-pdf-section landing-pdf-section--1">
          <div class="landing-pdf-grid landing-pdf-grid--two-col landing-pdf-grid--intro-with-badges">
            <div class="landing-map-pane">
              ${pageImage(state.landingMap, '', true)}
            </div>
            <div class="landing-copy-card landing-copy-card--section2">
              <p>${escapeHtml(landing.section2Body)}</p>
            </div>
            ${renderContextStrips(landing)}
          </div>
        </section>

        <section class="landing-pdf-section landing-pdf-section--3">
          <div class="landing-pdf-grid landing-pdf-grid--questions">
            <div class="landing-photo-pane landing-photo-pane--questions">
              ${pageImage(si[2] || '')}
            </div>
            <div class="landing-copy-card landing-copy-card--pondered">
              <p>${escapeHtml(landing.section3Lead)}</p>
            </div>
            ${landing.questions.map((q, i) => `
              <div class="landing-question-card landing-question-card--${i + 1}">
                <p>${escapeHtml(q)}</p>
              </div>`).join('')}
          </div>
        </section>

        <section class="landing-pdf-section landing-pdf-section--4">
          <div class="landing-pdf-grid landing-pdf-grid--shared">
            <div class="landing-photo-pane landing-photo-pane--shared">
              ${pageImage(si[4] || '')}
            </div>
            <div class="landing-copy-card landing-copy-card--section4">
              <p>${renderLineBreakCopy(landing.section4Lines)}</p>
            </div>
          </div>
        </section>

        <section class="landing-pdf-section landing-pdf-section--5">
          <div class="landing-pdf-grid landing-pdf-grid--cta">
            <div class="landing-photo-pane landing-photo-pane--cta">
              ${pageImage(si[5] || '')}
            </div>
            <div class="landing-copy-card landing-copy-card--cta-spacer"></div>
            <div class="landing-copy-card landing-copy-card--section5">
              ${renderExploreCta()}
            </div>
          </div>
        </section>

        <section class="landing-pdf-section landing-pdf-section--2">
          <div class="landing-pdf-grid landing-pdf-grid--hero landing-pdf-grid--photo-only">
            <div class="landing-photo-pane landing-photo-pane--hero">
              ${pageImage(si[3] || '')}
            </div>
          </div>
        </section>

      </div>
    </div>
  `;

}

function attachListeners() {
  document.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    if (target.dataset.action === 'toggle-menu') {
      state.menuOpen = !state.menuOpen;
      renderLandingPage();
      return;
    }
    if (target.dataset.action === 'close-menu') {
      state.menuOpen = false;
      renderLandingPage();
      return;
    }
    if (target.dataset.action === 'open-saved') {
      state.menuOpen  = false;
      state.savedOpen = true;
      renderLandingPage();
      return;
    }
    if (target.dataset.action === 'close-saved') {
      state.savedOpen = false;
      renderLandingPage();
      return;
    }
    if (target.dataset.action === 'remove-saved') {
      state.savedIds = state.savedIds.filter((id) => String(id) !== String(target.dataset.value));
      localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(state.savedIds.map(String)));
      renderLandingPage();
      return;
    }
    if (target.dataset.action === 'set-language') {
      state.language = target.dataset.value === 'so' ? 'so' : 'en';
      state.menuOpen = false;
      await initialiseI18n(state.language);
      renderLandingPage();
      return;
    }
    if (target.dataset.action === 'set-theme') {
      state.theme = target.dataset.value === 'light' ? 'light' : 'dark';
      state.menuOpen = false;
      renderLandingPage();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (state.savedOpen) { state.savedOpen = false; renderLandingPage(); }
      else if (state.menuOpen) { state.menuOpen = false; renderLandingPage(); }
    }
  });
}

async function init() {
  attachListeners();
  renderLoading();
  state.landingSectionImages = pickLandingSectionImages();
  await initialiseI18n(state.language);
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
  if (app) app.innerHTML = '<div class="error-state">Failed to load. Check the browser console and verify Supabase configuration.</div>';
});
