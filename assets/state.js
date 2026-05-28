import { STORAGE_KEYS } from './content.js';

export const PAGE_SIZE = 24;

export function createEmptyFilters() {
  return {
    district: '',
    people: [],
    tags: [],
    searchQuery: ''
  };
}

function readSavedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.saved) || '[]';
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function createInitialState() {
  return {
    stories: [],
    tagClusters: [],
    language: localStorage.getItem(STORAGE_KEYS.language) || 'en',
    theme: localStorage.getItem(STORAGE_KEYS.theme) || 'dark',
    savedIds: readSavedIds(),
    currentStoryId: null,
    currentImageIndex: 0,
    filters: createEmptyFilters(),
    galleryPage: 1,
    galleryMode: 'total',
    storyVisible: true,
    galleryVisible: false,
    shareOpen: false,
    guidanceOpen: false,
    savedOpen: false,
    menuOpen: false,
    filterDrawerOpen: false,
    gallerySplitPercent: 50,
    actionMessage: '',
    autoplayId: null
  };
}

export const state = createInitialState();
