import { getLandingText, getUiText, STORAGE_KEYS, initialiseI18n } from './content.js';
import { fetchStories } from './api.js';

const state = {
  language: localStorage.getItem(STORAGE_KEYS.language) || 'en',
  theme: localStorage.getItem(STORAGE_KEYS.theme) || 'dark',
  stories: [],
  menuOpen: false,
  landingMap: '',
  landingSectionImages: {}
};

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
    ['jpg', 'png'].forEach((ext) => probes.push(`../images/landing/${sectionNumber} (${i}).${ext}`));
  }
  const found = (await Promise.all(probes.map(imageExists))).filter(Boolean);
  const shuffled = found.sort(() => Math.random() - 0.5);
  if (shuffled.length) return shuffled[0];
  const fallback = state.stories[Math.floor(Math.random() * state.stories.length)];
  return fallback?.images?.[0] || '';
}

async function loadLandingAssets() {
  const primaryMap = await imageExists('../images/landing/map 2.png');
  const fallbackMap = await imageExists('../images/landing/sws on somalia map_wrinkle.png');
  state.landingMap = primaryMap || fallbackMap || '';
  const sections = [1, 3, 4, 5];
  const resolved = await Promise.all(sections.map((s) => loadSectionImage(s)));
  state.landingSectionImages = Object.fromEntries(sections.map((s, i) => [s, resolved[i]]));
}

// ── Utility menu (same pattern as /stories) ───────────────────────────────────

const menuIcon  = () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>';
const closeIcon = () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
const homeIcon  = () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10.5V20h11V10.5"/></svg>';
const aboutIcon = () => '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01"/><path d="M11 12h1v4h1"/></svg>';

function renderMenu(t) {
  return `
    <div class="utility-menu-shell">
      ${state.menuOpen
        ? `<button type="button" class="utility-menu-backdrop" data-action="close-menu" aria-label="${escapeHtml(t.close)}"></button>`
        : ''}
      <div class="utility-menu ${state.menuOpen ? 'is-open' : ''}">
        <button type="button" class="utility-menu-toggle" data-action="toggle-menu"
          aria-label="${escapeHtml(t.menu)}" aria-expanded="${state.menuOpen}">
          ${menuIcon()}
        </button>
        <div class="utility-menu-panel" aria-hidden="${!state.menuOpen}">

          <div class="utility-menu-pill utility-menu-pill--single">
            <a class="utility-menu-control utility-menu-control--single" href="../">
              <span class="utility-menu-control-copy">
                <span class="utility-menu-control-icon" aria-hidden="true">${homeIcon()}</span>
                <span>${escapeHtml(t.home)}</span>
              </span>
            </a>
          </div>

          <div class="utility-menu-pill utility-menu-pill--single">
            <a class="utility-menu-control utility-menu-control--single" href="../about/">
              <span class="utility-menu-control-copy">
                <span class="utility-menu-control-icon" aria-hidden="true">${aboutIcon()}</span>
                <span>${escapeHtml(t.about)}</span>
              </span>
            </a>
          </div>

          <div class="utility-menu-group">
            <div class="utility-menu-group-label">${escapeHtml(t.language)}</div>
            <div class="utility-menu-pill utility-menu-switchers" role="group" aria-label="Language selector">
              <button type="button" class="utility-menu-control ${state.language === 'so' ? 'is-active' : ''}" data-action="set-language" data-value="so">${escapeHtml(t.shortSo)}</button>
              <button type="button" class="utility-menu-control ${state.language === 'en' ? 'is-active' : ''}" data-action="set-language" data-value="en">${escapeHtml(t.shortEn)}</button>
            </div>
          </div>

          <div class="utility-menu-group">
            <div class="utility-menu-group-label">${escapeHtml(t.theme)}</div>
            <div class="utility-menu-pill utility-menu-switchers" role="group" aria-label="Theme selector">
              <button type="button" class="utility-menu-control ${state.theme === 'dark' ? 'is-active' : ''}" data-action="set-theme" data-value="dark">${escapeHtml(t.dark)}</button>
              <button type="button" class="utility-menu-control ${state.theme === 'light' ? 'is-active' : ''}" data-action="set-theme" data-value="light">${escapeHtml(t.light)}</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

function renderLandingPage() {
  saveState();
  const app = document.querySelector('#app');
  if (!app) return;

  const landing = getLandingText(state.language);
  const t = getUiText(state.language);
  const si = state.landingSectionImages;

  document.title = `${escapeHtml(t.about)} — ${escapeHtml(t.siteTitle)}`;

  app.innerHTML = `
    <div class="intro-modal intro-modal--pdfstyle landing-page-shell">
      ${renderMenu(t)}
      <div class="intro-scroll intro-scroll--pdfstyle">

        <section class="landing-pdf-section landing-pdf-section--1">
          <div class="landing-pdf-grid landing-pdf-grid--hero">
            <div class="landing-photo-pane landing-photo-pane--hero">
              <img src="${si[1] || ''}" alt="" loading="eager" aria-hidden="true">
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
          <div class="landing-pdf-grid landing-pdf-grid--two-col">
            <div class="landing-map-pane">
              <img src="${state.landingMap}" alt="" loading="eager" aria-hidden="true">
            </div>
            <div class="landing-copy-card landing-copy-card--section2">
              <p>${escapeHtml(landing.section2Body)}</p>
            </div>
          </div>
        </section>

        <section class="landing-pdf-section landing-pdf-section--3">
          <div class="landing-pdf-grid landing-pdf-grid--questions">
            <div class="landing-photo-pane landing-photo-pane--questions">
              <img src="${si[3] || ''}" alt="" loading="eager" aria-hidden="true">
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
              <img src="${si[4] || ''}" alt="" loading="eager" aria-hidden="true">
            </div>
            <div class="landing-copy-card landing-copy-card--section4">
              <p>${renderLineBreakCopy(landing.section4Lines)}</p>
            </div>
          </div>
        </section>

        <section class="landing-pdf-section landing-pdf-section--5">
          <div class="landing-pdf-grid landing-pdf-grid--cta">
            <div class="landing-photo-pane landing-photo-pane--cta">
              <img src="${si[5] || ''}" alt="" loading="eager" aria-hidden="true">
            </div>
            <div class="landing-copy-card landing-copy-card--cta-spacer"></div>
            <div class="landing-copy-card landing-copy-card--section5">
              <p class="landing-cta-copy">${escapeHtml(landing.section5Body)}</p>
              <div class="landing-button-row landing-button-row--pdf">
                <a class="landing-button" href="../stories/?random=1">${escapeHtml(landing.surprise)}</a>
                <a class="landing-button" href="../stories/#gallery">${escapeHtml(landing.explore)}</a>
                <a class="landing-button" href="mailto:?subject=Photostory submission">${escapeHtml(landing.shareOwn)}</a>
              </div>
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
    if (event.key === 'Escape' && state.menuOpen) {
      state.menuOpen = false;
      renderLandingPage();
    }
  });
}

async function init() {
  attachListeners();
  await Promise.all([
    initialiseI18n(state.language),
    fetchStories().then((stories) => { state.stories = stories; })
  ]);
  await loadLandingAssets();
  renderLandingPage();
}

init().catch((error) => {
  console.error(error);
  const app = document.querySelector('#app');
  if (app) app.innerHTML = '<div class="error-state">Failed to load. Check the browser console.</div>';
});
