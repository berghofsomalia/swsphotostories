import {
  getGuidanceText,
  getLandingText,
  getUiText,
  labelFor
} from './content.js';
import { renderMenu } from './menu.js';
import {
  allDistricts,
  allPeople,
  allTagClusters,
  countForFilters,
  currentStory,
  filteredStories,
  hasActiveFilters,
  hasMoreStories,
  isSaved,
  pagedStories,
  storyCountLabel
} from './story-data.js';

export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function syncGalleryCardHeights() {}

const icon = {
  chevronLeft:  () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>',
  chevronRight: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  bookmark:     () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v16l-6-4-6 4z"/></svg>',
  share:        () => '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.7 15.4 6.3M8.6 13.3l6.8 4.4"/></svg>',
  shuffle:      () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3h5v5"/><path d="M4 20 20 4"/><path d="M21 16v5h-5"/><path d="M15 15 21 21"/><path d="M4 4l5 5"/></svg>',
  related:      () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 13.5 7 17a3 3 0 0 1-4.24-4.24l3.54-3.54A3 3 0 0 1 10.5 9"/><path d="M13.5 10.5 17 7a3 3 0 0 1 4.24 4.24L17.7 14.8A3 3 0 0 1 13.5 15"/><path d="m8.5 15.5 7-7"/></svg>',
  flow:         () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h7a4 4 0 0 1 4 4v6"/><path d="M8 3 4 7l4 4"/><path d="M20 17h-5"/><path d="m17 14 3 3-3 3"/></svg>',
  sliders:      () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/></svg>',
  copy:         () => '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><rect x="4" y="4" width="11" height="11" rx="2"/></svg>',
  facebook:     () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.6 1.7-1.6H16.7V3.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V10H8v3h2.5v8h3z"/></svg>',
  instagram:    () => '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" ry="5" fill="none"/><circle cx="12" cy="12" r="4" fill="none"/><circle cx="17.5" cy="6.5" r="1.1"/></svg>',
  x:            () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 3H21l-4.6 5.3L22 21h-4.7l-3.7-4.9L9.4 21H7.3l4.9-5.6L2 3h4.8l3.4 4.6L18.9 3zm-1.6 16h1.3L6.1 4.9H4.7L17.3 19z"/></svg>',
  email:        () => '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
  close:        () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  search:       () => '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>'
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
  const safeSrc = escapeHtml(src || '');
  return `
    <div class="adaptive-image ${mode === 'cover' ? 'is-cover' : 'is-contain'} ${extraClass}">
      <img class="adaptive-image-bg" src="${safeSrc}" alt="" aria-hidden="true">
      <div class="adaptive-image-overlay"></div>
      <img class="adaptive-image-fg" src="${safeSrc}" alt="${escapeHtml(alt)}" loading="lazy">
    </div>
  `;
}

function renderChip(label, options = {}) {
  const classes = ['chip'];
  if (options.muted) classes.push('chip-muted');
  if (options.active) classes.push('chip-active');
  const countMarkup = typeof options.count === 'number'
    ? `<span class="chip-count">${options.count}</span>`
    : '';
  const content = `<span>${escapeHtml(label)}</span>${countMarkup}`;

  if (!options.onClick) return `<span class="${classes.join(' ')}">${content}</span>`;
  return `<button type="button" class="${classes.join(' ')}" data-action="${escapeHtml(options.onClick.action)}" data-value="${escapeHtml(options.onClick.value)}">${content}</button>`;
}

