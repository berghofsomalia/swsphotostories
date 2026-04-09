
const STORIES = [
  {
    "id": "bd01",
    "code": "BD01",
    "title": "Low Lying Settlement",
    "storyteller": "Hodan",
    "district": "Baidoa",
    "location": "Low-lying settlement",
    "primaryTheme": "Flooding",
    "secondaryThemes": [
      "Displacement",
      "Recovery"
    ],
    "actors": [
      "Children",
      "Women/Girls",
      "Men/Boys"
    ],
    "images": [
      "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1505236738415-61f8f90b8d69?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1600&q=80"
    ],
    "story": "Families describe how floodwater changed movement, work, and daily routines.",
    "reflection": "In Baidoa, this story links flooding with displacement and recovery."
  },
  {
    "id": "hd01",
    "code": "HD01",
    "title": "Pastoral Route",
    "storyteller": "Asha",
    "district": "Hudur",
    "location": "Pastoral route",
    "primaryTheme": "Drought",
    "secondaryThemes": [
      "Mobility",
      "Water Access"
    ],
    "actors": [
      "Women/Girls",
      "Children"
    ],
    "images": [
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1600&q=80"
    ],
    "story": "Longer journeys for water and pasture have become part of one family’s daily story.",
    "reflection": "In Hudur, this story links drought with mobility and water access."
  },
  {
    "id": "bw01",
    "code": "BW01",
    "title": "Shared Courtyard",
    "storyteller": "Sahra",
    "district": "Barawe",
    "location": "Shared courtyard",
    "primaryTheme": "Care Work",
    "secondaryThemes": [
      "Shared Space"
    ],
    "actors": [
      "Women/Girls",
      "Children"
    ],
    "images": [
      "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1600&q=80"
    ],
    "story": "A shared courtyard becomes a place where care, negotiation, and repeated repair are visible.",
    "reflection": "In Barawe, this story links care work with shared space."
  },
  {
    "id": "bw02",
    "code": "BW02",
    "title": "Shoreline",
    "storyteller": "Mahad",
    "district": "Barawe",
    "location": "Shoreline",
    "primaryTheme": "Fishing",
    "secondaryThemes": [
      "Weather",
      "Coast"
    ],
    "actors": [
      "Men/Boys"
    ],
    "images": [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1600&q=80"
    ],
    "story": "The shoreline becomes both workplace and waiting room, with weather shaping what is possible each day.",
    "reflection": "In Barawe, this story links fishing with weather and coast."
  },
  {
    "id": "bd02",
    "code": "BD02",
    "title": "Water Point",
    "storyteller": "Ifrah",
    "district": "Baidoa",
    "location": "Water point",
    "primaryTheme": "Water Access",
    "secondaryThemes": [
      "Care Work",
      "Routine"
    ],
    "actors": [
      "Women/Girls",
      "Children"
    ],
    "images": [
      "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1517022812141-23620dba5c23?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1600&q=80"
    ],
    "story": "Access to water shapes the whole day, from early routines to the shared weight of care work.",
    "reflection": "In Baidoa, this story links water access with care work and routine."
  },
  {
    "id": "hd02",
    "code": "HD02",
    "title": "Farm Plot",
    "storyteller": "Abdi",
    "district": "Hudur",
    "location": "Farm plot",
    "primaryTheme": "Agriculture",
    "secondaryThemes": [
      "Rain Timing",
      "Harvest"
    ],
    "actors": [
      "Men/Boys"
    ],
    "images": [
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80"
    ],
    "story": "Planting decisions and hope for rain turn this into a story about timing, memory, and uncertainty.",
    "reflection": "In Hudur, this story links agriculture with rain timing and harvest."
  },
  {
    "id": "bd03",
    "code": "BD03",
    "title": "River Edge",
    "storyteller": "Nasro",
    "district": "Baidoa",
    "location": "River edge",
    "primaryTheme": "Flooding",
    "secondaryThemes": [
      "Weather"
    ],
    "actors": [
      "Children",
      "Women/Girls",
      "Men/Boys"
    ],
    "images": [
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80"
    ],
    "story": "Rising water and unstable weather force families to keep rethinking what safety looks like.",
    "reflection": "In Baidoa, this story links flooding with weather."
  },
  {
    "id": "bw03",
    "code": "BW03",
    "title": "Landing Site",
    "storyteller": "Yusuf",
    "district": "Barawe",
    "location": "Landing site",
    "primaryTheme": "Fishing",
    "secondaryThemes": [
      "Coast",
      "Weather"
    ],
    "actors": [
      "Men/Boys",
      "Youth"
    ],
    "images": [
      "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80"
    ],
    "story": "Work on the coast moves between risk, waiting, and hope shaped by the sea and the weather.",
    "reflection": "In Barawe, this story links fishing with coast and weather."
  },
  {
    "id": "hd03",
    "code": "HD03",
    "title": "Dry Grazing Land",
    "storyteller": "Hawo",
    "district": "Hudur",
    "location": "Dry grazing land",
    "primaryTheme": "Drought",
    "secondaryThemes": [
      "Mobility"
    ],
    "actors": [
      "Children",
      "Women/Girls",
      "Men/Boys"
    ],
    "images": [
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80"
    ],
    "story": "As grazing land dries out, families find themselves living through constant movement and planning.",
    "reflection": "In Hudur, this story links drought with mobility."
  },
  {
    "id": "bd04",
    "code": "BD04",
    "title": "Neighbourhood Lane",
    "storyteller": "Luul",
    "district": "Baidoa",
    "location": "Neighbourhood lane",
    "primaryTheme": "Shared Space",
    "secondaryThemes": [
      "Routine"
    ],
    "actors": [
      "Children",
      "Women/Girls",
      "Men/Boys"
    ],
    "images": [
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1600&q=80"
    ],
    "story": "Small lanes and shared spaces reveal how everyday life ties people together.",
    "reflection": "In Baidoa, this story links shared space with routine."
  },
  {
    "id": "hd04",
    "code": "HD04",
    "title": "Field Edge",
    "storyteller": "Maryan",
    "district": "Hudur",
    "location": "Field edge",
    "primaryTheme": "Agriculture",
    "secondaryThemes": [
      "Harvest"
    ],
    "actors": [
      "Women/Girls",
      "Men/Boys"
    ],
    "images": [
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1600&q=80"
    ],
    "story": "The farming season combines hard work, waiting, and hope tied to the harvest.",
    "reflection": "In Hudur, this story links agriculture with harvest."
  },
  {
    "id": "bw04",
    "code": "BW04",
    "title": "Homes Near Shore",
    "storyteller": "Fadumo",
    "district": "Barawe",
    "location": "Homes near shore",
    "primaryTheme": "Coast",
    "secondaryThemes": [
      "Displacement"
    ],
    "actors": [
      "Women/Girls",
      "Children"
    ],
    "images": [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80"
    ],
    "story": "Homes near the coast show how belonging and risk can exist side by side.",
    "reflection": "In Barawe, this story links coast with displacement."
  },
  {
    "id": "bd05",
    "code": "BD05",
    "title": "Water Queue",
    "storyteller": "Rahma",
    "district": "Baidoa",
    "location": "Water queue",
    "primaryTheme": "Water Access",
    "secondaryThemes": [
      "Routine"
    ],
    "actors": [
      "Women/Girls"
    ],
    "images": [
      "https://images.unsplash.com/photo-1517022812141-23620dba5c23?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1600&q=80"
    ],
    "story": "Water queues become a portrait of time, patience, and labour that often goes unseen.",
    "reflection": "In Baidoa, this story links water access with routine."
  },
  {
    "id": "hd05",
    "code": "HD05",
    "title": "Seasonal Track",
    "storyteller": "Khadar",
    "district": "Hudur",
    "location": "Seasonal track",
    "primaryTheme": "Rain Timing",
    "secondaryThemes": [
      "Mobility"
    ],
    "actors": [
      "Youth",
      "Men/Boys"
    ],
    "images": [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1600&q=80"
    ],
    "story": "Rain timing and travel decisions become tightly linked forces shaping daily life.",
    "reflection": "In Hudur, this story links rain timing with mobility."
  },
  {
    "id": "bw05",
    "code": "BW05",
    "title": "Boat Repair Area",
    "storyteller": "Salim",
    "district": "Barawe",
    "location": "Boat repair area",
    "primaryTheme": "Fishing",
    "secondaryThemes": [
      "Recovery"
    ],
    "actors": [
      "Youth",
      "Men/Boys"
    ],
    "images": [
      "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80"
    ],
    "story": "Boat repair turns this into a story about recovery, skill, and preparation.",
    "reflection": "In Barawe, this story links fishing with recovery."
  },
  {
    "id": "bd06",
    "code": "BD06",
    "title": "Meeting Shade",
    "storyteller": "Deqa",
    "district": "Baidoa",
    "location": "Meeting shade",
    "primaryTheme": "Shared Space",
    "secondaryThemes": [
      "Care Work"
    ],
    "actors": [
      "Women/Girls",
      "Elders"
    ],
    "images": [
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1600&q=80"
    ],
    "story": "Meeting spaces reveal consultation, care, and the sharing of both burdens and ideas.",
    "reflection": "In Baidoa, this story links shared space with care work."
  }
];

