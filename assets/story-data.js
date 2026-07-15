import { STORAGE_KEYS } from './content.js?v=20260715-shared-questions';
import { PAGE_SIZE } from './state.js?v=20260608-gallery-batches';

export function getStoryById(stories, id) {
  const target = String(id || '').trim();
  return stories.find((story) => String(story.id) === target || String(story.code) === target) || null;
}

export function currentStory(state) {
  return getStoryById(state.stories, state.currentStoryId) || state.stories[0] || null;
}

export function isSaved(state, id) {
  return state.savedIds.map(String).includes(String(id));
}

export function savePersistentState(state) {
  localStorage.setItem(STORAGE_KEYS.language, state.language);
  localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(state.savedIds.map(String)));
  localStorage.setItem(STORAGE_KEYS.theme, state.theme);
  document.documentElement.lang = state.language === 'so' ? 'so' : 'en';
  document.documentElement.dataset.theme = state.theme;
}

export function shuffle(items) {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}

export function resolveSlug(item) {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (item.slug) return item.slug;
  const label = item.en || item.label_en || '';
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function storyAppUrl() {
  const url = new URL(window.location.href);
  url.pathname = url.pathname.replace(/index\.html$/, '');
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  url.searchParams.delete('random');
  return url;
}

export function buildShareUrl(story) {
  const url = storyAppUrl();
  url.search = '';
  url.hash = '';
  url.searchParams.set('code', story.code || story.id);
  return url.toString();
}

export function buildGalleryShareUrl(filters) {
  const url = storyAppUrl();
  url.search = '';
  url.hash = 'gallery';
  const districts = selectedDistricts(filters);
  if (districts.length)               url.searchParams.set('district', districts.join(','));
  if (filters.people?.length)         url.searchParams.set('people',   filters.people.join(','));
  if (filters.tags?.length)           url.searchParams.set('tags',     filters.tags.join(','));
  if (filters.searchQuery?.trim())    url.searchParams.set('q',        filters.searchQuery.trim());
  return url.toString();
}

export function updateUrlForStory(story, options = {}) {
  const url = storyAppUrl();
  url.searchParams.set('code', story.code || story.id);
  url.hash = options.hash || '';
  history.replaceState(options.state || {}, '', url);
}

export function hasActiveFilters(filters) {
  return Boolean(
    selectedDistricts(filters).length ||
    filters.people.length ||
    filters.tags.length ||
    effectiveSearchQuery(filters)
  );
}

export function selectedDistricts(filters) {
  if (Array.isArray(filters?.district)) return filters.district.filter(Boolean);
  return filters?.district ? [filters.district] : [];
}

export function effectiveSearchQuery(filters) {
  return String(filters?.searchQuery || '').trim().toLowerCase();
}

function storyContainsAny(storyItems = [], selectedSlugs = []) {
  if (selectedSlugs.length === 0) return true;
  const storySlugs = new Set(storyItems.map((item) => resolveSlug(item)).filter(Boolean));
  return selectedSlugs.some((slug) => storySlugs.has(slug));
}

function storyContainsAll(storyItems = [], selectedSlugs = []) {
  if (selectedSlugs.length === 0) return true;
  const storySlugs = new Set(storyItems.map((item) => resolveSlug(item)).filter(Boolean));
  return selectedSlugs.every((slug) => storySlugs.has(slug));
}

function selectedTagGroups(state, selectedSlugs = []) {
  const selectedSet = new Set(selectedSlugs.filter(Boolean));
  if (selectedSet.size === 0) return [];

  const clusters = new Map();
  const knownSlugs = new Set();

  const addTag = (tag, fallbackClusterSlug = 'other') => {
    const slug = resolveSlug(tag);
    if (!slug || !selectedSet.has(slug)) return;
    knownSlugs.add(slug);
    const clusterSlug = tag.clusterSlug || tag.cluster?.slug || fallbackClusterSlug;
    if (!clusters.has(clusterSlug)) clusters.set(clusterSlug, []);
    clusters.get(clusterSlug).push(slug);
  };

  (state.tagClusters || []).forEach((cluster) => {
    (cluster.tags || []).forEach((tag) => addTag(tag, cluster.slug || 'other'));
  });

  (state.stories || []).forEach((story) => {
    (story.topicTags || []).forEach((tag) => addTag(tag));
  });

  selectedSet.forEach((slug) => {
    if (!knownSlugs.has(slug)) clusters.set(`unknown-${slug}`, [slug]);
  });

  return [...clusters.values()].map((group) => [...new Set(group)]);
}

function localizedValue(value, language = 'en') {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value?.[language] || value?.en || value?.so || '';
}

function storyReflectionSearchTerms(story, language = 'en') {
  const reflectionTerms = (story.reflections || []).flatMap((reflection) => {
    const text = reflection?.text || reflection;
    return [
      reflection?.type,
      localizedValue(text, language),
      typeof text === 'string' ? text : ''
    ];
  });
  const legacyReflection = story.reflection || null;

  return [
    ...reflectionTerms,
    localizedValue(legacyReflection, language),
    typeof legacyReflection === 'string' ? legacyReflection : ''
  ].join(' ');
}

export function storySearchHaystack(story, language = 'en') {
  const tagLabels = (story.tags || []).map((tag) => localizedValue(tag, language)).join(' ');
  return [
    story.code,
    story.storyteller,
    localizedValue(story.district, language),
    localizedValue(story.summary, language),
    localizedValue(story.story, language),
    tagLabels,
    storyReflectionSearchTerms(story, language)
  ].join(' ').toLowerCase();
}

export function storyMatchesFilters(story, filters, selectedTagGroups = [], language = 'en') {
  const districts = selectedDistricts(filters);
  if (districts.length && !districts.includes(story.district?.slug)) return false;

  if (!storyContainsAll(story.people || [], filters.people || [])) return false;

  if (!selectedTagGroups.every((clusterSlugs) => storyContainsAll(story.topicTags || [], clusterSlugs))) return false;

  if (filters.searchQuery) {
    const q = effectiveSearchQuery(filters);
    if (!q) return true;
    if (!storySearchHaystack(story, language).includes(q)) return false;
  }

  return true;
}

export function filteredStories(state, filters = state.filters) {
  const tagGroups = selectedTagGroups(state, filters.tags || []);
  const matches = state.stories.filter((story) => storyMatchesFilters(story, filters, tagGroups, state.language));
  const visible = state.galleryMode === 'related' && state.currentStoryId
    ? matches.filter((story) => String(story.id) !== String(state.currentStoryId))
    : matches;
  return applyGalleryOrder(state, visible);
}

function applyGalleryOrder(state, stories = []) {
  const order = Array.isArray(state.galleryOrder) ? state.galleryOrder : [];
  if (!order.length) return stories;

  const rank = new Map(order.map((id, index) => [String(id), index]));
  return [...stories].sort((a, b) => {
    const aRank = rank.has(String(a.id)) ? rank.get(String(a.id)) : Number.MAX_SAFE_INTEGER;
    const bRank = rank.has(String(b.id)) ? rank.get(String(b.id)) : Number.MAX_SAFE_INTEGER;
    return aRank - bRank;
  });
}

// Same as filteredStories, but ignores the search query — used to render every
// card that could possibly match while typing, so search can hide/show cards
// via a CSS class instead of regenerating markup on every keystroke.
export function filteredStoriesExcludingSearch(state, filters = state.filters) {
  return filteredStories(state, { ...filters, searchQuery: '' });
}

export function pagedStories(state) {
  return filteredStories(state).slice(0, state.galleryPage * PAGE_SIZE);
}

export function hasMoreStories(state) {
  return filteredStories(state).length > state.galleryPage * PAGE_SIZE;
}

export function scoreRelated(base, candidate) {
  if (!base || !candidate || base.id === candidate.id) return -1;

  const baseTags = new Set((base.tags || []).map((tag) => tag.slug).filter(Boolean));
  const candidateTags = new Set((candidate.tags || []).map((tag) => tag.slug).filter(Boolean));
  let score = 0;

  baseTags.forEach((slug) => {
    if (candidateTags.has(slug)) score += 4;
  });

  return score;
}

export function pickRandomRelatedStory(state, base) {
  const ranked = state.stories
    .map((story) => ({ story, score: scoreRelated(base, story) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score);

  const topScore = ranked[0]?.score ?? 0;
  const strongest = ranked.filter((entry) => entry.score === topScore).map((entry) => entry.story);
  const pool = strongest.length > 0 ? strongest : state.stories.filter((story) => story.id !== base.id);
  return pool[Math.floor(Math.random() * pool.length)] || base;
}

export function countForFilters(state, nextFilters) {
  const tagGroups = selectedTagGroups(state, nextFilters.tags || []);
  let matches = state.stories.filter((story) => storyMatchesFilters(story, nextFilters, tagGroups, state.language));
  if (state.galleryMode === 'related' && state.currentStoryId) {
    matches = matches.filter((story) => String(story.id) !== String(state.currentStoryId));
  }
  return matches.length;
}

export function storyCountLabel(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function uniqueBySlug(entries) {
  const map = new Map();
  entries.filter(Boolean).forEach((entry) => {
    const slug = resolveSlug(entry);
    if (!slug || map.has(slug)) return;
    map.set(slug, entry);
  });
  return [...map.values()].sort((a, b) => {
    const order = (a.sort_order ?? a.sortOrder ?? 999) - (b.sort_order ?? b.sortOrder ?? 999);
    if (order !== 0) return order;
    return String(a.en || '').localeCompare(String(b.en || ''));
  });
}

export function allDistricts(state) {
  return uniqueBySlug(state.stories.map((story) => story.district));
}

export function allPeople(state) {
  const cataloguePeople = (state.tagClusters || [])
    .find((cluster) => cluster.slug === 'people')
    ?.tags;

  if (cataloguePeople?.length) return uniqueBySlug(cataloguePeople);
  return uniqueBySlug(state.stories.flatMap((story) => story.people || []));
}

export function allTagClusters(state) {
  const catalogueClusters = (state.tagClusters || [])
    .filter((cluster) => cluster.slug !== 'people')
    .map((cluster) => ({
      ...cluster,
      tags: uniqueBySlug(cluster.tags || [])
    }))
    .filter((cluster) => cluster.tags.length > 0);

  if (catalogueClusters.length > 0) {
    return catalogueClusters.sort((a, b) => {
      const order = (a.sort_order ?? a.sortOrder ?? 999) - (b.sort_order ?? b.sortOrder ?? 999);
      if (order !== 0) return order;
      return String(a.en || '').localeCompare(String(b.en || ''));
    });
  }

  const clusters = new Map();

  state.stories.forEach((story) => {
    (story.topicTags || []).forEach((tag) => {
      if (!tag.cluster || !tag.clusterSlug) return;
      if (!clusters.has(tag.clusterSlug)) {
        clusters.set(tag.clusterSlug, {
          ...tag.cluster,
          slug: tag.clusterSlug,
          tags: []
        });
      }
      clusters.get(tag.clusterSlug).tags.push(tag);
    });
  });

  return [...clusters.values()]
    .map((cluster) => ({
      ...cluster,
      tags: uniqueBySlug(cluster.tags)
    }))
    .sort((a, b) => {
      const order = (a.sort_order ?? a.sortOrder ?? 999) - (b.sort_order ?? b.sortOrder ?? 999);
      if (order !== 0) return order;
      return String(a.en || '').localeCompare(String(b.en || ''));
    });
}
