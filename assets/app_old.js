const STORAGE_KEYS = {
  language: 'photostory_language',
  saved: 'photostory_saved',
  theme: 'photostory_theme'
};

const COPY = {
  en: {
    siteTitle: 'Photostories from Southwest State',
    introTitleLines: ['PHOTOSTORIES', 'FROM', 'SOUTHWEST', 'STATE'],
    introEnter: 'Explore',
    themeLabel: 'Theme',
    dark: 'Dark',
    light: 'Light',
    shortSo: 'SO',
    shortEn: 'EN',
    somaali: 'Soomaali',
    english: 'English',
    saved: 'Saved',
    save: 'Save',
    share: 'Share',
    relatedRandom: 'See a random related story',
    related: 'See related stories',
    explore: 'Explore stories through filters',
    communityReflections: 'COMMUNITY REFLECTIONS',
    reset: 'Reset all filters',
    district: 'District',
    primaryTheme: 'Primary theme',
    secondaryThemes: 'Secondary themes',
    people: 'People',
    all: 'All',
    copyLink: 'Copy link',
    facebook: 'Facebook',
    instagram: 'Instagram',
    x: 'X',
    email: 'Email',
    shareThisStory: 'Share this story',
    copied: 'Link copied to clipboard',
    instagramHint: 'Link copied for Instagram',
    savedMessage: 'Story saved',
    removedMessage: 'Story removed from saved list',
    noSaved: 'You have not saved any stories yet.',
    relatedStory: 'related story',
    relatedStories: 'related stories',
    filteredStory: 'filtered story',
    filteredStories: 'filtered stories',
    totalStory: 'story in total',
    totalStories: 'stories in total',
    story: 'story',
    stories: 'stories',
    close: 'Close',
    imageLabel: 'Go to image',
    previousImage: 'Previous image',
    nextImage: 'Next image',
    openSaved: 'Open saved stories'
  },
  so: {
    siteTitle: 'Sheeko-sawirro ka socda Koonfur Galbeed',
    introTitleLines: ['SHEEKO', 'SAWIRRO', 'KOONFUR', 'GALBEED'],
    introEnter: 'Sahami',
    themeLabel: 'Muuqaal',
    dark: 'Madow',
    light: 'Iftiin',
    shortSo: 'SO',
    shortEn: 'EN',
    somaali: 'Soomaali',
    english: 'Af Ingiriis',
    saved: 'Kaydsan',
    save: 'Kaydi',
    share: 'La wadaag',
    relatedRandom: 'Arag sheeko la xidhiidha oo aan kala sooc lahayn',
    related: 'Arag sheekooyin la xidhiidha',
    explore: 'Ku sahamin sheekooyinka shaandhooyinka',
    communityReflections: 'ARAGTIYO BULSHO',
    reset: 'Nadiifi shaandhooyinka',
    district: 'Degmo',
    primaryTheme: 'Mawduuca koowaad',
    secondaryThemes: 'Mawduucyo kale',
    people: 'Dadka',
    all: 'Dhammaan',
    copyLink: 'Koobiyee xidhiidhka',
    facebook: 'Facebook',
    instagram: 'Instagram',
    x: 'X',
    email: 'Iimayl',
    shareThisStory: 'La wadaag sheekadan',
    copied: 'Xidhiidhka waa la koobiyey',
    instagramHint: 'Xidhiidhka ayaa loo koobiyey Instagram',
    savedMessage: 'Sheekada waa la keydiyey',
    removedMessage: 'Sheekada waa laga saaray kaydka',
    noSaved: 'Wali ma kaydin wax sheeko ah.',
    relatedStory: 'sheeko la xidhiidha',
    relatedStories: 'sheekooyin la xidhiidha',
    filteredStory: 'sheeko la shaandheeyey',
    filteredStories: 'sheekooyin la shaandheeyey',
    totalStory: 'sheeko guud ahaan',
    totalStories: 'sheekooyin guud ahaan',
    story: 'sheeko',
    stories: 'sheekooyin',
    close: 'Xir',
    imageLabel: 'U gudub sawirka',
    previousImage: 'Sawirkii hore',
    nextImage: 'Sawirka xiga',
    openSaved: 'Fur sheekooyinka la kaydiyey'
  }
};