const CLUSTERS = {
  Baidoa: { en: 'Bay cluster', so: 'Kutlada Bay' },
  Hudur: { en: 'Bakool cluster', so: 'Kutlada Bakool' },
  Barawe: { en: 'Coastal cluster', so: 'Kutlada xeebta' }
};

const LABELS_SO = {
  Flooding: 'Daadad',
  Displacement: 'Barakac',
  Recovery: 'Soo kabasho',
  Drought: 'Abaar',
  Mobility: 'Dhaqdhaqaaq',
  'Water Access': 'Helitaanka biyaha',
  'Care Work': 'Shaqada daryeelka',
  'Shared Space': 'Goob wadaag',
  Fishing: 'Kalluumaysi',
  Weather: 'Cimilo',
  Coast: 'Xeeb',
  Agriculture: 'Beeraha',
  'Rain Timing': 'Wakhtiga roobka',
  Harvest: 'Goosasho',
  Routine: 'Jadwal maalinle',
  Children: 'Carruur',
  'Women/Girls': 'Haween/Gabdho',
  'Men/Boys': 'Rag/Wiilal',
  Youth: 'Dhallinyaro',
  Elders: 'Waayeel'
};

const UI = {
  en: {
    english: 'English',
    somaali: 'Soomaali',
    savedList: 'Saved',
    save: 'Save',
    saved: 'Saved',
    share: 'Share',
    random: 'See a random related story',
    related: 'See related stories',
    explore: 'Explore stories through filters',
    communityReflections: 'COMMUNITY REFLECTIONS',
    reset: 'Reset all filters',
    district: 'District',
    primaryTheme: 'Primary theme',
    secondaryThemes: 'Secondary themes',
    actors: 'People',
    all: 'All',
    copied: 'Link copied to clipboard',
    savedMessage: 'Story saved',
    removedMessage: 'Story removed from saved list',
    sharePanelTitle: 'Share this story',
    copyLink: 'Copy link',
    facebook: 'Facebook',
    instagram: 'Instagram',
    x: 'X',
    email: 'Email',
    instagramHint: 'Link copied for Instagram',
    storySingular: 'story',
    storyPlural: 'stories',
    totalSuffix: 'in total',
    noSaved: 'You have not saved any stories yet.',
    emptyFiltered: 'No stories match the current filters.'
  },
  so: {
    english: 'Af Ingiriis',
    somaali: 'Soomaali',
    savedList: 'Kaydsan',
    save: 'Kaydi',
    saved: 'La keydiyey',
    share: 'La wadaag',
    random: 'Arag sheeko la xidhiidha oo aan kala sooc lahayn',
    related: 'Arag sheekooyin la xidhiidha',
    explore: 'Ku sahamin sheekooyinka shaandhooyinka',
    communityReflections: 'ARAGTIYO BULSHO',
    reset: 'Nadiifi shaandhooyinka',
    district: 'Degmo',
    primaryTheme: 'Mawduuca koowaad',
    secondaryThemes: 'Mawduucyo kale',
    actors: 'Dadka',
    all: 'Dhammaan',
    copied: 'Xidhiidhka waa la koobiyey',
    savedMessage: 'Sheekada waa la keydiyey',
    removedMessage: 'Sheekada waa laga saaray kaydka',
    sharePanelTitle: 'La wadaag sheekadan',
    copyLink: 'Koobiyee xidhiidhka',
    facebook: 'Facebook',
    instagram: 'Instagram',
    x: 'X',
    email: 'Iimayl',
    instagramHint: 'Xidhiidhka ayaa loo koobiyey Instagram',
    storySingular: 'sheeko',
    storyPlural: 'sheekooyin',
    totalSuffix: 'guud ahaan',
    noSaved: 'Weli ma kaydin wax sheeko ah.',
    emptyFiltered: 'Ma jiraan sheekooyin u dhigma shaandhooyinka hadda.'
  }
};

