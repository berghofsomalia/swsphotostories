import { getUiText, getLandingText, STORAGE_KEYS, initialiseI18n } from './content.js';
import { fetchStories } from './api.js';

const state = {
  language: localStorage.getItem(STORAGE_KEYS.language) || 'en',
  theme: localStorage.getItem(STORAGE_KEYS.theme) || 'dark',
  stories: [],
  currentStory: null
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

function labelFor(entry, language) {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  return entry[language] || entry.en || '';
}

function pickRandom(stories, exclude = null) {
  const pool = exclude ? stories.filter((s) => s.id !== exclude) : stories;
  return pool[Math.floor(Math.random() * pool.length)] || stories[0] || null;
}

function renderHomePage() {
  saveState();
  const app = document.querySelector('#app');
  if (!app) return;

  const t = getUiText(state.language);
  const landing = getLandingText(state.language);
  const story = state.currentStory;

  document.title = t.siteTitle;

  const nexusLines = (landing.section1NexusLines || [])
    .map((l) => `<span>${escapeHtml(l)}</span>`)
    .join('<br>');

  const titleLines = (landing.section1TitleLines || [])
    .map((l) => `<span>${escapeHtml(l)}</span>`)
    .join('<br>');

  const storyMarkup = story ? `
    <div class="home-story-card">
      <div class="home-story-image-wrap">
        <img
          class="home-story-image"
          src="${escapeHtml(story.images?.[0] || '')}"
          alt="${escapeHtml(story.storyteller)}"
          loading="eager"
        >
      </div>
      <div class="home-story-body">
        <p class="home-story-name">${escapeHtml(story.storyteller)}</p>
        <p class="home-story-teaser">${escapeHtml(labelFor(story.summary, state.language))}</p>
        <div class="home-story-actions">
          <a class="home-cta-button home-cta-button--primary" href="stories/?code=${escapeHtml(story.id)}">
            ${escapeHtml(t.readStory)}
          </a>
          <button type="button" class="home-cta-button home-cta-button--secondary" data-action="another-story">
            ${escapeHtml(t.anotherStory)}
          </button>
          <a class="home-cta-button home-cta-button--ghost" href="stories/#gallery">
            ${escapeHtml(t.exploreFilters)}
          </a>
        </div>
      </div>
    </div>
  ` : `<div class="home-story-loading">${escapeHtml(t.loading)}</div>`;

  app.innerHTML = `
    <div class="home-shell" data-theme="${state.theme}">

      <header class="home-header">
        <div class="home-header-brand">
          <p class="home-nexus-lines">${nexusLines}</p>
        </div>
        <nav class="home-header-nav">
          <a class="home-nav-link" href="about/">${escapeHtml(t.about)}</a>
          <div class="home-switchers">
            <div class="home-switcher-group" role="group" aria-label="Language">
              <button type="button" class="${state.language === 'so' ? 'is-active' : ''}" data-action="set-language" data-value="so">${escapeHtml(t.shortSo)}</button>
              <button type="button" class="${state.language === 'en' ? 'is-active' : ''}" data-action="set-language" data-value="en">${escapeHtml(t.shortEn)}</button>
            </div>
            <div class="home-switcher-group" role="group" aria-label="Theme">
              <button type="button" class="${state.theme === 'dark' ? 'is-active' : ''}" data-action="set-theme" data-value="dark">${escapeHtml(t.dark)}</button>
              <button type="button" class="${state.theme === 'light' ? 'is-active' : ''}" data-action="set-theme" data-value="light">${escapeHtml(t.light)}</button>
            </div>
          </div>
        </nav>
      </header>

      <main class="home-main">
        <div class="home-visual-title">
          <p>${titleLines}</p>
        </div>
        ${storyMarkup}
      </main>

      <div class="home-circle home-circle--tl" aria-hidden="true"></div>
      <div class="home-circle home-circle--br" aria-hidden="true"></div>
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

  renderHomePage();
}

init().catch((error) => {
  console.error(error);
  const app = document.querySelector('#app');
  if (app) app.innerHTML = '<div class="error-state">Failed to load.</div>';
});
