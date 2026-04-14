import { STORAGE_KEYS } from './content.js';

export function getStoryById(stories, id) {
  return stories.find((story) => story.id === id) || null;
}

export function currentStory(state) {
  return getStoryById(state.stories, state.currentStoryId) || state.stories[0] || null;
}

export function isSaved(state, id) {
  return state.savedIds.includes(id);
}

export function savePersistentState(state) {
  localStorage.setItem(STORAGE_KEYS.language, state.language);
  localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(state.savedIds));
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

export function buildShareUrl(story) {
  const url = new URL(window.location.href);
  url.pathname = `${url.pathname.replace(/[^/]*$/, '')}index.html`;
  url.searchParams.set('code', story.id);
  return url.toString();
}

export function updateUrlForStory(story) {
  const url = new URL(window.location.href);
  url.searchParams.set('code', story.id);
  history.replaceState({}, '', url);
}

export function hasActiveFilters(filters) {
  return Boolean(filters.district || filters.primaryTheme || filters.secondaryThemes.length || filters.people.length);
}

export function storyMatchesFilters(story, filters) {
  if (filters.district && story.district.slug !== filters.district) return false;
  if (filters.primaryTheme && story.primaryTheme.slug !== filters.primaryTheme) return false;

  if (filters.secondaryThemes.length > 0) {
    const storyThemeSlugs = [story.primaryTheme.slug, ...story.secondaryThemes.map((theme) => theme.slug)];
    if (!filters.secondaryThemes.some((slug) => storyThemeSlugs.includes(slug))) return false;
  }

  if (filters.people.length > 0 && !filters.people.some((person) => story.actors.includes(person))) return false;
  return true;
}

export function filteredStories(state, filters = state.filters) {
  return state.stories.filter((story) => storyMatchesFilters(story, filters));
}

function scoreRelated(base, candidate) {
  if (base.id === candidate.id) return -1;

  let score = 0;
  if (base.primaryTheme.slug === candidate.primaryTheme.slug) score += 5;
  score += base.secondaryThemes.filter((theme) => candidate.secondaryThemes.some((other) => other.slug === theme.slug)).length * 2;
  score += candidate.secondaryThemes.some((theme) => theme.slug === base.primaryTheme.slug) ? 3 : 0;
  score += base.actors.filter((actor) => candidate.actors.includes(actor)).length * 2;
  if (base.district.slug === candidate.district.slug) score += 1;
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
  return state.stories.filter((story) => storyMatchesFilters(story, nextFilters)).length;
}

export function storyCountLabel(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function uniqueBySlug(entries) {
  return [...new Map(entries.map((entry) => [entry.slug, entry])).values()];
}

export function allDistricts(state) {
  return uniqueBySlug(state.stories.map((story) => story.district));
}

export function allPrimaryThemes(state) {
  return uniqueBySlug(state.stories.map((story) => story.primaryTheme));
}

export function allSecondaryThemes(state) {
  return uniqueBySlug(state.stories.flatMap((story) => story.secondaryThemes));
}

export function allPeople(state) {
  return [...new Set(state.stories.flatMap((story) => story.actors))];
}
