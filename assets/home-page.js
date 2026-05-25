import { getUiText, getLandingText, STORAGE_KEYS, initialiseI18n } from './content.js';
import { fetchStories } from './api.js';

const state = {
  language: localStorage.getItem(STORAGE_KEYS.language) || 'en',
  theme: localStorage.getItem(STORAGE_KEYS.theme) || 'dark',
  stories: [],
  currentStory: null,
  sectionImage: null   // hero background image, same source as /about section 1
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
  return lines.map((l) => `<span>${escapeHtml(l)}</span>`).join('<br>');
}

function labelFor(entry, language) {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  return entry[language] || entry.en || '';
}

function pickRandom(stories, excludeId = null) {
  const pool = excludeId ? stories.filter((s) => s.id !== excludeId) : stories;
  return pool[Math.floor(Math.random() * pool.length)] || stories[0] || null;
}

async function imageExists(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Tries to load a landing section image (same probe logic as /about).
 * Falls back to the story's own lead image.
 */
async function loadHeroImage() {
  const probes = [];
  const extensions = ['jpg', 'png'];
  for (let i = 1; i <= 6; i++) {
    extensions.forEach((ext) => probes.push(`images/landing/1 (${i}).${ext}`));
  }
  const found = (await Promise.all(probes.map(imageExists))).filter(Boolean);
  if (found.length) {
    state.sectionImage = found[Math.floor(Math.random() * found.length)];
    return;
  }
  // fallback: use the current story's lead image
  state.sectionImage = state.currentStory?.images?.[0] || null;
}

function renderHomePage() {
  saveState();
  const app = document.querySelector('#app');
  if (!app) return;

  const t = getUiText(state.language);
  const landing = getLandingText(state.language);
  const story = state.currentStory;

  document.title = t.siteTitle;

  // Lead image: the story images are relative to /stories/, so from root we
  // need to prefix with 'stories/' to resolve them correctly.
  const leadImg = story
    ? `stories/${story.images?.[0] || ''}`
    : '';

  const storyBlock = story ? `
    <div class="home-story-card">
      <div class="home-story-image-wrap">
        <img class="home-story-image"
          src="${escapeHtml(leadImg)}"
          alt="${escapeHtml(story.storyteller)}"
          loading="eager">
      </div>
      <div class="home-story-body">
        <p class="home-story-name">${escapeHtml(story.storyteller)}</p>
        <p class="home-story-teaser">${escapeHtml(labelFor(story.summary, state.language))}</p>
        <div class="landing-button-row">
          <a class="landing-button" href="stories/?code=${escapeHtml(story.id)}">${escapeHtml(t.readStory)}</a>
          <button type="button" class="landing-button" data-action="another-story">${escapeHtml(t.anotherStory)}</button>
          <a class="landing-button" href="stories/#gallery">${escapeHtml(t.exploreFilters)}</a>
        </div>
      </div>
    </div>
  ` : `<div class="home-story-loading">${escapeHtml(t.loading)}</div>`;

  // Hero panel reuses the exact /about section-1 markup and CSS classes
  app.innerHTML = `
    <div class="intro-modal intro-modal--pdfstyle landing-page-shell home-page-shell">
      <div class="intro-scroll intro-scroll--pdfstyle home-scroll">

        <section class="landing-pdf-section landing-pdf-section--1 home-hero-section">
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
              ${state.sectionImage
                ? `<img src="${escapeHtml(state.sectionImage)}" alt="" loading="eager" aria-hidden="true">`
                : ''}
            </div>

            <div class="landing-copy-card landing-copy-card--nexus">
              <p>${renderLineBreakCopy(landing.section1NexusLines)}</p>
            </div>

            <div class="landing-copy-card landing-copy-card--title">
              <p>${renderLineBreakCopy(landing.section1TitleLines)}</p>
            </div>

          </div>
        </section>

        <section class="home-story-section">
          <div class="home-story-wrap">
            ${storyBlock}
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
      localStorage.setItem(STORAGE_KEYS.language, state.language);
      await initialiseI18n(state.language);
      renderHomePage();
    }
    if (target.dataset.action === 'set-theme') {
      state.theme = target.dataset.value === 'light' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEYS.theme, state.theme);
      renderHomePage();
    }
    if (target.dataset.action === 'another-story') {
      state.currentStory = pickRandom(state.stories, state.currentStory?.id);
      renderHomePage();
    }
  });
}

async function init() {
  attachListeners();

  await Promise.all([
    initialiseI18n(state.language),
    fetchStories().then((stories) => {
      state.stories = stories;
      state.currentStory = pickRandom(stories);
    })
  ]);

  // Load hero image in parallel with first render so page isn't blank
  renderHomePage();
  await loadHeroImage();
  renderHomePage();
}

init().catch((error) => {
  console.error(error);
  const app = document.querySelector('#app');
  if (app) app.innerHTML = '<div class="error-state">Failed to load.</div>';
});
