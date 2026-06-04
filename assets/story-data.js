import { STORAGE_KEYS } from './content.js';
import { PAGE_SIZE } from './state.js';

export const SEARCH_MIN_CHARS = 3;

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

export function updateUrlForStory(story, options = {}) {
  const url = storyAppUrl();
  url.searchParams.set('code', story.code || story.id);
  url.hash = options.hash || '';
  history.replaceState(options.state || {}, '', url);
}

export function hasActiveFilters(filters) {
  return Boolean(
    filters.district ||
    filters.people.length ||
    filters.tags.length ||
    effectiveSearchQuery(filters)
  );
}

export function effectiveSearchQuery(filters) {
  const query = String(filters?.searchQuery || '').trim().toLowerCase();
  return query.length >= SEARCH_MIN_CHARS ? query : '';
}

function storyContainsAny(storyItems = [], selectedSlugs = []) {
  if (selectedSlugs.length === 0) return true;
  const storySlugs = new Set(storyItems.map((item) => resolveSlug(item)).filter(Boolean));
  return selectedSlugs.some((slug) => storySlugs.has(slug));
}

function storyReflectionSearchTerms(story) {
  const reflectionTerms = (story.reflections || []).flatMap((reflection) => {
    const text = reflection?.text || reflection;
    return [
      reflection?.type,
      text?.en,
      text?.so,
      typeof text === 'string' ? text : ''
    ];
  });
  const legacyReflection = story.reflection || null;

  return [
    ...reflectionTerms,
    legacyReflection?.en,
    legacyReflection?.so,
    typeof legacyReflection === 'string' ? legacyReflection : ''
  ].join(' ');
}

export function storyMatchesFilters(story, filters) {
  if (filters.district && story.district?.slug !== filters.district) return false;

  const selectedTagSlugs = [...filters.people, ...filters.tags];
  if (!storyContainsAny(story.tags || [], selectedTagSlugs)) return false;

  if (filters.searchQuery) {
    const q = effectiveSearchQuery(filters);
    if (!q) return true;
    const tagLabels = (story.tags || []).flatMap((tag) => [tag.en, tag.so]).join(' ');
    const haystack = [
      story.code,
      story.storyteller,
      story.district?.en,
      story.district?.so,
      story.summary?.en,
      story.summary?.so,
      story.story?.en,
      story.story?.so,
      tagLabels,
      storyReflectionSearchTerms(story)
    ].join(' ').toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  return true;
}

export function filteredStories(state, filters = state.filters) {
  const matches = state.stories.filter((story) => storyMatchesFilters(story, filters));
  if (state.galleryMode === 'related' && state.currentStoryId) {
    return matches.filter((story) => String(story.id) !== String(state.currentStoryId));
  }
  return matches;
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

  if (base.district?.slug && base.district.slug === candidate.district?.slug) score += 1;
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
  let matches = state.stories.filter((story) => storyMatchesFilters(story, nextFilters));
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