const LANDING = {
  en: {
    section1Nexus: 'The nexus of <br/>climate (change), <br/>environment (degradation), <br/>conflict, and peace',
    section1Title: 'Visual storytelling <br/>from Southwest State, Somalia',
    section2Body: 'In late 2025, 42 community members across Baidoa, Barawe and Hudur, <br/>across generations and genders, <br/>took photos capturing various aspects of the nexus of <br/>climate (change), environment (degradation), conflict, and peace <br/>and told the human stories behind the photos.',
    section3Lead: 'They pondered...',
    questions: [
      'Why did I choose to take these photos? What memories or emotions do these photos invoke in me?',
      'What do I want others to feel and understand from these photos? What community issues or strengths do I want to illustrate?',
      'If I imagine that the issues are getting resolved or the strengths are getting amplified over the next three years, what would these photos look like?',
      'What cultural and religious elements (a) describe the current photos and (b) could inspire us to work towards turning the imagined photos into reality?'
    ],
    section4Body: 'The photos were shared in community spaces of storytelling and dialogue. People picked photos they connected to and shared their own reflections on the stories.',
    section5Body: 'There are currently 350 stories, 1000 photos and 150 community reflections. What would you like to do?',
    surprise: 'See a photostory - surprise me!',
    explore: 'Let me explore them myself',
    shareOwn: 'Share my own photostory',
    comingSoon: 'Coming soon'
  },
  so: {
    section1Nexus: 'Xiriirka ka dhexeeya (isbeddelka) cimilada, (nabaad-guurka) deegaanka, khilaafka, iyo nabadda',
    section1Title: 'Sheeko-muuqaal ka yimid Koonfur Galbeed, Soomaaliya',
    section2Body: 'Dabayaaqadii 2025, 42 xubnood oo bulshada ka kala socday Baydhabo, Baraawe iyo Xudur, kana kala tirsanaa jiilal iyo jinsiyo kala duwan, ayaa qaaday sawirro muujinaya dhinacyo kala duwan oo ka mid ah xiriirka cimilada (isbeddelka), deegaanka (nabaad-guurka), khilaafka, iyo nabadda, waxayna ka sheekeeyeen sheekooyinka bini’aadannimo ee ka dambeeya sawirrada.',
    section3Lead: 'Waxay isweydiiyeen...',
    questions: [
      'Maxaan u doortay in aan sawirradan qaado? Xusuuso ama shucuur noocee ah ayay sawirradani igu kicinayaan?',
      'Maxaan rabaa in dadka kale ay ka dareemaan oo ka fahmaan sawirradan? Arrimahee ama xoogaggee bulshada ka jira ayaan rabaa in aan sawirradan ku muujiyo?',
      'Haddii aan qiyaaso in arrimahani la xallinayo ama xoogagga wanaagsani sii xoogaysanayaan saddexda sano ee soo socota, sawirradani sidee bay markaas u ekaan lahaayeen?',
      'Waa maxay waxyaabaha dhaqanka iyo diinta ee (a) sharrixi kara sawirrada hadda jira, isla markaana (b) nagu dhiirrigelin kara in aan ka shaqayno sidii sawirrada la qiyaasay ay dhab u noqon lahaayeen?'
    ],
    section4Body: 'Sawirrada waxaa lagu wadaagay goobaha bulshadu ku kulanto ee sheeko-wadaagga iyo wada-hadalka. Dadku waxay doorteen sawirradii ay la xiriireen, dabadeedna waxay ka dhiibteen milicsiyadooda ku saabsan sheekooyinka.',
    section5Body: 'Hadda waxaa jira 350 sheeko, 1000 sawir iyo 150 milicsi bulsho. Maxaad jeclaan lahayd in aad samayso?',
    surprise: 'I tus sheeko-sawir - yaab i geli!',
    explore: 'Aan anigu is baadho',
    shareOwn: 'Aan wadaago sheeko-sawirkayga',
    comingSoon: 'Dhawaan'
  }
};

const STORY_GUIDANCE = {
  en: {
    title: 'Story process',
    intro: 'The stories and community reflections on the photos follow this pattern of questions:',
    questions: [
      'Why did I choose to take or pick these photos? What memories or emotions do these photos invoke in me?',
      'What do I want others to feel and understand from these photos? What community issues or strengths do I want to illustrate?',
      'If I imagine that the issues are getting resolved or the strengths are getting amplified over the next three years, what would these photos look like?',
      'What cultural and religious elements such as poems, songs, proverbs, and teachings from the Quran or Hadith can describe the current photos and inspire us to work towards turning the imagined photos into reality?'
    ]
  },
  so: {
    title: 'Hannaanka sheekada',
    intro: 'Sheekooyinka iyo milicsiyada bulshadu ka bixisay sawirrada waxay raacayaan hannaan su’aalo ah oo sidan u dhisan:',
    questions: [
      'Maxaan u doortay in aan sawirradan qaado ama u xusho? Xusuuso ama shucuur noocee ah ayay sawirradani igu kicinayaan?',
      'Maxaan rabaa in dadka kale ay ka dareemaan oo ka fahmaan sawirradan? Arrimahee ama xoogaggee bulshada ka jira ayaan rabaa in aan ku muujiyo?',
      'Haddii aan qiyaaso in saddexda sano ee soo socota arrimahani la xallinayo ama xoogagga wanaagsani sii xoogaysanayaan, sawirradani markaas sidee bay u ekaan lahaayeen?',
      'Waa maxay waxyaabaha dhaqanka iyo diinta ee, sida gabayo, heeso, maahmaahyo, iyo casharro ka imanaya Qur’aanka iyo Xadiiska, kuwaas oo sharrixi kara sawirrada hadda jira, isla markaana nagu dhiirrigelin kara in aan ka shaqayno sidii sawirrada la qiyaasay ay dhab u noqon lahaayeen?'
    ]
  }
};