const LANDING_UI = {
  en: {
    titleLines: [
      'Photostories from',
      'Southwest State, Somalia',
      'on the nexus of climate change, environment, conflict and peace'
    ],
    photos: 'photos',
    stories: 'stories',
    reflections: 'reflections',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    random: 'See a random photostory',
    explore: 'Explore photostories by themes and locations'
  },
  so: {
    titleLines: [
      'Sawir-sheekooyin ka yimid',
      'Koonfur Galbeed Soomaaliya',
      'ee ku saabsan isgoyska isbeddelka cimilada, deegaanka, colaadda iyo nabadda'
    ],
    photos: 'sawir',
    stories: 'sheeko',
    reflections: 'falcelin',
    theme: 'Muuqaal',
    light: 'Iftiin',
    dark: 'Madow',
    random: 'Arag sawir-sheeko aan kala sooc lahayn',
    explore: 'Sahami sawir-sheekooyinka mawduucyo iyo goobo ahaan'
  }
};

const state = {
  language: localStorage.getItem('photostory-language') || 'en',
  theme: localStorage.getItem('photostory-theme') || 'dark',
  filters: { district: '', primaryTheme: '', secondaryThemes: [], actors: [] },
  galleryMode: 'total',
  savedIds: JSON.parse(localStorage.getItem('photostory-saved') || '[]'),
  shareOpen: false,
  savedOpen: false,
  introOpen: true,
  currentStory: null,
  currentImageIndex: 0,
  actionMessage: '',
  autoTimer: null,
  introImages: []
};

const app = document.getElementById('app');

function translateLabel(value) {
  return state.language === 'so' ? (LABELS_SO[value] || value) : value;
}

function getClusterLabel(district) {
  return CLUSTERS[district] ? CLUSTERS[district][state.language] : district;
}

function storyMatchesFilters(story, filters = state.filters) {
  if (filters.district && story.district !== filters.district) return false;
  if (filters.primaryTheme && story.primaryTheme !== filters.primaryTheme) return false;
  if (filters.secondaryThemes.length) {
    const ok = story.secondaryThemes.some((theme) => filters.secondaryThemes.includes(theme)) || filters.secondaryThemes.includes(story.primaryTheme);
    if (!ok) return false;
  }
  if (filters.actors.length && !story.actors.some((actor) => filters.actors.includes(actor))) return false;
  return true;
}