function renderParagraphBlock(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replaceAll('\n', '<br>')}</p>`)
    .join('') || '<p></p>';
}

function tagChips(state, story) {
  const chips = [renderChip(labelFor(story.district, state.language))];
  (story.tags || []).forEach((tag) => chips.push(renderChip(labelFor(tag, state.language), { muted: tag.clusterSlug === 'people' })));
  return chips.join('');
}

function renderUtilityMenu(state) {
  const t = getUiText(state.language);
  return renderMenu(state, {
    esc: escapeHtml,
    t,
    basePaths: { home: '../', about: '../about/', stories: './' },
    savedCount: state.savedIds.length,
    savedAction: 'open-saved'
  });
}

function renderStageControls(state, story) {
  const t = getUiText(state.language);
  if ((story.images || []).length <= 1) return '';
  const dots = story.images.map((_, i) => `
    <button type="button" class="stage-dot ${i === state.currentImageIndex ? 'is-active' : ''}"
      data-action="go-image" data-value="${i}" aria-label="${escapeHtml(t.imageLabel)} ${i + 1}">
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
      <div class="story-meta-header">
        <h1 class="story-meta-name">${escapeHtml(story.storyteller)}</h1>
        <p class="story-meta-teaser">${escapeHtml(labelFor(story.summary, state.language))}</p>
      </div>
      <div class="tag-row story-meta-tags">${tagChips(state, story)}</div>
      <div class="story-meta-divider" aria-hidden="true"></div>
      <button type="button" class="guidance-flow-button" data-action="open-guidance"><span class="guidance-flow-icon">${icon.flow()}</span><span>${escapeHtml(t.storyFlow)}</span></button>
    </aside>
  `;
}

function renderSavedDrawer(state) {
  const t = getUiText(state.language);
  const savedStories = state.stories.filter((s) => isSaved(state, s.id));
  return `
    ${state.savedOpen ? `<button type="button" class="saved-drawer-backdrop is-open" data-action="close-saved" aria-label="${escapeHtml(t.close)}"></button>` : ''}
    <aside class="saved-drawer ${state.savedOpen ? 'is-open' : ''}" aria-hidden="${!state.savedOpen}">
      <div class="drawer-header drawer-header--inline">
        <div class="drawer-title-row">
          <button type="button" class="icon-button drawer-close-button" data-action="close-saved" aria-label="${escapeHtml(t.close)}">${icon.close()}</button>
          <div class="drawer-title">${escapeHtml(t.savedPhotostories)}</div>
        </div>
      </div>
      <div class="drawer-body">
        ${savedStories.length === 0
          ? `<div class="drawer-empty">${escapeHtml(t.noSaved)}</div>`
          : savedStories.map((s) => `
            <div class="saved-item">
              <button type="button" class="saved-item-main" data-action="open-saved-story" data-value="${escapeHtml(s.id)}">
                <div class="saved-thumb">${adaptiveImageMarkup(s.images?.[0], s.storyteller, 'cover')}</div>
                <div class="saved-copy">
                  <div class="saved-name">${escapeHtml(s.storyteller)}</div>
                  <div class="saved-summary">${escapeHtml(labelFor(s.summary, state.language))}</div>
                  <div class="saved-tags">
                    ${renderChip(labelFor(s.district, state.language), { muted: true })}
                    ${(s.topicTags || []).slice(0, 1).map((tag) => renderChip(labelFor(tag, state.language))).join('')}
                  </div>
                </div>
              </button>
              <button type="button" class="saved-remove-button" data-action="remove-saved" data-value="${escapeHtml(s.id)}" aria-label="${escapeHtml(t.close)}">${icon.close()}</button>
            </div>
          `).join('')}
      </div>
    </aside>
  `;
}

function renderShareModal(state) {
  const t = getUiText(state.language);
  return `
    <div class="modal-backdrop ${state.shareOpen ? 'is-open' : ''}" data-action="close-share"></div>
    <div class="share-modal ${state.shareOpen ? 'is-open' : ''}" aria-hidden="${!state.shareOpen}">
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