const INTRO_SLOTS = [
  { left: '4vw', top: '8svh', width: '12vw', height: '20svh', rotate: -4, z: 4 },
  { left: '18vw', top: '11svh', width: '10vw', height: '16svh', rotate: 2.5, z: 5 },
  { left: '28vw', top: '5svh', width: '13vw', height: '18svh', rotate: -1.5, z: 4 },
  { left: '9vw', top: '29svh', width: '11vw', height: '18svh', rotate: 3.2, z: 4 },
  { left: '26vw', top: '36svh', width: '14vw', height: '12svh', rotate: -2.8, z: 4 },
  { left: '5vw', top: '112svh', width: '13vw', height: '20svh', rotate: -2.4, z: 4 },
  { left: '19vw', top: '126svh', width: '10vw', height: '15svh', rotate: 1.8, z: 5 },
  { left: '30vw', top: '117svh', width: '13vw', height: '11svh', rotate: -3.1, z: 4 },
  { left: '8vw', top: '210svh', width: '12vw', height: '10svh', rotate: -2.2, z: 4 },
  { left: '18vw', top: '223svh', width: '14vw', height: '16svh', rotate: 2, z: 5 },
  { left: '31vw', top: '214svh', width: '12vw', height: '10svh', rotate: 2.8, z: 4 },
  { left: '34vw', top: '235svh', width: '9vw', height: '17svh', rotate: -2.5, z: 4 },
  { left: '3vw', top: '57svh', width: '9vw', height: '8svh', rotate: -1.6, z: 3 },
  { left: '34vw', top: '58svh', width: '9vw', height: '7svh', rotate: 1.5, z: 3 },
  { left: '4vw', top: '147svh', width: '10vw', height: '8svh', rotate: -1.2, z: 3 },
  { left: '34vw', top: '146svh', width: '10vw', height: '8svh', rotate: 1.9, z: 3 }
];


const ACTOR_LABELS = {
  'Children': { en: 'Children', so: 'Carruur' },
  'Women/Girls': { en: 'Women/Girls', so: 'Haween/Gabdho' },
  'Men/Boys': { en: 'Men/Boys', so: 'Rag/Wiilal' },
  'Youth': { en: 'Youth', so: 'Dhallinyaro' },
  'Elders': { en: 'Elders', so: 'Waayeel' }
};

const state = {
  stories: [],
  language: localStorage.getItem(STORAGE_KEYS.language) || 'en',
  theme: localStorage.getItem(STORAGE_KEYS.theme) || 'dark',
  savedIds: JSON.parse(localStorage.getItem(STORAGE_KEYS.saved) || '[]'),
  currentStoryId: null,
  currentImageIndex: 0,
  filters: createEmptyFilters(),
  galleryMode: 'total',
  shareOpen: false,
  savedOpen: false,
  introOpen: true,
  actionMessage: '',
  collageIds: [],
  collageLayout: [],
  landingSectionImages: {},
  landingMap: 'images/landing/map 2.png',
  introSectionIndex: 0,
  autoplayId: null
};

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

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
  close: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>'
};

function createEmptyFilters() {
  return {
    district: '',
    primaryTheme: '',
    secondaryThemes: [],
    people: []
  };
}

function copy() {
  return COPY[state.language];
}

function labelFor(entry) {
  return entry?.[state.language] || entry?.en || '';
}

function actorLabel(key) {
  return labelFor(ACTOR_LABELS[key] || { en: key, so: key });
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getStoryById(id) {
  return state.stories.find((story) => story.id === id) || null;
}

function currentStory() {
  return getStoryById(state.currentStoryId) || state.stories[0] || null;
}

function landingCopy() {
  return LANDING[state.language];
}

function guidanceCopy() {
  return STORY_GUIDANCE[state.language];
}

function isSaved(id) {
  return state.savedIds.includes(id);
}

function savePersistentState() {
  localStorage.setItem(STORAGE_KEYS.language, state.language);
  localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(state.savedIds));
  localStorage.setItem(STORAGE_KEYS.theme, state.theme);
  document.documentElement.lang = state.language === 'so' ? 'so' : 'en';
  document.documentElement.dataset.theme = state.theme;
}


function shuffle(items) {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
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
  for (let i = 1; i <= 6; i += 1) {
    extensions.forEach((ext) => {
      probes.push(`images/landing/${sectionNumber} (${i}).${ext}`);
    });
  }
  const existing = (await Promise.all(probes.map((src) => imageExists(src)))).filter(Boolean);
  const shuffled = shuffle(existing);
  if (shuffled.length > 0) return shuffled[0];
  const fallbackStory = state.stories[Math.floor(Math.random() * state.stories.length)];
  return fallbackStory?.images?.[0] || '';
}

async function loadLandingAssets() {
  const mapSrc = await imageExists('images/landing/map 2.png') || await imageExists('images/landing/sws on somalia map_wrinkle.png') || 'assets/sws-map-wrinkle.png';
  state.landingMap = mapSrc;
  const sections = [1, 3, 4, 5];
  const resolved = await Promise.all(sections.map((section) => loadSectionImage(section)));
  state.landingSectionImages = Object.fromEntries(sections.map((section, index) => [section, resolved[index]]));
}

