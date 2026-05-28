import { getLandingText, getUiText, STORAGE_KEYS, initialiseI18n } from './content.js';
import { ensureStoryImages, fetchStories } from './api.js';
import { renderMenu } from './menu.js';

const state = {
  language:   localStorage.getItem(STORAGE_KEYS.language) || 'en',
  theme:      localStorage.getItem(STORAGE_KEYS.theme)    || 'dark',
  stories:    [],
  menuOpen:   false,
  savedOpen:  false,
  savedIds:   [],
  landingMap: '',
  landingSectionImages: {},
  siteStats: { stories: 0, photos: null, reflections: 0 }
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

function countReflections(stories = []) {
  return stories.reduce((total, story) => total + Number(story.reflectionCount || (story.reflection?.en || story.reflection?.so ? 1 : 0)), 0);
}

function formatStat(value) {
  return value == null ? '…' : String(value);
}

function renderCountedCopy(template = '') {
  return escapeHtml(template)
    .replaceAll('{stories}', formatStat(state.siteStats.stories))
    .replaceAll('{photos}', formatStat(state.siteStats.photos))
    .replaceAll('{reflections}', formatStat(state.siteStats.reflections));
}

function realImageCount(story) {
  return (story.images || []).filter((src) => src && !String(src).startsWith('data:image/svg+xml')).length;
}

async function refreshPhotoCount() {
  const batchSize = 8;
  let photos = 0;
  for (let i = 0; i < state.stories.length; i += batchSize) {
    const batch = state.stories.slice(i, i + batchSize);
    await Promise.all(batch.map((story) => ensureStoryImages(story)));
    photos += batch.reduce((sum, story) => sum + realImageCount(story), 0);
  }
  state.siteStats.photos = photos;
  renderLandingPage();
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
  for (let i = 1; i <= 6; i++) {
    ['jpg', 'png'].forEach((ext) => probes.push(`images/${sectionNumber} (${i}).${ext}`));
  }
  const found = (await Promise.all(probes.map(imageExists))).filter(Boolean);
  const shuffled = found.sort(() => Math.random() - 0.5);
  if (shuffled.length) return shuffled[0];
  const fallback = state.stories[Math.floor(Math.random() * state.stories.length)];
  return fallback?.images?.[0] || '';
}

async function loadLandingAssets() {
  const primaryMap = await imageExists('images/map 2.png');
  const fallbackMap = await imageExists('images/sws on somalia map_wrinkle.png');
  state.landingMap = primaryMap || fallbackMap || '';
  const sections = [1, 3, 4, 5];
  const resolved = await Promise.all(sections.map((s) => loadSectionImage(s)));
  state.landingSectionImages = Object.fromEntries(sections.map((s, i) => [s, resolved[i]]));
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const closeIcon = () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

// ── Saved drawer ──────────────────────────────────────────────────────────────
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
    basePaths: { home: '../', about: './', stories: '../stories/' },
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

  const landing = getLandingText(state.language);
  const t = getUiText(state.language);
  const si = state.landingSectionImages;

  document.title = `${t.about} — ${t.siteTitle}`;

  // Images after section 1 use loading="lazy" + data-src for intersection
  // observer deferred loading (avoids blocking on many images at once)
  const lazyImg = (src, alt = '', eager = false) =>
    eager
      ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="eager" aria-hidden="true">`
      : `<img data-src="${escapeHtml(src)}" src="" alt="${escapeHtml(alt)}" loading="lazy" class="lazy-img" aria-hidden="true">`;

  app.innerHTML = `
    <div class="intro-modal intro-modal--pdfstyle landing-page-shell">
      ${renderMenuForAbout(t)}
      ${renderSavedDrawer(t)}
      <div class="intro-scroll intro-scroll--pdfstyle">

        <section class="landing-pdf-section landing-pdf-section--1">
          <div class="landing-pdf-grid landing-pdf-grid--two-col landing-pdf-grid--intro-with-badges">
            <div class="landing-map-pane">
              ${lazyImg(state.landingMap, '', true)}
            </div>
            <div class="landing-copy-card landing-copy-card--section2">
              <p>${escapeHtml(landing.section2Body)}</p>
            </div>
            <div class="landing-copy-card landing-copy-card--nexus">
              <p>${renderLineBreakCopy(landing.section1NexusLines)}</p>
            </div>
            <div class="landing-copy-card landing-copy-card--title">
              <p>${renderLineBreakCopy(landing.section1TitleLines)}</p>
            </div>
          </div>
        </section>

        <section class="landing-pdf-section landing-pdf-section--2">
          <div class="landing-pdf-grid landing-pdf-grid--hero landing-pdf-grid--photo-only">
            <div class="landing-photo-pane landing-photo-pane--hero">
              ${lazyImg(si[1] || '')}
            </div>
          </div>
        </section>

        <section class="landing-pdf-section landing-pdf-section--3">
          <div class="landing-pdf-grid landing-pdf-grid--questions">
            <div class="landing-photo-pane landing-photo-pane--questions">
              ${lazyImg(si[3] || '')}
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
              ${lazyImg(si[4] || '')}
            </div>
            <div class="landing-copy-card landing-copy-card--section4">
              <p>${renderLineBreakCopy(landing.section4Lines)}</p>
            </div>
          </div>
        </section>

        <section class="landing-pdf-section landing-pdf-section--5">
          <div class="landing-pdf-grid landing-pdf-grid--cta">
            <div class="landing-photo-pane landing-photo-pane--cta">
              ${lazyImg(si[5] || '')}
            </div>
            <div class="landing-copy-card landing-copy-card--cta-spacer"></div>
            <div class="landing-copy-card landing-copy-card--section5">
              <p class="landing-cta-copy">${renderCountedCopy(landing.section5Body)}</p>
              <div class="landing-button-row landing-button-row--pdf">
                <a class="landing-button" href="${randomStoryLink('../stories/')}">${escapeHtml(landing.surprise)}</a>
                <a class="landing-button" href="../stories/#gallery">${escapeHtml(landing.explore)}</a>
                <a class="landing-button" href="mailto:?subject=Photostory submission">${escapeHtml(landing.shareOwn)}</a>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  `;

  // Intersection observer: swap data-src → src as sections scroll into view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      }
      observer.unobserve(img);
    });
  }, { rootMargin: '200px' });

  document.querySelectorAll('.lazy-img').forEach((img) => observer.observe(img));
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
  await Promise.all([
    initialiseI18n(state.language),
    fetchStories().then((stories) => {
      state.stories = stories;
      state.siteStats = {
        stories: stories.length,
        photos: null,
        reflections: countReflections(stories)
      };
    })
  ]);
  await loadLandingAssets();
  renderLandingPage();
  refreshPhotoCount().catch((error) => console.warn('Could not count photos', error));
}

init().catch((error) => {
  console.error(error);
  const app = document.querySelector('#app');
  if (app) app.innerHTML = '<div class="error-state">Failed to load. Check the browser console and verify Supabase configuration.</div>';
});