function renderGuidanceBox(state, options = {}) {
  const guidance = getGuidanceText(state.language);
  const classes = ['story-guidance-box'];
  if (options.compact) classes.push('is-compact');
  if (options.plain) classes.push('story-guidance-box--plain');
  if (options.modal) classes.push('story-guidance-box--modal');
  return `
    <div class="${classes.join(' ')}">
      <p class="story-guidance-intro">${escapeHtml(guidance.intro)}</p>
      <div class="story-guidance-grid">
        ${guidance.questions.map((q, i) => `
          <div class="story-guidance-card story-guidance-card--${i + 1}">
            <p>${escapeHtml(q)}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderGuidanceModal(state) {
  const t = getUiText(state.language);
  return `
    <div class="modal-backdrop ${state.guidanceOpen ? 'is-open' : ''}" data-action="close-guidance"></div>
    <div class="guidance-modal ${state.guidanceOpen ? 'is-open' : ''}" role="dialog" aria-modal="true" aria-hidden="${!state.guidanceOpen}">
      <button type="button" class="icon-button guidance-modal-close" data-action="close-guidance" aria-label="${escapeHtml(t.close)}">${icon.close()}</button>
      ${renderGuidanceBox(state, { modal: true })}
    </div>
  `;
}

function cloneFilters(filters) {
  return {
    district: filters.district,
    people: [...filters.people],
    tags: [...filters.tags],
    searchQuery: filters.searchQuery
  };
}

function renderFilterGroup(state, title, allLabel, items, currentValue, action, options = {}) {
  const isMulti = options.multi !== false;
  const filterKey = options.filterKey;
  const groupSlugs = items.map((item) => item.value);
  const base = cloneFilters(state.filters);
  const allCountFilters = cloneFilters(state.filters);

  if (filterKey === 'district') allCountFilters.district = '';
  if (filterKey === 'people') allCountFilters.people = [];
  if (filterKey === 'tags') allCountFilters.tags = allCountFilters.tags.filter((slug) => !groupSlugs.includes(slug));

  const groupHasActive = isMulti
    ? currentValue.some((value) => groupSlugs.includes(value))
    : Boolean(currentValue);

  return `
    <section class="filter-group">
      <h3>${escapeHtml(title)}</h3>
      <div class="chip-list">
        ${renderChip(allLabel, {
          active: !groupHasActive,
          muted: true,
          count: countForFilters(state, allCountFilters),
          onClick: { action: `${action}-all`, value: options.groupValue || '' }
        })}
        ${items.map((item) => {
          const active = isMulti ? currentValue.includes(item.value) : currentValue === item.value;
          const nextFilters = cloneFilters(base);
          if (filterKey === 'district') nextFilters.district = item.value;
          if (filterKey === 'people' && !nextFilters.people.includes(item.value)) nextFilters.people.push(item.value);
          if (filterKey === 'tags' && !nextFilters.tags.includes(item.value)) nextFilters.tags.push(item.value);
          return renderChip(item.label, {
            active,
            muted: !active,
            count: countForFilters(state, nextFilters),
            onClick: { action, value: item.value }
          });
        }).join('')}
      </div>
    </section>
  `;
}

function renderSearchBox(state) {
  const t = getUiText(state.language);
  return `
    <div class="search-box">
      <span class="search-icon" aria-hidden="true">${icon.search()}</span>
      <input
        type="search"
        class="search-input"
        data-search-input
        placeholder="${escapeHtml(t.searchPlaceholder)}"
        value="${escapeHtml(state.filters.searchQuery)}"
        autocomplete="off"
        spellcheck="false"
        aria-label="${escapeHtml(t.searchPlaceholder)}"
      >
    </div>
  `;
}

function storyGalleryHeader(state) {
  const count = filteredStories(state).length;
  const t = getUiText(state.language);
  if (state.galleryMode === 'related') return storyCountLabel(count, t.relatedStory, t.relatedStories);
  if (state.galleryMode === 'filtered') return storyCountLabel(count, t.filteredStory, t.filteredStories);
  return storyCountLabel(count, t.totalStory, t.totalStories);
}

function storyFilterSummaryMarkup(state) {
  const t = getUiText(state.language);
  const total = state.stories.length;
  const visible = filteredStories(state).length;
  const label = t.photostories || t.stories || 'photostories';
  const isFiltered = visible !== total || hasActiveFilters(state.filters) || state.galleryMode === 'related';

  if (!isFiltered) {
    return `<span class="filter-summary-text">${total} ${escapeHtml(label)}</span>`;
  }

  return `
    <span class="filter-summary-text">${visible}/${total} ${escapeHtml(label)}</span>
    <button type="button" class="filter-summary-reset" data-action="reset-filters">${escapeHtml(t.resetFilters || 'Reset filters')}</button>
  `;
}

function renderGalleryCard(state, item) {
  const t = getUiText(state.language);
  const visibleTags = [...(item.topicTags || []), ...(item.people || [])];
  return `
    <button type="button" class="gallery-card" data-action="open-story" data-value="${escapeHtml(item.id)}">
      <div class="gallery-image-frame">
        <img class="gallery-image-cover" src="${escapeHtml(item.images?.[0] || '')}" alt="${escapeHtml(item.storyteller)}" loading="lazy">
      </div>
      <div class="gallery-card-body">
        <p class="gallery-summary">${escapeHtml(labelFor(item.summary, state.language))}</p>
        <div class="tag-row small">
          ${renderChip(labelFor(item.district, state.language), { muted: true })}
          ${visibleTags.map((tag) => renderChip(labelFor(tag, state.language), { muted: tag.clusterSlug === 'people' })).join('')}
        </div>
        ${isSaved(state, item.id) ? `<div class="saved-marker">${icon.bookmark()}<span>${escapeHtml(t.saved)}</span></div>` : ''}
      </div>
    </button>
  `;
}

export function renderApp(state) {
  const app = qs('#app');
  const story = currentStory(state);
  if (!app || !story) return;

  const t = getUiText(state.language);
  const landing = getLandingText(state.language);
  const visibleStories = pagedStories(state);
  const totalFiltered = filteredStories(state).length;
  const moreAvailable = hasMoreStories(state);

  const districtItems = allDistricts(state).map((d) => ({ value: d.slug, label: labelFor(d, state.language) }));
  const peopleItems = allPeople(state).map((p) => ({ value: p.slug, label: labelFor(p, state.language) }));
  const tagGroups = allTagClusters(state).map((cluster) => ({
    ...cluster,
    label: labelFor(cluster, state.language),
    items: cluster.tags.map((tag) => ({ value: tag.slug, label: labelFor(tag, state.language) }))
  }));

  document.title = t.siteTitle;

  const nexusLines = landing.section1NexusLines || [];
  const titleLines = landing.section1TitleLines || [];
  const contextStrips = `
    <div class="context-strip context-strip--top context-strip--nexus" aria-hidden="true">${nexusLines.map((line) => `<span>${escapeHtml(line)}</span>`).join('')}</div>
    <div class="context-strip context-strip--bottom context-strip--title" aria-hidden="true">${titleLines.map((line) => `<span>${escapeHtml(line)}</span>`).join('')}</div>
  `;

  const imageIndex = Math.min(state.currentImageIndex, Math.max((story.images || []).length - 1, 0));
  const storySlides = (story.images || []).map((src, i) => `
    <div class="story-slide ${i === imageIndex ? 'is-active' : ''}">
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
          <button type="button" class="action-button ${isSaved(state, story.id) ? 'is-saved' : ''}" data-action="toggle-save">
            ${icon.bookmark()}<span>${escapeHtml(isSaved(state, story.id) ? t.saved : t.save)}</span>
          </button>
          <button type="button" class="action-button" data-action="open-share">${icon.share()}<span>${escapeHtml(t.share)}</span></button>
          <button type="button" class="action-button" data-action="random-related">${icon.shuffle()}<span>${escapeHtml(t.relatedRandom)}</span></button>
          <button type="button" class="action-button" data-action="show-related">${icon.related()}<span>${escapeHtml(t.related)}</span></button>
          <button type="button" class="action-button" data-action="explore-all">${icon.sliders()}<span>${escapeHtml(t.explore)}</span></button>
        </div>
        ${state.actionMessage ? `<div class="action-message">${escapeHtml(state.actionMessage)}</div>` : ''}
      </div>
    </section>
  ` : '';

  const galleryGridMarkup = visibleStories.length === 0
    ? `<div class="gallery-empty">
        <p>${escapeHtml(t.noResults)}</p>
        <button type="button" class="action-button" data-action="reset-filters">${escapeHtml(t.reset)}</button>
      </div>`
    : visibleStories.map((item) => renderGalleryCard(state, item)).join('');

  const loadMoreMarkup = moreAvailable
    ? `<div class="load-more-row">
        <button type="button" class="load-more-button" data-action="load-more">
          ${escapeHtml(t.loadMore)} <span class="load-more-count">${visibleStories.length} / ${totalFiltered}</span>
        </button>
      </div>`
    : '';

  const filterGroupsMarkup = [
    renderFilterGroup(state, t.district, t.all, districtItems, state.filters.district, 'filter-district', { multi: false, filterKey: 'district' }),
    renderFilterGroup(state, t.people, t.all, peopleItems, state.filters.people, 'filter-people', { multi: true, filterKey: 'people' }),
    ...tagGroups.map((group) => renderFilterGroup(state, group.label, t.all, group.items, state.filters.tags, 'filter-tag', {
      multi: true,
      filterKey: 'tags',
      groupValue: group.slug
    }))
  ].join('');

  const galleryMarkup = state.galleryVisible ? `
    <section id="gallery" class="gallery-band gallery-band--entry">
      <div class="content-wrap">
        <button type="button" class="mobile-filter-toggle ${state.filterDrawerOpen ? 'is-open' : ''}" data-action="toggle-filter-drawer">
          <span>${escapeHtml(state.filterDrawerOpen ? t.hideFilters : t.showFilters)}</span>
          <span class="mobile-filter-toggle-icon" aria-hidden="true">${state.filterDrawerOpen ? '⌄' : '⌃'}</span>
        </button>
        <div class="gallery-layout ${state.filterDrawerOpen ? 'is-filter-open' : ''}">
          <aside class="filter-panel ${state.filterDrawerOpen ? 'is-open' : ''}">
            <div class="filter-panel-sticky">
              <div class="gallery-header gallery-header--filter">${storyFilterSummaryMarkup(state)}</div>
            </div>
            ${renderSearchBox(state)}
            <div class="filter-panel-scroll-body">${filterGroupsMarkup}</div>
          </aside>
          <div class="gallery-results-pane">
            <div class="gallery-grid">
              ${galleryGridMarkup}
            </div>
            ${loadMoreMarkup}
          </div>
        </div>
      </div>
    </section>
  ` : '';

  const shellClasses = [
    'site-shell',
    !state.storyVisible ? 'is-gallery-only' : '',
    state.galleryVisible && state.filterDrawerOpen ? 'is-filter-split' : ''
  ].filter(Boolean).join(' ');

  app.innerHTML = `
    <div class="${shellClasses}">
      ${contextStrips}
      ${renderUtilityMenu(state)}
      <main>
        ${storyMarkup}
        ${galleryMarkup}
      </main>
      ${renderSavedDrawer(state)}
      ${renderShareModal(state)}
      ${renderGuidanceModal(state)}
    </div>
  `;
}
