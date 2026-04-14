import {
  actorLabel,
  getGuidanceText,
  getUiText,
  labelFor
} from './content.js';
import {
  allDistricts,
  allPeople,
  allPrimaryThemes,
  allSecondaryThemes,
  countForFilters,
  currentStory,
  filteredStories,
  hasActiveFilters,
  isSaved,
  storyCountLabel
} from './story-data.js';
import { createEmptyFilters } from './state.js';

export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const icon = {
  chevronLeft: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>',
  chevronRight: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  bookmark: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v16l-6-4-6 4z"/></svg>',
  share: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.7 15.4 6.3M8.6 13.3l6.8 4.4"/></svg>',
  shuffle: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3h5v5"/><path d="M4 20 20 4"/><path d="M21 16v5h-5"/><path d="M15 15 21 21"/><path d="M4 4l5 5"/></svg>',
  related: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 13.5 7 17a3 3 0 0 1-4.24-4.24l3.54-3.54A3 3 0 0 1 10.5 9"/><path d="M13.5 10.5 17 7a3 3 0 0 1 4.24 4.24L17.7 14.8A3 3 0 0 1 13.5 15"/><path d="m8.5 15.5 7-7"/></svg>',
  sliders: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/></svg>',
  copy: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><rect x="4" y="4" width="11" height="11" rx="2"/></svg>',
  facebook: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.6 1.7-1.6H16.7V3.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V10H8v3h2.5v8h3z"/></svg>',
  instagram: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" ry="5" fill="none"/><circle cx="12" cy="12" r="4" fill="none"/><circle cx="17.5" cy="6.5" r="1.1"/></svg>',
  x: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 3H21l-4.6 5.3L22 21h-4.7l-3.7-4.9L9.4 21H7.3l4.9-5.6L2 3h4.8l3.4 4.6L18.9 3zm-1.6 16h1.3L6.1 4.9H4.7L17.3 19z"/></svg>',
  email: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
  close: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  menu: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>'
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function adaptiveImageMarkup(src, alt, mode = 'contain', extraClass = '') {
  return `
    <div class="adaptive-image ${mode === 'cover' ? 'is-cover' : 'is-contain'} ${extraClass}">
      <img class="adaptive-image-bg" src="${src}" alt="" aria-hidden="true">
      <div class="adaptive-image-overlay"></div>
      <img class="adaptive-image-fg" src="${src}" alt="${escapeHtml(alt)}" loading="lazy">
    </div>
  `;
}

function renderChip(label, options = {}) {
  const classes = ['chip'];
  if (options.muted) classes.push('chip-muted');
  if (options.active) classes.push('chip-active');
  const countMarkup = typeof options.count === 'number' ? `<span class="chip-count">${options.count}</span>` : '';
  const content = `<span>${escapeHtml(label)}</span>${countMarkup}`;

  if (!options.onClick) {
    return `<span class="${classes.join(' ')}">${content}</span>`;
  }

  return `<button type="button" class="${classes.join(' ')}" data-action="${options.onClick.action}" data-value="${escapeHtml(options.onClick.value)}">${content}</button>`;
}

function renderParagraphBlock(text, className = '') {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`)
    .join('') || `<p class="${className}"></p>`;
}
function storyTagChips(state, story) {
  const chips = [
    renderChip(labelFor(story.district, state.language)),
    renderChip(labelFor(story.cluster, state.language), { muted: true }),
    renderChip(labelFor(story.primaryTheme, state.language))
  ];

  story.secondaryThemes.forEach((theme) => chips.push(renderChip(labelFor(theme, state.language), { muted: true })));
  story.actors.forEach((person) => chips.push(renderChip(actorLabel(person, state.language), { muted: true })));
  return chips.join('');
}

function renderUtilityMenu(state) {
  const t = getUiText(state.language);

  return `
    <div class="utility-menu-shell">
      ${state.menuOpen ? `<button type="button" class="utility-menu-backdrop" data-action="close-menu" aria-label="${escapeHtml(t.close)}"></button>` : ''}
      <div class="utility-menu ${state.menuOpen ? 'is-open' : ''}">
        <button
          type="button"
          class="utility-menu-toggle"
          data-action="toggle-menu"
          aria-label="${escapeHtml(t.menu)}"
          aria-expanded="${state.menuOpen ? 'true' : 'false'}">
          ${icon.menu()}
        </button>
        <div class="utility-menu-panel" aria-hidden="${state.menuOpen ? 'false' : 'true'}">
          <a class="utility-menu-link" href="../">${escapeHtml(t.home)}</a>
          <button type="button" class="utility-menu-button" data-action="open-saved" aria-label="${escapeHtml(t.openSaved)}">
            <span>${escapeHtml(t.savedPhotostories)}</span>
            <span class="utility-menu-badge">${state.savedIds.length}</span>
          </button>
          <div class="utility-menu-group">
            <div class="utility-menu-group-label">${escapeHtml(t.language)}</div>
            <div class="utility-menu-switchers" role="group" aria-label="Language selector">
              <button type="button" class="utility-menu-option ${state.language === 'so' ? 'is-active' : ''}" data-action="set-language" data-value="so">${escapeHtml(t.shortSo)}</button>
              <button type="button" class="utility-menu-option ${state.language === 'en' ? 'is-active' : ''}" data-action="set-language" data-value="en">${escapeHtml(t.shortEn)}</button>
            </div>
          </div>
          <div class="utility-menu-group">
            <div class="utility-menu-group-label">${escapeHtml(t.theme)}</div>
            <div class="utility-menu-switchers" role="group" aria-label="Theme selector">
              <button type="button" class="utility-menu-option ${state.theme === 'dark' ? 'is-active' : ''}" data-action="set-theme" data-value="dark">${escapeHtml(t.dark)}</button>
              <button type="button" class="utility-menu-option ${state.theme === 'light' ? 'is-active' : ''}" data-action="set-theme" data-value="light">${escapeHtml(t.light)}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderStageControls(state, story) {
  const t = getUiText(state.language);
  const dots = story.images.map((_, index) => `
    <button
      type="button"
      class="stage-dot ${index === state.currentImageIndex ? 'is-active' : ''}"
      data-action="go-image"
      data-value="${index}"
      aria-label="${escapeHtml(t.imageLabel)} ${index + 1}">
    </button>
  `).join('');

  return `
    <div class="story-stage-controls-strip">
      <button type="button" class="control-button" data-action="prev-image" aria-label="${escapeHtml(t.previousImage)}">${icon.chevronLeft()}</button>
      <div class="stage-dots">${dots}</div>
      <button type="button" class="control-button" data-action="next-image" aria-label="${escapeHtml(t.nextImage)}">${icon.chevronRight()}</button>
    </div>
  `;
}

function renderStoryMetaPanel(state, story) {
  const t = getUiText(state.language);

  return `
    <aside class="story-meta-panel">
      <p class="story-meta-summary">${escapeHtml(labelFor(story.summary, state.language))}</p>
      <div class="tag-row story-meta-tags">${storyTagChips(state, story)}</div>
      <div class="story-meta-credit">
        <span class="story-meta-credit-label">${escapeHtml(t.photographerStoryteller)}</span>
        <span class="story-meta-credit-name">${escapeHtml(story.storyteller)}</span>
      </div>
    </aside>
  `;
}

function renderSavedDrawer(state) {
  const t = getUiText(state.language);
  const savedStories = state.stories.filter((story) => isSaved(state, story.id));

  return `
    <aside class="saved-drawer ${state.savedOpen ? 'is-open' : ''}" aria-hidden="${state.savedOpen ? 'false' : 'true'}">
      <div class="drawer-header">
        <div>
          <div class="drawer-title">${escapeHtml(t.savedPhotostories)}</div>
          <div class="drawer-subtitle">${savedStories.length} ${escapeHtml(savedStories.length === 1 ? t.story : t.stories)}</div>
        </div>
        <button type="button" class="icon-button" data-action="close-saved" aria-label="${escapeHtml(t.close)}">${icon.close()}</button>
      </div>
      <div class="drawer-body">
        ${savedStories.length === 0 ? `<div class="drawer-empty">${escapeHtml(t.noSaved)}</div>` : savedStories.map((story) => `
          <button type="button" class="saved-item" data-action="open-saved-story" data-value="${story.id}">
            <div class="saved-thumb">${adaptiveImageMarkup(story.images[0], story.storyteller, 'cover')}</div>
            <div class="saved-copy">
              <div class="saved-name">${escapeHtml(story.storyteller)}</div>
              <div class="saved-summary">${escapeHtml(labelFor(story.summary, state.language))}</div>
              <div class="saved-tags">
                ${renderChip(labelFor(story.district, state.language), { muted: true })}
                ${renderChip(labelFor(story.primaryTheme, state.language))}
              </div>
            </div>
          </button>
        `).join('')}
      </div>
    </aside>
  `;
}

function renderShareModal(state, story) {
  const t = getUiText(state.language);

  return `
    <div class="modal-backdrop ${state.shareOpen ? 'is-open' : ''}" data-action="close-share"></div>
    <div class="share-modal ${state.shareOpen ? 'is-open' : ''}" aria-hidden="${state.shareOpen ? 'false' : 'true'}">
      <div class="share-header">
        <div class="share-title">${escapeHtml(t.shareThisStory)}</div>
        <button type="button" class="icon-button" data-action="close-share" aria-label="${escapeHtml(t.close)}">${icon.close()}</button>
      </div>
      <div class="share-grid">
        <button type="button" class="share-option" data-action="share-copy">${icon.copy()}<span>${escapeHtml(t.copyLink)}</span></button>
        <button type="button" class="share-option" data-action="share-facebook">${icon.facebook()}<span>${escapeHtml(t.facebook)}</span></button>
        <button type="button" class="share-option" data-action="share-instagram">${icon.instagram()}<span>${escapeHtml(t.instagram)}</span></button>
        <button type="button" class="share-option" data-action="share-x">${icon.x()}<span>${escapeHtml(t.x)}</span></button>
        <button type="button" class="share-option" data-action="share-email">${icon.email()}<span>${escapeHtml(t.email)}</span></button>
      </div>
    </div>
  `;
}

function renderGuidanceBox(state) {
  const guidance = getGuidanceText(state.language);
  return `
    <div class="story-guidance-box is-compact">
      <p>${escapeHtml(guidance.intro)}</p>
      <ul>
        ${guidance.questions.map((question) => `<li>${escapeHtml(question)}</li>`).join('')}
      </ul>
    </div>
  `;
}

function renderFilterGroup(state, title, allLabel, items, currentValue, action, isMulti = false) {
  const allCountFilters = createEmptyFilters();
  allCountFilters.district = state.filters.district;
  allCountFilters.primaryTheme = state.filters.primaryTheme;
  allCountFilters.secondaryThemes = [...state.filters.secondaryThemes];
  allCountFilters.people = [...state.filters.people];

  if (action === 'filter-district') allCountFilters.district = '';
  if (action === 'filter-primary') allCountFilters.primaryTheme = '';
  if (action === 'filter-secondary') allCountFilters.secondaryThemes = [];
  if (action === 'filter-people') allCountFilters.people = [];

  return `
    <section class="filter-group">
      <h3>${escapeHtml(title)}</h3>
      <div class="chip-list">
        ${renderChip(allLabel, {
          active: isMulti ? currentValue.length === 0 : !currentValue,
          muted: true,
          count: countForFilters(state, allCountFilters),
          onClick: { action: `${action}-all`, value: '' }
        })}
        ${items.map((item) => {
          const value = item.value;
          const active = isMulti ? currentValue.includes(value) : currentValue === value;
          const nextFilters = {
            district: state.filters.district,
            primaryTheme: state.filters.primaryTheme,
            secondaryThemes: [...state.filters.secondaryThemes],
            people: [...state.filters.people]
          };

          if (action === 'filter-district') nextFilters.district = value;
          if (action === 'filter-primary') nextFilters.primaryTheme = value;
          if (action === 'filter-secondary' && !nextFilters.secondaryThemes.includes(value)) nextFilters.secondaryThemes.push(value);
          if (action === 'filter-people' && !nextFilters.people.includes(value)) nextFilters.people.push(value);

          return renderChip(item.label, {
            active,
            muted: !active,
            count: countForFilters(state, nextFilters),
            onClick: { action, value }
          });
        }).join('')}
      </div>
    </section>
  `;
}

function storyGalleryHeader(state) {
  const count = filteredStories(state).length;
  const t = getUiText(state.language);
  if (state.galleryMode === 'related') return storyCountLabel(count, t.relatedStory, t.relatedStories);
  if (state.galleryMode === 'filtered') return storyCountLabel(count, t.filteredStory, t.filteredStories);
  return storyCountLabel(count, t.totalStory, t.totalStories);
}

export function syncGalleryCardHeights() {
  const cards = qsa('.gallery-card');
  cards.forEach((card) => {
    card.style.height = 'auto';
  });

  if (cards.length <= 1 || window.innerWidth < 760) return;

  const maxHeight = Math.max(...cards.map((card) => Math.ceil(card.getBoundingClientRect().height)));
  cards.forEach((card) => {
    card.style.height = `${maxHeight}px`;
  });
}

export function renderApp(state) {
  const app = qs('#app');
  const story = currentStory(state);
  if (!app || !story) return;

  const t = getUiText(state.language);
  const galleryStories = filteredStories(state);
  const districtItems = allDistricts(state).map((district) => ({ value: district.slug, label: labelFor(district, state.language) }));
  const primaryItems = allPrimaryThemes(state).map((theme) => ({ value: theme.slug, label: labelFor(theme, state.language) }));
  const secondaryItems = allSecondaryThemes(state).map((theme) => ({ value: theme.slug, label: labelFor(theme, state.language) }));
  const peopleItems = allPeople(state).map((person) => ({ value: person, label: actorLabel(person, state.language) }));

  document.title = t.siteTitle;

  const storySlides = story.images.map((src, index) => `
    <div class="story-slide ${index === state.currentImageIndex ? 'is-active' : ''}">
      ${adaptiveImageMarkup(src, story.storyteller, 'contain', 'story-stage-image')}
    </div>
  `).join('');

  const storyMarkup = state.storyVisible ? `
    <section id="story-top" class="story-stage-shell">
      <div class="content-wrap story-hero-wrap">
        <div class="story-hero-layout">
          <div class="story-hero-media">
            <div class="story-stage">
              <div class="story-slides">${storySlides}</div>
            </div>
            ${renderStageControls(state, story)}
          </div>
          ${renderStoryMetaPanel(state, story)}
        </div>
      </div>
    </section>

    <section class="story-band">
      <div class="content-wrap narrow">
        ${renderGuidanceBox(state)}
        <div class="story-copy">${renderParagraphBlock(labelFor(story.story, state.language))}</div>
      </div>
    </section>

    <section class="reflection-band">
      <div class="content-wrap narrow">
        <div class="section-kicker">${escapeHtml(t.communityReflections)}</div>
        <div class="reflection-copy">${renderParagraphBlock(labelFor(story.reflection, state.language))}</div>
      </div>
    </section>

    <section class="actions-band">
      <div class="content-wrap">
        <div class="actions-row">
          <button type="button" class="action-button ${isSaved(state, story.id) ? 'is-saved' : ''}" data-action="toggle-save">${icon.bookmark()}<span>${escapeHtml(isSaved(state, story.id) ? t.saved : t.save)}</span></button>
          <button type="button" class="action-button" data-action="open-share">${icon.share()}<span>${escapeHtml(t.share)}</span></button>
          <button type="button" class="action-button" data-action="random-related">${icon.shuffle()}<span>${escapeHtml(t.relatedRandom)}</span></button>
          <button type="button" class="action-button" data-action="show-related">${icon.related()}<span>${escapeHtml(t.related)}</span></button>
          <button type="button" class="action-button" data-action="explore-all">${icon.sliders()}<span>${escapeHtml(t.explore)}</span></button>
        </div>
        ${state.actionMessage ? `<div class="action-message">${escapeHtml(state.actionMessage)}</div>` : ''}
      </div>
    </section>
  ` : '';

  const galleryMarkup = state.galleryVisible ? `
    <section id="gallery" class="gallery-band gallery-band--entry">
      <div class="content-wrap">
        <div class="gallery-header">${escapeHtml(storyGalleryHeader(state))}</div>
        <div class="gallery-layout">
          <aside class="filter-panel">
            <div class="filter-reset-slot">
              <button type="button" class="filter-reset ${hasActiveFilters(state.filters) ? 'is-visible' : ''}" data-action="reset-filters">${escapeHtml(t.reset)}</button>
            </div>
            ${renderFilterGroup(state, t.district, t.all, districtItems, state.filters.district, 'filter-district')}
            ${renderFilterGroup(state, t.primaryTheme, t.all, primaryItems, state.filters.primaryTheme, 'filter-primary')}
            ${renderFilterGroup(state, t.secondaryThemes, t.all, secondaryItems, state.filters.secondaryThemes, 'filter-secondary', true)}
            ${renderFilterGroup(state, t.people, t.all, peopleItems, state.filters.people, 'filter-people', true)}
          </aside>
          <div class="gallery-grid">
            ${galleryStories.map((item) => `
              <button type="button" class="gallery-card" data-action="open-story" data-value="${item.id}">
                <div class="gallery-image-frame">
                  <img class="gallery-image-cover" src="${item.images[0]}" alt="${escapeHtml(item.storyteller)}" loading="lazy">
                </div>
                <div class="gallery-card-body">
                  <p class="gallery-summary">${escapeHtml(labelFor(item.summary, state.language))}</p>
                  <div class="tag-row small">
                    ${renderChip(labelFor(item.district, state.language), { muted: true })}
                    ${renderChip(labelFor(item.cluster, state.language), { muted: true })}
                    ${renderChip(labelFor(item.primaryTheme, state.language))}
                    ${item.secondaryThemes.map((theme) => renderChip(labelFor(theme, state.language), { muted: true })).join('')}
                    ${item.actors.map((person) => renderChip(actorLabel(person, state.language), { muted: true })).join('')}
                  </div>
                  ${isSaved(state, item.id) ? `<div class="saved-marker">${icon.bookmark()}<span>${escapeHtml(t.saved)}</span></div>` : ''}
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    </section>
  ` : '';

  app.innerHTML = `
    <div class="site-shell ${!state.storyVisible ? 'is-gallery-only' : ''}">
      ${renderUtilityMenu(state)}
      <main>
        ${storyMarkup}
        ${galleryMarkup}
      </main>
      ${renderSavedDrawer(state)}
      ${renderShareModal(state, story)}
    </div>
  `;
}
