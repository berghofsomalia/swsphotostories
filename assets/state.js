import { STORAGE_KEYS } from './content.js';

export function createEmptyFilters() {
  return {
    district: '',
    primaryTheme: '',
    secondaryThemes: [],
    people: []
  };
}

function readSavedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.saved) || '[]';
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function createInitialState() {
  return {
    stories: [],
    language: localStorage.getItem(STORAGE_KEYS.language) || 'en',
    theme: localStorage.getItem(STORAGE_KEYS.theme) || 'dark',
    savedIds: readSavedIds(),
    currentStoryId: null,
    currentImageIndex: 0,
    filters: createEmptyFilters(),
    galleryMode: 'total',
    storyVisible: true,
    galleryVisible: false,
    shareOpen: false,
    savedOpen: false,
    actionMessage: '',
    autoplayId: null
  };
}

export const state = createInitialState();