function hasActiveFilters(filters = state.filters) {
  return Boolean(filters.district || filters.primaryTheme || filters.secondaryThemes.length || filters.actors.length);
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function findStoryFromSearch() {
  const code = new URLSearchParams(window.location.search).get('code');
  if (!code) return null;
  return STORIES.find((story) => story.code.toLowerCase() === code.toLowerCase()) || null;
}

function scoreRelated(base, candidate) {
  let score = 0;
  if (base.id === candidate.id) return -1;
  if (base.primaryTheme === candidate.primaryTheme) score += 5;
  score += candidate.secondaryThemes.filter((theme) => theme === base.primaryTheme).length * 3;
  score += base.secondaryThemes.filter((theme) => candidate.secondaryThemes.includes(theme)).length * 2;
  score += base.actors.filter((actor) => candidate.actors.includes(actor)).length * 2;
  if (base.district === candidate.district) score += 1;
  return score;
}

function pickRandomStory(excludeId) {
  const pool = STORIES.filter((story) => story.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)] || STORIES[0];
}

function pickRandomRelatedStory(current) {
  const ranked = STORIES.map((story) => ({ story, score: scoreRelated(current, story) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score);
  const topScore = ranked[0]?.score ?? 0;
  const strongest = ranked.filter((entry) => entry.score === topScore).map((entry) => entry.story);
  return strongest[Math.floor(Math.random() * strongest.length)] || pickRandomStory(current.id);
}

function getStoryParagraphs(story) {
  return [
    `${story.storyteller} describes ${story.location} in ${story.district} as a place where ordinary routines are read through ${story.primaryTheme.toLowerCase()}. ${story.story} The account stays close to what can be seen and repeated: paths walked, time spent waiting, work that starts early, and the small adjustments people make when conditions shift. It reads less like an event report and more like a steady record of how place shapes behaviour across the day.`,
    `What stands out is how the story keeps returning to rhythm. People notice when the ground is firmer, when water is closer, when the air changes, when someone arrives to help, and when a task suddenly takes twice as long as before. These details make the wider issue legible without forcing it into abstract language. ${story.storyteller} keeps the focus on what families actually do, how they respond together, and what they carry from one day into the next.`,
    `The social dimension is equally present. ${story.actors.join(', ')} appear not as labels but as people whose responsibilities overlap in visible ways. A queue, a field edge, a landing site, or a shared lane becomes a space where care, labour, waiting, and judgement meet. The story suggests that daily life is organised through negotiation as much as necessity, and that these places hold memory as well as pressure.`,
    `For test reading, the longer version helps show how the layout behaves when the text expands. It also makes clear that ${story.primaryTheme.toLowerCase()} rarely sits alone. In this account it moves alongside ${story.secondaryThemes.join(' and ').toLowerCase()}, giving the reader a fuller sense of how one concern spills into another. The result is calm in tone, but dense enough to test spacing, scrolling, and visual hierarchy on the page.`
  ];
}

function getReflectionParagraphs(story) {
  return [
    `This reflection stays simple on purpose. The story can be read first through ${story.primaryTheme.toLowerCase()}, because that is the strongest organising thread in the material and the one that gives the scene its overall shape. The place, the pace, and the repeated acts described by ${story.storyteller} all point back to that central condition without needing a separate heading to explain it.`,
    `The secondary themes help widen the reading without becoming a second taxonomy wall. ${story.secondaryThemes.join(' and ')} sit close to the surface, adding context rather than competing with the main line. They show how one issue is rarely isolated in practice. Instead, the story reveals a layered situation in which place, movement, repair, waiting, and care touch each other in quiet but persistent ways.`,
    `The actor layer also matters here. By keeping ${story.actors.join(', ')} visible as tags rather than turning them into a dominant frame, the interface can remain human without becoming crowded. Readers get a quick sense of who is most present in the account, while still being invited to read the story as a textured local experience rather than a technical case. That balance feels useful for browsing and comparison.`,
    `In the page flow, this section works as a soft bridge between the fuller first-person account and the gallery below. It translates the story into a set of connected signals that can drive related-story logic and filter behaviour. For testing, the longer paragraphs make it easier to judge spacing, cadence, and contrast, while still keeping the language plain and editorial rather than academic.`
  ];
}

function storyCountLabel(count) {
  const t = UI[state.language];
  const word = count === 1 ? t.storySingular : t.storyPlural;
  if (state.galleryMode === 'related') return `${count} ${count === 1 ? (state.language === 'so' ? 'sheeko la xidhiidha' : 'related story') : (state.language === 'so' ? 'sheekooyin la xidhiidha' : 'related stories')}`;
  if (state.galleryMode === 'filtered') return `${count} ${count === 1 ? (state.language === 'so' ? 'sheeko la shaandheeyey' : 'filtered story') : (state.language === 'so' ? 'sheekooyin la shaandheeyey' : 'filtered stories')}`;
  return `${count} ${word} ${t.totalSuffix}`;
}

function icon(type) {
  const map = {
    photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5.5-5.5L7 19"/></svg>',
    story: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3z"/><path d="M5 4v16a3 3 0 0 1 3-3h11"/></svg>',
    reflection: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M6 4h12v17l-6-4-6 4z"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.7 10.7 15.3 6.3M8.7 13.3l6.6 4.4"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="m16 3 5 5-5 5"/><path d="M4 20 15 9"/><path d="M21 16v5h-5"/><path d="M15 15 4 4"/></svg>',
    related: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 1 1 7 7L17 13"/><path d="M14 11a5 5 0 0 1 0 7L12.5 19.5a5 5 0 1 1-7-7L7 11"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 7h16"/><path d="M7 12h10"/><path d="M10 17h4"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>'
  };
  return map[type] || '';
}

function setLanguage(language) {
  state.language = language;
  localStorage.setItem('photostory-language', language);
  render();
}

function setTheme(theme) {
  state.theme = theme;
  localStorage.setItem('photostory-theme', theme);
  document.body.dataset.theme = theme;
  render();
}

function setMessage(text) {
  state.actionMessage = text;
  render();
  clearTimeout(state._msgTimer);
  state._msgTimer = setTimeout(() => {
    state.actionMessage = '';
    render();
  }, 2200);
}

function toggleSaveCurrent() {
  const t = UI[state.language];
  if (state.savedIds.includes(state.currentStory.id)) {
    state.savedIds = state.savedIds.filter((id) => id !== state.currentStory.id);
    setMessage(t.removedMessage);
  } else {
    state.savedIds = [...state.savedIds, state.currentStory.id];
    setMessage(t.savedMessage);
  }
  localStorage.setItem('photostory-saved', JSON.stringify(state.savedIds));
  render();
}

function getShareUrl(story = state.currentStory) {
  const url = new URL(window.location.href);
  url.searchParams.set('code', story.code);
  return url.toString();
}

async function copyLink(message) {
  try {
    await navigator.clipboard.writeText(getShareUrl());
    setMessage(message || UI[state.language].copied);
  } catch (err) {
    console.error(err);
  }
}

function openStory(story, opts = {scroll: true}) {
  state.currentStory = story;
  state.currentImageIndex = 0;
  state.shareOpen = false;
  history.replaceState(null, '', `?code=${story.code}`);
  render();
  if (opts.scroll !== false) {
    document.getElementById('story-top')?.scrollIntoView({behavior: 'smooth', block: 'start'});
  }
}

function applyStoryFilters(story) {
  state.filters = {
    district: story.district,
    primaryTheme: story.primaryTheme,
    secondaryThemes: story.secondaryThemes.slice(0, 2),
    actors: [...story.actors]
  };
  state.galleryMode = 'related';
  render();
}

function dismissIntro() {
  state.introOpen = false;
  document.body.classList.remove('no-scroll');
  startCarousel();
  render();
}

function startCarousel() {
  clearInterval(state.autoTimer);
  if (state.introOpen) return;
  state.autoTimer = setInterval(() => {
    state.currentImageIndex = (state.currentImageIndex + 1) % state.currentStory.images.length;
    updateStageImage();
  }, 5000);
}

function updateStageImage() {
  const images = document.querySelectorAll('.stage-image');
  const dots = document.querySelectorAll('.dot');
  images.forEach((img, index) => img.classList.toggle('active', index === state.currentImageIndex));
  dots.forEach((dot, index) => dot.classList.toggle('active', index === state.currentImageIndex));
}

function countForFilters(nextFilters) {
  return STORIES.filter((story) => storyMatchesFilters(story, nextFilters)).length;
}

function filterChip(label, active, onClick, count, muted = true) {
  return `<button class="chip interactive ${active ? 'active' : (muted ? 'muted' : '')}" data-click="${onClick}">${label} <span class="count">${count}</span></button>`;
}

function renderLanding() {
  if (!state.introOpen) return '';
  const landing = LANDING_UI[state.language];
  const langDark = state.theme === 'dark';
  return `
  <section class="landing" id="landing">
    <div class="landing-grid">
      <div class="landing-collage">
        ${state.introImages.map((src) => `<div><img src="${src}" alt=""></div>`).join('')}
      </div>
      <div class="landing-panel-wrap">
        <div class="landing-panel">
          <div class="landing-panel-inner">
            <h1 class="landing-title">
              <span>${landing.titleLines[0]}</span>
              <span>${landing.titleLines[1]}</span>
              <span class="small-line">${landing.titleLines[2]}</span>
            </h1>

            <div class="landing-stats">
              <span class="stat-item">${icon('photo')}<span><strong>1000+</strong> ${landing.photos}</span></span>
              <span class="sep">|</span>
              <span class="stat-item">${icon('story')}<span><strong>350+</strong> ${landing.stories}</span></span>
              <span class="sep">|</span>
              <span class="stat-item">${icon('reflection')}<span><strong>150+</strong> ${landing.reflections}</span></span>
            </div>

            <div class="controls-row">
              <div class="pill-switch lang">
                <button class="${state.language === 'so' ? 'active' : ''}" data-action="set-lang" data-value="so">SO</button>
                <button class="${state.language === 'en' ? 'active' : ''}" data-action="set-lang" data-value="en">EN</button>
              </div>

              <div class="pill-switch theme compact-label">
                <span class="switch-label">${landing.theme}</span>
                <button class="${state.theme === 'light' ? 'active' : ''}" data-action="set-theme" data-value="light">${landing.light}</button>
                <button class="${state.theme === 'dark' ? 'active' : ''}" data-action="set-theme" data-value="dark">${landing.dark}</button>
              </div>
            </div>

            <div class="button-row">
              <button class="button button-accent" data-action="intro-random">${landing.random}</button>
              <button class="button button-accent" data-action="intro-explore">${landing.explore}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

function renderStage() {
  return `
  <section class="story-stage" id="story-top">
    ${state.currentStory.images.map((src, index) => `<img class="stage-image ${index === state.currentImageIndex ? 'active' : ''}" src="${src}" alt="${state.currentStory.storyteller}">`).join('')}
    <div class="stage-overlay"></div>
    <div class="floating-controls">
      <div class="top-pill">
        <button class="${state.language === 'so' ? 'active' : ''}" data-action="set-lang" data-value="so">SO</button>
        <button class="${state.language === 'en' ? 'active' : ''}" data-action="set-lang" data-value="en">EN</button>
      </div>
      <button class="saved-pill" data-action="open-saved" aria-label="${UI[state.language].savedList}">
        ${icon('bookmark')}
        <span class="badge">${state.savedIds.length}</span>
      </button>
    </div>

    <div class="stage-controls">
      <button class="circle-icon" data-action="prev-image" aria-label="Previous image">${icon('left')}</button>
      <div class="dots">
        ${state.currentStory.images.map((_, index) => `<button class="dot ${index === state.currentImageIndex ? 'active' : ''}" data-action="go-image" data-value="${index}"></button>`).join('')}
      </div>
      <button class="circle-icon" data-action="next-image" aria-label="Next image">${icon('right')}</button>
    </div>
  </section>`;
}

function renderStorySection() {
  const paragraphs = getStoryParagraphs(state.currentStory).map((p) => `<p>${p}</p>`).join('');
  return `
  <section class="story-copy">
    <div class="story-shell">
      <div class="tag-row">
        <span class="chip">${state.currentStory.district}</span>
        <span class="chip muted">${getClusterLabel(state.currentStory.district)}</span>
        <span class="chip">${translateLabel(state.currentStory.primaryTheme)}</span>
        ${state.currentStory.secondaryThemes.map((theme) => `<span class="chip muted">${translateLabel(theme)}</span>`).join('')}
        ${state.currentStory.actors.map((actor) => `<span class="chip muted">${translateLabel(actor)}</span>`).join('')}
      </div>
      <div class="storyteller">${state.currentStory.storyteller}</div>
      <div class="copy-block">${paragraphs}</div>
    </div>
  </section>`;
}

function renderReflectionSection() {
  const paragraphs = getReflectionParagraphs(state.currentStory).map((p) => `<p>${p}</p>`).join('');
  return `
  <section class="reflection-copy">
    <div class="story-shell">
      <div class="section-label">${UI[state.language].communityReflections}</div>
      <div class="reflection-text">${paragraphs}</div>
    </div>
  </section>`;
}

function renderActions() {
  const t = UI[state.language];
  return `
  <section class="actions-band">
    <div class="shell">
      <div class="actions-row">
        <button class="button button-soft" data-action="toggle-save">${icon('bookmark')} <span>${state.savedIds.includes(state.currentStory.id) ? t.saved : t.save}</span></button>
        <button class="button button-soft" data-action="open-share">${icon('share')} <span>${t.share}</span></button>
        <button class="button button-soft" data-action="random-related">${icon('shuffle')} <span>${t.random}</span></button>
        <button class="button button-outline" data-action="see-related">${icon('related')} <span>${t.related}</span></button>
        <button class="button button-soft" data-action="explore-gallery">${icon('filter')} <span>${t.explore}</span></button>
      </div>
      ${state.actionMessage ? `<div class="notice">${state.actionMessage}</div>` : ''}
    </div>
  </section>`;
}

function galleryHeaderText(displayed) {
  return storyCountLabel(displayed.length);
}

function renderGallery() {
  const t = UI[state.language];
  const displayed = STORIES.filter((story) => storyMatchesFilters(story));
  const districts = [...new Set(STORIES.map((story) => story.district))];
  const primaryThemes = [...new Set(STORIES.map((story) => story.primaryTheme))];
  const secondaryThemes = [...new Set(STORIES.flatMap((story) => story.secondaryThemes))];
  const actors = [...new Set(STORIES.flatMap((story) => story.actors))];

  return `
  <section class="gallery-band" id="gallery">
    <div class="shell">
      <div class="gallery-header">${galleryHeaderText(displayed)}</div>
      <div class="gallery-layout">
        <aside class="filter-panel">
          <div class="filter-reset-slot">
            <button class="button button-soft" style="${hasActiveFilters() ? '' : 'visibility:hidden; pointer-events:none;'} width:100%;" data-action="reset-filters">${t.reset}</button>
          </div>

          <div class="filter-group">
            <div class="filter-title">${t.district}</div>
            <div class="tag-row">
              ${filterChip(t.all, !state.filters.district, 'set-district:', countForFilters({...state.filters, district: ''}), true)}
              ${districts.map((item) => filterChip(item, state.filters.district === item, `set-district:${item}`, countForFilters({...state.filters, district: item}), true)).join('')}
            </div>
          </div>

          <div class="filter-group">
            <div class="filter-title">${t.primaryTheme}</div>
            <div class="tag-row">
              ${filterChip(t.all, !state.filters.primaryTheme, 'set-primary:', countForFilters({...state.filters, primaryTheme: ''}), true)}
              ${primaryThemes.map((item) => filterChip(translateLabel(item), state.filters.primaryTheme === item, `set-primary:${item}`, countForFilters({...state.filters, primaryTheme: item}), true)).join('')}
            </div>
          </div>

          <div class="filter-group">
            <div class="filter-title">${t.secondaryThemes}</div>
            <div class="tag-row">
              ${filterChip(t.all, state.filters.secondaryThemes.length === 0, 'clear-secondary', countForFilters({...state.filters, secondaryThemes: []}), true)}
              ${secondaryThemes.map((item) => {
                const next = state.filters.secondaryThemes.includes(item)
                  ? state.filters.secondaryThemes
                  : [...state.filters.secondaryThemes, item];
                return filterChip(translateLabel(item), state.filters.secondaryThemes.includes(item), `toggle-secondary:${item}`, countForFilters({...state.filters, secondaryThemes: next}), true);
              }).join('')}
            </div>
          </div>

          <div class="filter-group">
            <div class="filter-title">${t.actors}</div>
            <div class="tag-row">
              ${filterChip(t.all, state.filters.actors.length === 0, 'clear-actors', countForFilters({...state.filters, actors: []}), true)}
              ${actors.map((item) => {
                const next = state.filters.actors.includes(item)
                  ? state.filters.actors
                  : [...state.filters.actors, item];
                return filterChip(translateLabel(item), state.filters.actors.includes(item), `toggle-actor:${item}`, countForFilters({...state.filters, actors: next}), true);
              }).join('')}
            </div>
          </div>
        </aside>

        <div>
          ${displayed.length ? `
          <div class="gallery-grid">
            ${displayed.map((story) => `
              <article class="card" data-action="open-story" data-id="${story.id}">
                <div class="card-media"><img src="${story.images[0]}" alt="${story.storyteller}"></div>
                <div class="card-body">
                  <div class="card-summary">${story.story}</div>
                  <div class="tag-row">
                    <span class="chip muted">${story.district}</span>
                    <span class="chip muted">${getClusterLabel(story.district)}</span>
                    <span class="chip">${translateLabel(story.primaryTheme)}</span>
                    ${story.secondaryThemes.map((theme) => `<span class="chip muted">${translateLabel(theme)}</span>`).join('')}
                    ${story.actors.map((actor) => `<span class="chip muted">${translateLabel(actor)}</span>`).join('')}
                  </div>
                  ${state.savedIds.includes(story.id) ? `<div class="saved-flag">${icon('bookmark')} ${t.saved}</div>` : ''}
                </div>
              </article>
            `).join('')}
          </div>` : `<div class="notice">${t.emptyFiltered}</div>`}
        </div>
      </div>
    </div>
  </section>`;
}

function renderSavedDrawer() {
  if (!state.savedOpen) return '';
  const t = UI[state.language];
  const savedStories = STORIES.filter((story) => state.savedIds.includes(story.id));
  return `
    <div class="drawer-backdrop" data-action="close-saved">
      <aside class="saved-drawer" onclick="event.stopPropagation()">
        <div class="drawer-header">
          <div>
            <div class="drawer-title">${t.savedList}</div>
            <div class="drawer-subtitle">${savedStories.length} ${savedStories.length === 1 ? t.storySingular : t.storyPlural}</div>
          </div>
          <button class="circle-icon" data-action="close-saved">${icon('close')}</button>
        </div>
        <div class="drawer-list">
          ${savedStories.length ? savedStories.map((story) => `
            <article class="drawer-card" data-action="open-story-from-drawer" data-id="${story.id}">
              <div class="drawer-thumb"><img src="${story.images[0]}" alt="${story.storyteller}"></div>
              <div>
                <div class="storyteller" style="margin-top:0">${story.storyteller}</div>
                <div class="card-summary" style="min-height:auto">${story.story}</div>
              </div>
            </article>
          `).join('') : `<div class="notice">${t.noSaved}</div>`}
        </div>
      </aside>
    </div>
  `;
}

function renderSharePanel() {
  if (!state.shareOpen) return '';
  const t = UI[state.language];
  return `
    <div class="share-backdrop" data-action="close-share">
      <div class="share-panel" onclick="event.stopPropagation()">
        <div class="drawer-header" style="padding:0 0 .25rem;border:0;">
          <div class="drawer-title">${t.sharePanelTitle}</div>
          <button class="circle-icon" data-action="close-share">${icon('close')}</button>
        </div>
        <div class="share-grid">
          <button class="share-btn" data-action="copy-link">${icon('copy')}<span>${t.copyLink}</span></button>
          <button class="share-btn" data-action="share-facebook">${icon('facebook') || 'f'}<span>${t.facebook}</span></button>
          <button class="share-btn" data-action="share-instagram">◎<span>${t.instagram}</span></button>
          <button class="share-btn" data-action="share-x">𝕏<span>${t.x}</span></button>
          <button class="share-btn" data-action="share-email">${icon('mail')}<span>${t.email}</span></button>
        </div>
      </div>
    </div>
  `;
}

function render() {
  document.body.dataset.theme = state.theme;
  document.body.classList.toggle('no-scroll', state.introOpen);
  app.innerHTML = `
    <div class="app">
      ${renderLanding()}
      ${renderStage()}
      ${renderStorySection()}
      ${renderReflectionSection()}
      ${renderActions()}
      ${renderGallery()}
      ${renderSavedDrawer()}
      ${renderSharePanel()}
    </div>
  `;
  bindEvents();
  updateStageImage();
}

function bindEvents() {
  app.querySelectorAll('[data-action], [data-click]').forEach((node) => {
    node.addEventListener('click', (event) => {
      const el = event.currentTarget;
      const action = el.dataset.action || el.dataset.click;
      if (!action) return;
      handleAction(action, el.dataset.value, el.dataset.id);
    });
  });

  const stage = document.querySelector('.story-stage');
  if (stage) {
    let startX = null;
    stage.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      if (startX == null) return;
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) handleAction('next-image');
        else handleAction('prev-image');
      }
      startX = null;
    }, { passive: true });
  }
}

function handleAction(action, value, id) {
  switch (action) {
    case 'set-lang': setLanguage(value); break;
    case 'set-theme': setTheme(value); break;
    case 'intro-random':
      dismissIntro();
      document.getElementById('story-top')?.scrollIntoView({behavior:'smooth', block:'start'});
      break;
    case 'intro-explore':
      dismissIntro();
      setTimeout(() => document.getElementById('gallery')?.scrollIntoView({behavior:'smooth', block:'start'}), 120);
      break;
    case 'open-saved': state.savedOpen = true; render(); break;
    case 'close-saved': state.savedOpen = false; render(); break;
    case 'open-share': state.shareOpen = true; render(); break;
    case 'close-share': state.shareOpen = false; render(); break;
    case 'toggle-save': toggleSaveCurrent(); break;
    case 'prev-image':
      state.currentImageIndex = (state.currentImageIndex - 1 + state.currentStory.images.length) % state.currentStory.images.length;
      updateStageImage();
      break;
    case 'next-image':
      state.currentImageIndex = (state.currentImageIndex + 1) % state.currentStory.images.length;
      updateStageImage();
      break;
    case 'go-image':
      state.currentImageIndex = Number(value || 0);
      updateStageImage();
      break;
    case 'random-related':
      openStory(pickRandomRelatedStory(state.currentStory));
      break;
    case 'see-related':
      applyStoryFilters(state.currentStory);
      document.getElementById('gallery')?.scrollIntoView({behavior:'smooth', block:'start'});
      break;
    case 'explore-gallery':
      state.filters = { district: '', primaryTheme: '', secondaryThemes: [], actors: [] };
      state.galleryMode = 'total';
      render();
      document.getElementById('gallery')?.scrollIntoView({behavior:'smooth', block:'start'});
      break;
    case 'open-story':
    case 'open-story-from-drawer': {
      const story = STORIES.find((item) => item.id === id);
      if (story) {
        state.savedOpen = false;
        openStory(story);
      }
      break;
    }
    case 'reset-filters':
      state.filters = { district: '', primaryTheme: '', secondaryThemes: [], actors: [] };
      state.galleryMode = 'total';
      render();
      break;
    case 'clear-secondary':
      state.filters.secondaryThemes = [];
      state.galleryMode = hasActiveFilters() ? 'filtered' : 'total';
      render();
      break;
    case 'clear-actors':
      state.filters.actors = [];
      state.galleryMode = hasActiveFilters() ? 'filtered' : 'total';
      render();
      break;
    case 'copy-link':
      copyLink(UI[state.language].copied);
      state.shareOpen = false;
      render();
      break;
    case 'share-facebook': {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`, '_blank', 'noopener,noreferrer');
      break;
    }
    case 'share-instagram':
      copyLink(UI[state.language].instagramHint);
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
      state.shareOpen = false;
      render();
      break;
    case 'share-x': {
      const txt = `${state.currentStory.storyteller} - ${state.currentStory.district}`;
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(txt)}`, '_blank', 'noopener,noreferrer');
      break;
    }
    case 'share-email': {
      const subject = `${state.currentStory.storyteller} - ${state.currentStory.district}`;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(state.currentStory.story + '\n\n' + getShareUrl())}`;
      state.shareOpen = false;
      render();
      break;
    }
    default:
      if (action.startsWith('set-district:')) {
        const district = action.split(':')[1] || '';
        state.filters.district = district;
        state.galleryMode = hasActiveFilters() ? 'filtered' : 'total';
        render();
      } else if (action.startsWith('set-primary:')) {
        const theme = action.split(':')[1] || '';
        state.filters.primaryTheme = theme;
        state.galleryMode = hasActiveFilters() ? 'filtered' : 'total';
        render();
      } else if (action.startsWith('toggle-secondary:')) {
        const theme = action.split(':')[1];
        if (state.filters.secondaryThemes.includes(theme)) {
          state.filters.secondaryThemes = state.filters.secondaryThemes.filter((item) => item !== theme);
        } else {
          state.filters.secondaryThemes = [...state.filters.secondaryThemes, theme];
        }
        state.galleryMode = hasActiveFilters() ? 'filtered' : 'total';
        render();
      } else if (action.startsWith('toggle-actor:')) {
        const actor = action.split(':')[1];
        if (state.filters.actors.includes(actor)) {
          state.filters.actors = state.filters.actors.filter((item) => item !== actor);
        } else {
          state.filters.actors = [...state.filters.actors, actor];
        }
        state.galleryMode = hasActiveFilters() ? 'filtered' : 'total';
        render();
      }
  }
}

function init() {
  const shared = findStoryFromSearch();
  state.currentStory = shared || STORIES[Math.floor(Math.random() * STORIES.length)];
  state.introOpen = !shared;
  state.introImages = shuffle(STORIES.map((story) => story.images[0])).slice(0, 16);
  document.body.dataset.theme = state.theme;
  render();
  if (!state.introOpen) startCarousel();
}

init();
