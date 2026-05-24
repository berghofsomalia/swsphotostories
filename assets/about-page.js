import { getLandingText, getUiText, STORAGE_KEYS, initialiseI18n } from './content.js';
import { fetchStories } from './api.js';

const state = {
  language: localStorage.getItem(STORAGE_KEYS.language) || 'en',
  theme: localStorage.getItem(STORAGE_KEYS.theme) || 'dark',
  stories: [],
  landingMap: 'images/landing/map 2.png',
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
  const extensions = ['jpg', 'png'];
  for (let index = 1; index <= 6; index += 1) {
    extensions.forEach((ext) => probes.push(`../images/landing/${sectionNumber} (${index}).${ext}`));
  }
  const existing = (await Promise.all(probes.map((src) => imageExists(src)))).filter(Boolean);
  const shuffled = existing.sort(() => Math.random() - 0.5);
  if (shuffled.length > 0) return shuffled[0];
  const fallbackStory = state.stories[Math.floor(Math.random() * state.stories.length)];
  return fallbackStory?.images?.[0] || '';
}

async function loadLandingAssets() {
  const primaryMap = await imageExists('../images/landing/map 2.png');
  const fallbackMap = await imageExists('../images/landing/sws on somalia map_wrinkle.png');
  state.landingMap = primaryMap || fallbackMap || '../assets/sws-map-wrinkle.png';
  const sections = [1, 3, 4, 5];
  const resolved = await Promise.all(sections.map((s) => loadSectionImage(s)));
  state.landingSectionImages = Object.fromEntries(sections.map((s, i) => [s, resolved[i]]));
}

function renderLandingPage() {
  saveState();
  const app = document.querySelector('#app');
  if (!app) return;

  const landing = getLandingText(state.language);
  const t = getUiText(state.language);
  const si = state.landingSectionImages;

  document.title = `About — ${t.siteTitle}`;

  app.innerHTML = `
    <div class="intro-modal intro-modal--pdfstyle landing-page-shell">
      <div class="intro-scroll intro-scroll--pdfstyle">
        <section class="landing-pdf-section landing-pdf-section--1">
          <div class="landing-pdf-grid landing-pdf-grid--hero">
            <div class="landing-switch-row landing-switch-row--top">
              <div class="landing-switch-stack">
                <div class="landing-switcher" role="group" aria-label="Language selector">
                  <button type="button" class="${state.language === 'so' ? 'is-active' : ''}" data-action="set-language" data-value="so">SO</button>
                  <button type="button" class="${state.language === 'en' ? 'is-active' : ''}" data-action="set-language" data-value="en">EN</button>
                </div>
                <div class="landing-switcher" role="group" aria-label="Theme selector">
                  <button type="button" class="${state.theme === 'dark' ? 'is-active' : ''}" data-action="set-theme" data-value="dark">${escapeHtml(t.dark)}</button>
                  <button type="button" class="${state.theme === 'light' ? 'is-active' : ''}" data-action="set-theme" data-value="light">${escapeHtml(t.light)}</button>
                </div>
              </div>
            </div>
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
            ${landing.questions.map((q, i) => `<div class="landing-question-card landing-question-card--${i + 1}"><p>${escapeHtml(q)}</p></div>`).join('')}
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
    if (target.dataset.action === 'set-language') {
      state.language = target.dataset.value === 'so' ? 'so' : 'en';
      await initialiseI18n(state.language);
      renderLandingPage();
    }
    if (target.dataset.action === 'set-theme') {
      state.theme = target.dataset.value === 'light' ? 'light' : 'dark';
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