function syncGalleryCardHeights() {
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

function buildShareUrl(story) {
  const url = new URL(window.location.href);
  url.pathname = `${url.pathname.replace(/[^/]*$/, '')}index.html`;
  url.searchParams.set('code', story.id);
  return url.toString();
}

function updateUrlForStory(story) {
  const url = new URL(window.location.href);
  url.searchParams.set('code', story.id);
  history.replaceState({}, '', url);
}

function hasActiveFilters(filters = state.filters) {
  return Boolean(filters.district || filters.primaryTheme || filters.secondaryThemes.length || filters.people.length);
}

function storyMatchesFilters(story, filters) {
  if (filters.district && story.district.slug !== filters.district) return false;
  if (filters.primaryTheme && story.primaryTheme.slug !== filters.primaryTheme) return false;

  if (filters.secondaryThemes.length > 0) {
    const storyThemeSlugs = [story.primaryTheme.slug, ...story.secondaryThemes.map((theme) => theme.slug)];
    if (!filters.secondaryThemes.some((slug) => storyThemeSlugs.includes(slug))) return false;
  }

  if (filters.people.length > 0 && !filters.people.some((person) => story.actors.includes(person))) return false;
  return true;
}

function filteredStories(filters = state.filters) {
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

function pickRandomRelatedStory(base) {
  const ranked = state.stories
    .map((story) => ({ story, score: scoreRelated(base, story) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score);

  const topScore = ranked[0]?.score ?? 0;
  const strongest = ranked.filter((entry) => entry.score === topScore).map((entry) => entry.story);
  const pool = strongest.length > 0 ? strongest : state.stories.filter((story) => story.id !== base.id);
  return pool[Math.floor(Math.random() * pool.length)] || base;
}

function countForFilters(nextFilters) {
  return state.stories.filter((story) => storyMatchesFilters(story, nextFilters)).length;
}

function storyCountLabel(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function allDistricts() {
  return [...new Map(state.stories.map((story) => [story.district.slug, story.district])).values()];
}

function allPrimaryThemes() {
  return [...new Map(state.stories.map((story) => [story.primaryTheme.slug, story.primaryTheme])).values()];
}

function allSecondaryThemes() {
  return [...new Map(state.stories.flatMap((story) => story.secondaryThemes).map((theme) => [theme.slug, theme])).values()];
}

function allPeople() {
  return [...new Set(state.stories.flatMap((story) => story.actors))];
}

function clearActionMessageSoon() {
  if (!state.actionMessage) return;
  clearTimeout(clearActionMessageSoon.timeoutId);
  clearActionMessageSoon.timeoutId = setTimeout(() => {
    state.actionMessage = '';
    render();
  }, 2200);
}

function setCurrentStory(id, options = {}) {
  const story = getStoryById(id);
  if (!story) return;
  state.currentStoryId = story.id;
  state.currentImageIndex = 0;
  state.shareOpen = false;
  updateUrlForStory(story);
  render();
  if (options.scrollTop) scrollStoryTop();
}

function scrollStoryTop() {
  qs('#story-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollGallery() {
  qs('#gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleSaved(id) {
  if (isSaved(id)) {
    state.savedIds = state.savedIds.filter((savedId) => savedId !== id);
    state.actionMessage = copy().removedMessage;
  } else {
    state.savedIds = [...state.savedIds, id];
    state.actionMessage = copy().savedMessage;
  }
  savePersistentState();
  render();
  clearActionMessageSoon();
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
  return `<button type="button" class="${classes.join(' ')}" data-action="${options.onClick.action}" data-value="${escapeHtml(options.onClick.value || '')}">${content}</button>`;
}

function storyTagChips(story) {
  const chips = [
    renderChip(labelFor(story.district)),
    renderChip(labelFor(story.cluster), { muted: true }),
    renderChip(labelFor(story.primaryTheme))
  ];
  story.secondaryThemes.forEach((theme) => chips.push(renderChip(labelFor(theme), { muted: true })));
  story.actors.forEach((person) => chips.push(renderChip(actorLabel(person), { muted: true })));
  return chips.join('');
}

function renderParagraphBlock(text, className) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('') || `<p class="${className || ''}"></p>`;
}

function storyGalleryHeader() {
  const count = filteredStories().length;
  const t = copy();
  if (state.galleryMode === 'related') return storyCountLabel(count, t.relatedStory, t.relatedStories);
  if (state.galleryMode === 'filtered') return storyCountLabel(count, t.filteredStory, t.filteredStories);
  return storyCountLabel(count, t.totalStory, t.totalStories);
}

function renderFloatingControls() {
  const t = copy();
  return `
    <div class="floating-controls">
      <div class="lang-pill" role="group" aria-label="Language selector">
        <button type="button" class="${state.language === 'so' ? 'is-active' : ''}" data-action="set-language" data-value="so">${escapeHtml(t.shortSo)}</button>
        <button type="button" class="${state.language === 'en' ? 'is-active' : ''}" data-action="set-language" data-value="en">${escapeHtml(t.shortEn)}</button>
      </div>
      <button type="button" class="saved-icon-button" data-action="open-saved" aria-label="${escapeHtml(t.openSaved)}">
        ${icon.bookmark()}
        <span class="saved-count-badge">${state.savedIds.length}</span>
      </button>
    </div>
  `;
}

function renderStageControls(story) {
  const t = copy();
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



function renderIntroModal() {
  if (!state.introOpen) return '';
  const landing = landingCopy();
  const sectionImages = state.landingSectionImages;

  return `
    <div class="intro-modal intro-modal--pdfstyle">
      <div class="intro-scroll intro-scroll--pdfstyle" id="intro-scroll">
        <section class="landing-pdf-section landing-pdf-section--1" data-intro-section>
          <div class="landing-pdf-grid landing-pdf-grid--hero">
            <div class="landing-switch-row landing-switch-row--top">
              <div class="landing-switcher" role="group" aria-label="Language selector">
                <button type="button" class="${state.language === 'so' ? 'is-active' : ''}" data-action="set-language" data-value="so">SO</button>
                <button type="button" class="${state.language === 'en' ? 'is-active' : ''}" data-action="set-language" data-value="en">EN</button>
              </div>
              <div class="landing-switcher" role="group" aria-label="Theme selector">
                <button type="button" class="${state.theme === 'dark' ? 'is-active' : ''}" data-action="set-theme" data-value="dark">${escapeHtml(COPY[state.language].dark)}</button>
                <button type="button" class="${state.theme === 'light' ? 'is-active' : ''}" data-action="set-theme" data-value="light">${escapeHtml(COPY[state.language].light)}</button>
              </div>
            </div>
            <div class="landing-photo-pane landing-photo-pane--hero">
              <img src="${sectionImages[1] || ''}" alt="" loading="eager" aria-hidden="true">
            </div>
            <div class="landing-copy-card landing-copy-card--nexus">
              <p>${escapeHtml(landing.section1Nexus)}</p>
            </div>
            <div class="landing-copy-card landing-copy-card--title">
              <p>${escapeHtml(landing.section1Title)}</p>
            </div>
          </div>
        </section>

        <section class="landing-pdf-section landing-pdf-section--2" data-intro-section>
          <div class="landing-pdf-grid landing-pdf-grid--two-col">
            <div class="landing-map-pane">
              <img src="${state.landingMap}" alt="" loading="eager" aria-hidden="true">
            </div>
            <div class="landing-copy-card landing-copy-card--section2">
              <p>${escapeHtml(landing.section2Body)}</p>
            </div>
          </div>
        </section>

        <section class="landing-pdf-section landing-pdf-section--3" data-intro-section>
          <div class="landing-pdf-grid landing-pdf-grid--questions">
            <div class="landing-photo-pane landing-photo-pane--questions">
              <img src="${sectionImages[3] || ''}" alt="" loading="eager" aria-hidden="true">
            </div>
            <div class="landing-copy-card landing-copy-card--pondered">
              <p>${escapeHtml(landing.section3Lead)}</p>
            </div>
            ${landing.questions.map((question, index) => `<div class="landing-question-card landing-question-card--${index + 1}"><p>${escapeHtml(question)}</p></div>`).join('')}
          </div>
        </section>

        <section class="landing-pdf-section landing-pdf-section--4" data-intro-section>
          <div class="landing-pdf-grid landing-pdf-grid--shared">
            <div class="landing-photo-pane landing-photo-pane--shared">
              <img src="${sectionImages[4] || ''}" alt="" loading="eager" aria-hidden="true">
            </div>
            <div class="landing-copy-card landing-copy-card--section4">
              <p>${escapeHtml(landing.section4Body)}</p>
            </div>
          </div>
        </section>

        <section class="landing-pdf-section landing-pdf-section--5" data-intro-section>
          <div class="landing-pdf-grid landing-pdf-grid--cta">
            <div class="landing-photo-pane landing-photo-pane--cta">
              <img src="${sectionImages[5] || ''}" alt="" loading="eager" aria-hidden="true">
            </div>
            <div class="landing-copy-card landing-copy-card--cta-spacer"></div>
            <div class="landing-copy-card landing-copy-card--section5">
              <p class="landing-cta-copy">${escapeHtml(landing.section5Body)}</p>
              <div class="landing-button-row landing-button-row--pdf">
                <button type="button" class="landing-button" data-action="intro-random">${escapeHtml(landing.surprise)}</button>
                <button type="button" class="landing-button" data-action="intro-explore">${escapeHtml(landing.explore)}</button>
                <button type="button" class="landing-button" data-action="intro-share-own">${escapeHtml(landing.shareOwn)}</button>
              </div>
            </div>
          </div>        </section>
      </div>
    </div>
  `;
}

function renderSavedDrawer() {

  const t = copy();
  const savedStories = state.stories.filter((story) => isSaved(story.id));
  return `
    <aside class="saved-drawer ${state.savedOpen ? 'is-open' : ''}" aria-hidden="${state.savedOpen ? 'false' : 'true'}">
      <div class="drawer-header">
        <div>
          <div class="drawer-title">${escapeHtml(t.saved)}</div>
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
              <div class="saved-summary">${escapeHtml(labelFor(story.summary))}</div>
              <div class="saved-tags">
                ${renderChip(labelFor(story.district), { muted: true })}
                ${renderChip(labelFor(story.primaryTheme))}
              </div>
            </div>
          </button>
        `).join('')}
      </div>
    </aside>
  `;
}

function renderShareModal() {
  const story = currentStory();
  if (!story) return '';
  const t = copy();
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

function renderGuidanceBox() {
  const guidance = guidanceCopy();
  return `
    <div class="story-guidance-box is-compact">
      <p>${escapeHtml(guidance.intro)}</p>
      <ul>
        ${guidance.questions.map((question) => `<li>${escapeHtml(question)}</li>`).join('')}
      </ul>
    </div>
  `;
}

function renderFilterGroup(title, allLabel, items, currentValue, action, isMulti = false) {
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
          count: countForFilters(allCountFilters),
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
            count: countForFilters(nextFilters),
            onClick: { action, value }
          });
        }).join('')}
      </div>
    </section>
  `;
}

function render() {
  const app = qs('#app');
  const story = currentStory();
  if (!app || !story) return;
  const t = copy();
  const galleryStories = filteredStories();
  const districtItems = allDistricts().map((district) => ({ value: district.slug, label: labelFor(district) }));
  const primaryItems = allPrimaryThemes().map((theme) => ({ value: theme.slug, label: labelFor(theme) }));
  const secondaryItems = allSecondaryThemes().map((theme) => ({ value: theme.slug, label: labelFor(theme) }));
  const peopleItems = allPeople().map((person) => ({ value: person, label: actorLabel(person) }));

  const storySlides = story.images.map((src, index) => `
    <div class="story-slide ${index === state.currentImageIndex ? 'is-active' : ''}">
      ${adaptiveImageMarkup(src, story.storyteller, 'contain', 'story-stage-image')}
    </div>
  `).join('');

  app.innerHTML = `
    <div class="site-shell ${state.introOpen ? 'has-intro-open' : ''}">
      ${renderIntroModal()}
      <main>
        <section id="story-top" class="story-stage-shell">
          <div class="story-stage">
            ${renderFloatingControls()}
            <div class="story-slides">${storySlides}</div>
          </div>
          ${renderStageControls(story)}
        </section>

        <section class="story-band">
          <div class="content-wrap narrow">
            ${renderGuidanceBox()}
            <div class="tag-row">${storyTagChips(story)}</div>
            <div class="storyteller-name">${escapeHtml(story.storyteller)}</div>
            <div class="story-copy">${renderParagraphBlock(labelFor(story.story))}</div>
          </div>
        </section>

        <section class="reflection-band">
          <div class="content-wrap narrow">
            <div class="section-kicker">${escapeHtml(t.communityReflections)}</div>
            <div class="reflection-copy">${renderParagraphBlock(labelFor(story.reflection))}</div>
          </div>
        </section>

        <section class="actions-band">
          <div class="content-wrap">
            <div class="actions-row">
              <button type="button" class="action-button ${isSaved(story.id) ? 'is-saved' : ''}" data-action="toggle-save">${icon.bookmark()}<span>${escapeHtml(isSaved(story.id) ? t.saved : t.save)}</span></button>
              <button type="button" class="action-button" data-action="open-share">${icon.share()}<span>${escapeHtml(t.share)}</span></button>
              <button type="button" class="action-button" data-action="random-related">${icon.shuffle()}<span>${escapeHtml(t.relatedRandom)}</span></button>
              <button type="button" class="action-button" data-action="show-related">${icon.related()}<span>${escapeHtml(t.related)}</span></button>
              <button type="button" class="action-button" data-action="explore-all">${icon.sliders()}<span>${escapeHtml(t.explore)}</span></button>
            </div>
            ${state.actionMessage ? `<div class="action-message">${escapeHtml(state.actionMessage)}</div>` : ''}
          </div>
        </section>

        <section id="gallery" class="gallery-band">
          <div class="content-wrap">
            <div class="gallery-header">${escapeHtml(storyGalleryHeader())}</div>
            <div class="gallery-layout">
              <aside class="filter-panel">
                <div class="filter-reset-slot">
                  <button type="button" class="filter-reset ${hasActiveFilters() ? 'is-visible' : ''}" data-action="reset-filters">${escapeHtml(t.reset)}</button>
                </div>
                ${renderFilterGroup(t.district, t.all, districtItems, state.filters.district, 'filter-district')}
                ${renderFilterGroup(t.primaryTheme, t.all, primaryItems, state.filters.primaryTheme, 'filter-primary')}
                ${renderFilterGroup(t.secondaryThemes, t.all, secondaryItems, state.filters.secondaryThemes, 'filter-secondary', true)}
                ${renderFilterGroup(t.people, t.all, peopleItems, state.filters.people, 'filter-people', true)}
              </aside>
              <div class="gallery-grid">
                ${galleryStories.map((item) => `
                  <button type="button" class="gallery-card" data-action="open-story" data-value="${item.id}">
                    <div class="gallery-image-frame">
                      <img class="gallery-image-cover" src="${item.images[0]}" alt="${escapeHtml(item.storyteller)}" loading="lazy">
                    </div>
                    <div class="gallery-card-body">
                      <p class="gallery-summary">${escapeHtml(labelFor(item.summary))}</p>
                      <div class="tag-row small">
                        ${renderChip(labelFor(item.district), { muted: true })}
                        ${renderChip(labelFor(item.cluster), { muted: true })}
                        ${renderChip(labelFor(item.primaryTheme))}
                        ${item.secondaryThemes.map((theme) => renderChip(labelFor(theme), { muted: true })).join('')}
                        ${item.actors.map((person) => renderChip(actorLabel(person), { muted: true })).join('')}
                      </div>
                      ${isSaved(item.id) ? `<div class="saved-marker">${icon.bookmark()}<span>${escapeHtml(t.saved)}</span></div>` : ''}
                    </div>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        </section>
      </main>
      ${renderSavedDrawer()}
      ${renderShareModal()}
    </div>
  `;

  bindEvents();
  startAutoplay();
  requestAnimationFrame(syncGalleryCardHeights);
}


function bindEvents() {
  qsa('[data-action]').forEach((element) => {
    element.addEventListener('click', handleActionClick);
  });

  const introScroll = qs('#intro-scroll');
  if (introScroll) {
    introScroll.addEventListener('scroll', () => {
      const sections = qsa('[data-intro-section]', introScroll);
      if (!sections.length) return;
      const positions = sections.map((section) => Math.abs(section.offsetTop - introScroll.scrollTop));
      state.introSectionIndex = positions.indexOf(Math.min(...positions));
    }, { passive: true });
  }

  const stage = qs('.story-slides');
  if (stage) {
    let touchStartX = null;
    stage.addEventListener('touchstart', (event) => {
      touchStartX = event.touches[0].clientX;
    }, { passive: true });
    stage.addEventListener('touchend', (event) => {
      if (touchStartX == null) return;
      const story = currentStory();
      if (!story) return;
      const diff = touchStartX - event.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        state.currentImageIndex = diff > 0
          ? (state.currentImageIndex + 1) % story.images.length
          : (state.currentImageIndex - 1 + story.images.length) % story.images.length;
        restartAutoplay();
        render();
      }
      touchStartX = null;
    }, { passive: true });
  }
}

async function writeToClipboard(textToCopy) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(textToCopy);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = textToCopy;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

async function handleActionClick(event) {
  const action = event.currentTarget.dataset.action;
  const value = event.currentTarget.dataset.value || '';
  const story = currentStory();
  if (!story && action !== 'set-language' && action !== 'enter-site') return;

  if (action === 'set-language') {
    state.language = value;
    savePersistentState();
    render();
    return;
  }

  if (action === 'set-theme') {
    state.theme = value === 'light' ? 'light' : 'dark';
    savePersistentState();
    render();
    return;
  }

  if (action === 'intro-random') {
    const candidate = state.stories[Math.floor(Math.random() * state.stories.length)] || story;
    if (candidate) state.currentStoryId = candidate.id;
    state.currentImageIndex = 0;
    state.introOpen = false;
    render();
    scrollStoryTop();
    return;
  }

  if (action === 'intro-explore') {
    state.introOpen = false;
    render();
    setTimeout(scrollGallery, 120);
    return;
  }

  if (action === 'intro-share-own') {
    window.location.href = 'mailto:?subject=Photostory submission';
    return;
  }

  if (action === 'intro-scroll-next' || action === 'intro-scroll-prev') {
    const scrollEl = qs('#intro-scroll');
    const sections = qsa('[data-intro-section]', scrollEl);
    if (!scrollEl || sections.length === 0) return;
    const positions = sections.map((section) => Math.abs(section.offsetTop - scrollEl.scrollTop));
    const currentIndex = positions.indexOf(Math.min(...positions));
    const nextIndex = action === 'intro-scroll-next'
      ? Math.min(sections.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);
    sections[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  if (action === 'open-saved') {
    state.savedOpen = !state.savedOpen;
    render();
    return;
  }

  if (action === 'close-saved') {
    state.savedOpen = false;
    render();
    return;
  }

  if (action === 'open-saved-story') {
    state.savedOpen = false;
    setCurrentStory(value, { scrollTop: true });
    return;
  }

  if (action === 'open-share') {
    state.shareOpen = true;
    render();
    return;
  }

  if (action === 'close-share') {
    state.shareOpen = false;
    render();
    return;
  }

  if (action === 'share-copy') {
    await writeToClipboard(buildShareUrl(story));
    state.shareOpen = false;
    state.actionMessage = copy().copied;
    render();
    clearActionMessageSoon();
    return;
  }

  if (action === 'share-facebook') {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(buildShareUrl(story))}`, '_blank', 'noopener,noreferrer');
    state.shareOpen = false;
    render();
    return;
  }

  if (action === 'share-instagram') {
    await writeToClipboard(buildShareUrl(story));
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    state.shareOpen = false;
    state.actionMessage = copy().instagramHint;
    render();
    clearActionMessageSoon();
    return;
  }

  if (action === 'share-x') {
    const shareUrl = buildShareUrl(story);
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`${story.storyteller} - ${labelFor(story.district)}`)}`, '_blank', 'noopener,noreferrer');
    state.shareOpen = false;
    render();
    return;
  }

  if (action === 'share-email') {
    const shareUrl = buildShareUrl(story);
    window.location.href = `mailto:?subject=${encodeURIComponent(`${story.storyteller} - ${labelFor(story.district)}`)}&body=${encodeURIComponent(`${labelFor(story.summary)}\n\n${shareUrl}`)}`;
    state.shareOpen = false;
    render();
    return;
  }

  if (action === 'toggle-save') {
    toggleSaved(story.id);
    return;
  }

  if (action === 'random-related') {
    setCurrentStory(pickRandomRelatedStory(story).id, { scrollTop: true });
    return;
  }

  if (action === 'show-related') {
    state.filters = {
      district: story.district.slug,
      primaryTheme: story.primaryTheme.slug,
      secondaryThemes: story.secondaryThemes.map((theme) => theme.slug),
      people: [...story.actors]
    };
    state.galleryMode = 'related';
    render();
    scrollGallery();
    return;
  }

  if (action === 'explore-all') {
    state.filters = createEmptyFilters();
    state.galleryMode = 'total';
    render();
    scrollGallery();
    return;
  }

  if (action === 'reset-filters') {
    state.filters = createEmptyFilters();
    state.galleryMode = 'total';
    render();
    return;
  }

  if (action === 'filter-district') {
    state.filters.district = state.filters.district === value ? '' : value;
    state.galleryMode = hasActiveFilters() ? 'filtered' : 'total';
    render();
    return;
  }

  if (action === 'filter-district-all') {
    state.filters.district = '';
    state.galleryMode = hasActiveFilters() ? 'filtered' : 'total';
    render();
    return;
  }

  if (action === 'filter-primary') {
    state.filters.primaryTheme = state.filters.primaryTheme === value ? '' : value;
    state.galleryMode = hasActiveFilters() ? 'filtered' : 'total';
    render();
    return;
  }

  if (action === 'filter-primary-all') {
    state.filters.primaryTheme = '';
    state.galleryMode = hasActiveFilters() ? 'filtered' : 'total';
    render();
    return;
  }

  if (action === 'filter-secondary') {
    state.filters.secondaryThemes = state.filters.secondaryThemes.includes(value)
      ? state.filters.secondaryThemes.filter((slug) => slug !== value)
      : [...state.filters.secondaryThemes, value];
    state.galleryMode = hasActiveFilters() ? 'filtered' : 'total';
    render();
    return;
  }

  if (action === 'filter-secondary-all') {
    state.filters.secondaryThemes = [];
    state.galleryMode = hasActiveFilters() ? 'filtered' : 'total';
    render();
    return;
  }

  if (action === 'filter-people') {
    state.filters.people = state.filters.people.includes(value)
      ? state.filters.people.filter((person) => person !== value)
      : [...state.filters.people, value];
    state.galleryMode = hasActiveFilters() ? 'filtered' : 'total';
    render();
    return;
  }

  if (action === 'filter-people-all') {
    state.filters.people = [];
    state.galleryMode = hasActiveFilters() ? 'filtered' : 'total';
    render();
    return;
  }

  if (action === 'open-story') {
    setCurrentStory(value, { scrollTop: true });
    return;
  }

  if (action === 'prev-image') {
    state.currentImageIndex = (state.currentImageIndex - 1 + story.images.length) % story.images.length;
    restartAutoplay();
    render();
    return;
  }

  if (action === 'next-image') {
    state.currentImageIndex = (state.currentImageIndex + 1) % story.images.length;
    restartAutoplay();
    render();
    return;
  }

  if (action === 'go-image') {
    state.currentImageIndex = Number(value) || 0;
    restartAutoplay();
    render();
  }
}

function restartAutoplay() {
  stopAutoplay();
  startAutoplay();
}

function stopAutoplay() {
  if (state.autoplayId) {
    clearInterval(state.autoplayId);
    state.autoplayId = null;
  }
}

function startAutoplay() {
  stopAutoplay();
  const story = currentStory();
  if (state.introOpen || !story || story.images.length <= 1) return;

  state.autoplayId = setInterval(() => {
    state.currentImageIndex = (state.currentImageIndex + 1) % story.images.length;
    qsa('.story-slide').forEach((slide, index) => slide.classList.toggle('is-active', index === state.currentImageIndex));
    qsa('.stage-dot').forEach((dot, index) => dot.classList.toggle('is-active', index === state.currentImageIndex));
  }, 5000);
}


async function initialise() {
  const dataUrl = new URL('../data/stories.json', import.meta.url);
  const response = await fetch(dataUrl);
  const payload = await response.json();
  state.stories = payload.stories || [];
  await loadLandingAssets();

  const code = new URLSearchParams(window.location.search).get('code');
  const existing = getStoryById(code);
  const randomStory = state.stories[Math.floor(Math.random() * state.stories.length)] || null;
  state.currentStoryId = existing?.id || randomStory?.id || null;
  state.introOpen = !existing;
  savePersistentState();
  render();
}


window.addEventListener('resize', () => {
  window.clearTimeout(window.__photostoryResizeTimer);
  window.__photostoryResizeTimer = window.setTimeout(syncGalleryCardHeights, 120);
});

window.addEventListener('beforeunload', stopAutoplay);
initialise().catch((error) => {
  console.error(error);
  const app = qs('#app');
  if (app) app.innerHTML = '<div class="error-state">Failed to load the site data. Check the browser console and verify that data/stories.json and the images folder were published.</div>';
});
