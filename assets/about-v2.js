import { getLandingText, getUiText, STORAGE_KEYS, initialiseI18n } from './content.js';
import { fetchStories } from './api.js?v=20260709-gallery-facets';
import { renderMenu } from './menu.js';

const ABOUT_COPY = {
  en: {
    title: 'About the photostories',
    processIntro: 'In late 2025, 12 community peacebuilders from Baidoa, Barawe and Hudur, across generations and genders, set out with phone cameras to explore how climate change, environmental degradation, conflict and peace shape everyday life.',
    processPhotographed: 'They photographed places, people and moments that spoke to them: signs of hardship, traces of resilience, and glimpses of what communities carry and hope for.',
    processOutreach: 'They reached out to the community members who either appear in the photos or were available nearby. They showed them the photos and listened to their stories and reflections on the photos.',
    sharedPhotos: 'They shared the photos in community spaces of storytelling and dialogue.',
    communityPicked: 'Community members picked photos that resonated with them and shared their own stories and reflections.',
    processFinal: '10 of these community members in each location set out on a similar journey of developing photostories.',
    questionsIntro: 'The taking of the photos and the writing and telling of the stories were guided by these questions:',
    questions: [
      'Why did I choose to take in these photos? Or what do I see in these photos?',
      'What memories or emotions do they awaken in me?',
      'What do I want others to feel and understand?',
      'What community issue or strength do I want to emphasise?',
      'If the issue would be resolved or the strength amplified over the next three years, what would these photos look like?',
      'What cultural and religious wisdom describe the present situation and could inspire us to move towards the imagined future?'
    ],
    exploreIntro: 'There are currently {stories} photostories for you to explore.',
    exploreStoryInfo: 'Each photostory features one or more photos, the story of the photographer-storyteller, and if available: direct reflections from the community members who were associated with the photos or indirect reflections from others. At the end of the story, you can save or share it or explore related photostories.',
    exploreRandomPrefix: 'If you are in the mood for a surprise, ',
    exploreRandomLink: 'see a random photostory',
    exploreRandomMiddle: ' or go back to the ',
    exploreHomeLink: 'homepage',
    exploreRandomSuffix: ' to interact through the carousel of random photostories.',
    exploreGalleryPrefix: 'Or ',
    exploreGalleryLink: 'visit the photostory gallery',
    exploreGalleryMiddle: ' to ',
    exploreSearchLink: 'search for specific words',
    exploreGallerySuffix: ' you have in mind, or combine place, people, and thematic cluster-tags to follow the connections that matter to you. The taxonomy of thematic clusters and tags emerged from workshops with the 12 community peacebuilders.',
    exploreMenuNote: 'The menu in the top-right corner lets you choose other navigation options.'
  },
  so: {
    title: 'Ku saabsan sheeko-sawirrada',
    processIntro: 'Dabayaaqadii 2025, 12 nabad-dhiseyaal bulsho oo ka kala yimid Baydhabo, Baraawe iyo Xudur, kana kala socday jiilal iyo jinsiyo kala duwan, ayaa telefoonno ku qaaday sawirro si ay u sahamiyaan sida isbeddelka cimilada, nabaad-guurka deegaanka, khilaafka iyo nabaddu u qaabeeyaan nolol maalmeedka.',
    processPhotographed: 'Waxay sawireen goobo, dad iyo waqtiyo iyaga la hadlay: calaamado dhibaato, raadad adkaysi, iyo ifafaale muujinaya waxa bulshooyinku xambaarsan yihiin iyo waxa ay rajaynayaan.',
    processOutreach: 'Waxay la xiriireen xubno bulsho oo ka muuqday sawirrada ama markaas ag joogay. Waxay tuseen sawirrada, waxayna dhegeysteen sheekooyinkooda iyo milicsigooda ku saabsan sawirrada.',
    sharedPhotos: 'Waxay sawirrada ku wadaageen goobo bulsho oo sheeko-wadaag iyo wadahadal ah.',
    communityPicked: 'Xubnaha bulshadu waxay doorteen sawirro dareen ku abuuray, waxayna wadaageen sheekooyinkooda iyo milicsigooda.',
    processFinal: '10 xubnood oo bulshada ka mid ah goob kasta ayaa iyaguna galay safar la mid ah oo lagu horumarinayo sheeko-sawirro.',
    questionsIntro: 'Qaadista sawirrada, qorista iyo ka sheekayntooduba waxay raaceen su’aalahan:',
    questions: [
      'Maxaan u doortay in aan sawirradan qaado? Ama maxaan ku arkaa sawirradan?',
      'Xusuuso ama shucuur noocee ah ayay igu kiciyaan?',
      'Maxaan rabaa in dadka kale ay dareemaan oo fahmaan?',
      'Arrin ama awood bulsho noocee ah ayaan rabaa in aan xoogga saaro?',
      'Haddii arrintaas la xalliyo ama awooddaas la xoojiyo saddexda sano ee soo socota, sawirradani sidee bay u ekaan lahaayeen?',
      'Xigmad dhaqameed iyo mid diimeed noocee ah ayaa sharxi karta xaaladda hadda jirta, nagu dhiirrigelinna karta in aan u dhaqaaqno mustaqbalka la qiyaasay?'
    ],
    exploreIntro: 'Hadda waxaa jira {stories} sheeko-sawirro oo aad sahamin karto.',
    exploreStoryInfo: 'Sheeko-sawir kasta wuxuu ka kooban yahay hal ama dhowr sawir, sheekada sawir-qaadaha/sheekeeyaha, iyo haddii la hayo: milicsiyo toos ah oo ka yimid xubnaha bulshada ee sawirrada la xiriiray ama milicsiyo dad kale ka yimid. Dhammaadka sheekada, waad kaydin kartaa, la wadaagi kartaa, ama sahamin kartaa sheeko-sawirro la xiriira.',
    exploreRandomPrefix: 'Haddii aad rabto wax lama-filaan ah, ',
    exploreRandomLink: 'fur sheeko-sawir aan kala sooc lahayn',
    exploreRandomMiddle: ' ama ku noqo ',
    exploreHomeLink: 'bogga hore',
    exploreRandomSuffix: ' si aad ula falgasho carousel-ka sheeko-sawirrada aan kala sooc lahayn.',
    exploreGalleryPrefix: 'Ama waxaad ',
    exploreGalleryLink: 'booqan kartaa galbeedka sheeko-sawirrada',
    exploreGalleryMiddle: ' si aad u ',
    exploreSearchLink: 'raadiso erayo gaar ah',
    exploreGallerySuffix: ' oo maskaxdaada ku jira, ama aad isugu darto goob, dad, iyo cluster-tags si aad u raacdo xiriirrada adiga kuu muuqda. Taxonomy-ga cluster-yada iyo tags-ku wuxuu ka soo baxay aqoon-isweydaarsiyo lala yeeshay 12-ka nabad-dhise bulsho.',
    exploreMenuNote: 'Menu-ga ku yaal geeska midig ee kore wuxuu kuu oggolaanayaa xulashooyin kale oo navigation ah.'
  }
};

const ABOUT_IMAGE_SETS = {
  shir0: ['images/shir0 (1).jpg', 'images/shir0 (2).jpg', 'images/shir0 (3).jpg', 'images/shir0 (4).jpg', 'images/shir0 (5).jpg'],
  shir1: ['images/shir1 (1).jpg', 'images/shir1 (5).JPG', 'images/shir1 (6).jpg', 'images/shir1 (7).jpg', 'images/shir1 (8).jpg'],
  shir2: ['images/shir2 (1).JPG', 'images/shir2 (2).jpg', 'images/shir2 (3).jpg', 'images/shir2 (4).jpg', 'images/shir2 (5).jpg', 'images/shir2 (6).jpg', 'images/shir2 (7).jpg', 'images/shir2 (8).jpg', 'images/shir2 (9).JPG', 'images/shir2 (10).JPG'],
  shir3: ['images/shir3 (1).JPG', 'images/shir3 (2).JPG', 'images/shir3 (3).JPG', 'images/shir3 (4).jpg', 'images/shir3 (5).JPG', 'images/shir3 (6).JPG', 'images/shir3 (7).JPG', 'images/shir3 (8).JPG', 'images/shir3 (9).JPG', 'images/shir3 (10).JPG']
};

const FIXED_IMAGES = {
  map: 'images/map.png',
  process1: 'images/process1.png',
  process2: 'images/process2.png',
  process3: 'images/process3.png',
  process4: 'images/process4.png'
};

const ABOUT_CAROUSEL_INTERVAL_MS = 7000;
let aboutCarouselTimer = null;

const state = {
  language: localStorage.getItem(STORAGE_KEYS.language) || 'en',
  theme: localStorage.getItem(STORAGE_KEYS.theme) || 'dark',
  stories: [],
  menuOpen: false,
  savedOpen: false,
  savedIds: [],
  siteStats: { stories: null, reflections: null }
};

try {
  state.savedIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.saved) || '[]').map(String);
} catch {}

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

function countReflections(stories = []) {
  return stories.reduce((total, story) => total + Number(story.reflectionCount || (story.reflection?.en || story.reflection?.so ? 1 : 0)), 0);
}

function randomStoryLink(basePath = '../stories/') {
  const story = state.stories[Math.floor(Math.random() * state.stories.length)];
  if (!story) return `${basePath}#gallery`;
  return `${basePath}?code=${encodeURIComponent(story.code || story.id)}`;
}

function renderContextStrips(landing) {
  const nexusLines = landing.section1NexusLines || [];
  const titleLines = landing.section1TitleLines || [];
  return `
    <div class="context-strip context-strip--top context-strip--nexus" aria-hidden="true">${nexusLines.map((line) => `<span>${escapeHtml(line)}</span>`).join('')}</div>
    <div class="context-strip context-strip--bottom context-strip--title" aria-hidden="true">${titleLines.map((line) => `<span>${escapeHtml(line)}</span>`).join('')}</div>
  `;
}

function pageImage(src, alt = '', eager = false) {
  if (!src) return '';
  return eager
    ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="eager" fetchpriority="high" decoding="async">`
    : `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">`;
}

function renderImagePanel(src, modifier = '', eager = false) {
  return `
    <div class="about-v2-image ${modifier}" style="--about-image-url: url('${escapeHtml(src)}')">
      ${pageImage(src, '', eager)}
    </div>
  `;
}

function renderCarouselPanel(images = [], key = '', modifier = '', eager = false) {
  const slides = images.filter(Boolean);
  if (slides.length <= 1) return renderImagePanel(slides[0] || '', modifier, eager);

  return `
    <div class="about-v2-image ${modifier} about-v2-carousel" data-about-carousel="${escapeHtml(key)}" style="--about-image-url: url('${escapeHtml(slides[0])}')">
      ${slides.map((src, index) => `
        <img
          class="about-v2-carousel-image ${index === 0 ? 'is-active' : ''}"
          src="${escapeHtml(src)}"
          alt=""
          loading="${eager && index === 0 ? 'eager' : 'lazy'}"
          ${eager && index === 0 ? 'fetchpriority="high"' : ''}
          decoding="async"
        >
      `).join('')}
      <div class="about-carousel-progress" aria-hidden="true">
        ${slides.map((_, index) => `<span class="${index === 0 ? 'is-active' : ''}"></span>`).join('')}
      </div>
    </div>
  `;
}

function renderProcessStep(text, image, index) {
  return `
    <article class="about-process-step about-process-step--${index}">
      <div class="about-process-copy"><p>${escapeHtml(text)}</p></div>
      ${renderImagePanel(image, 'about-v2-image--process')}
    </article>
  `;
}

function renderExploreGuide(copy) {
  const stories = state.siteStats.stories == null ? '...' : String(state.siteStats.stories);
  const randomLink = randomStoryLink('../stories/');
  const homeLink = '../';
  const searchLink = '../stories/?focus=search#gallery';

  return `
    <div class="about-guide-copy">
      <div class="about-guide-column">
        <p>${escapeHtml(copy.exploreIntro.replace('{stories}', stories))}</p>
        <p>${escapeHtml(copy.exploreStoryInfo)}</p>
      </div>
      <div class="about-guide-column">
        <p>${escapeHtml(copy.exploreRandomPrefix)}<a href="${escapeHtml(randomLink)}">${escapeHtml(copy.exploreRandomLink)}</a>${escapeHtml(copy.exploreRandomMiddle)}<a href="${escapeHtml(homeLink)}">${escapeHtml(copy.exploreHomeLink)}</a>${escapeHtml(copy.exploreRandomSuffix)}</p>
        <p>${escapeHtml(copy.exploreGalleryPrefix)}${escapeHtml(copy.exploreGalleryLink)}${escapeHtml(copy.exploreGalleryMiddle)}<a href="${escapeHtml(searchLink)}">${escapeHtml(copy.exploreSearchLink)}</a>${escapeHtml(copy.exploreGallerySuffix)}</p>
        <p>${escapeHtml(copy.exploreMenuNote)}</p>
      </div>
    </div>
  `;
}

const closeIcon = () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

function renderSavedDrawer(t) {
  const savedStories = state.stories.filter((s) => state.savedIds.includes(String(s.id)));
  return `
    ${state.savedOpen ? `<button type="button" class="saved-drawer-backdrop is-open" data-action="close-saved" aria-label="${escapeHtml(t.close)}"></button>` : ''}
    <aside class="saved-drawer ${state.savedOpen ? 'is-open' : ''}" aria-hidden="${!state.savedOpen}">
      <div class="drawer-header drawer-header--inline">
        <div class="drawer-title-row">
          <button type="button" class="icon-button drawer-close-button" data-action="close-saved">${closeIcon()}</button>
          <div class="drawer-title">${escapeHtml(t.savedPhotostories)}</div>
        </div>
      </div>
      <div class="drawer-body">
        ${savedStories.length === 0
          ? `<div class="drawer-empty">${escapeHtml(t.noSaved)}</div>`
          : savedStories.map((s) => `
            <div class="saved-item">
              <a class="saved-item-main" href="../stories/?code=${escapeHtml(s.id)}">
                <div class="saved-thumb"><img src="${escapeHtml(s.images?.[0] || '')}" alt="${escapeHtml(s.storyteller)}"></div>
                <div class="saved-copy">
                  <div class="saved-name">${escapeHtml(s.storyteller)}</div>
                  <div class="saved-summary">${escapeHtml(s.summary?.[state.language] || s.summary?.en || '')}</div>
                </div>
              </a>
              <button type="button" class="saved-remove-button" data-action="remove-saved" data-value="${escapeHtml(s.id)}" aria-label="${escapeHtml(t.close)}">${closeIcon()}</button>
            </div>`).join('')}
      </div>
    </aside>
  `;
}

function renderMenuForAbout(t) {
  return renderMenu(state, {
    esc: escapeHtml,
    t,
    basePaths: { home: '../', about: './', stories: '../stories/' },
    savedCount: state.savedIds.length,
    savedAction: 'open-saved'
  });
}

function renderLoading() {
  saveState();
  const app = document.querySelector('#app');
  if (!app) return;
  const loadingText = state.language === 'so' ? 'Bogga waa la raraya...' : 'Loading...';
  app.innerHTML = `<div class="intro-modal landing-page-shell"><div class="loading-state loading-state--page"><span class="loading-spinner" aria-hidden="true"></span><span>${escapeHtml(loadingText)}</span></div></div>`;
}

function renderLandingPage() {
  saveState();
  const app = document.querySelector('#app');
  if (!app) return;

  const landing = getLandingText(state.language);
  const t = getUiText(state.language);
  const copy = ABOUT_COPY[state.language] || ABOUT_COPY.en;
  document.title = `${t.about} - ${t.siteTitle}`;

  app.innerHTML = `
    <div class="intro-modal intro-modal--pdfstyle landing-page-shell about-v2-shell">
      ${renderMenuForAbout(t)}
      ${renderSavedDrawer(t)}
      <main class="about-v2-scroll" id="about-main">
        <section class="about-v2-section about-v2-section--intro">
          <div class="about-v2-grid about-v2-grid--intro">
            ${renderImagePanel(FIXED_IMAGES.map, 'about-v2-image--map', true)}
            <div class="about-title-panel"><h1>${escapeHtml(copy.title)}</h1></div>
            ${renderContextStrips(landing)}
          </div>
        </section>

        <section class="about-v2-section about-v2-section--process">
          <div class="about-process-grid">
            ${renderProcessStep(copy.processIntro, FIXED_IMAGES.process1, 1)}
            ${renderProcessStep(copy.processPhotographed, FIXED_IMAGES.process2, 2)}
            ${renderProcessStep(copy.processOutreach, FIXED_IMAGES.process3, 3)}
          </div>
        </section>

        <section class="about-v2-section about-v2-section--full-image">
          ${renderCarouselPanel(ABOUT_IMAGE_SETS.shir0, 'shir0', 'about-v2-image--full', true)}
        </section>

        <section class="about-v2-section about-v2-section--two-col">
          <div class="about-v2-grid about-v2-grid--two-col">
            ${renderCarouselPanel(ABOUT_IMAGE_SETS.shir1, 'shir1', 'about-v2-image--story')}
            <div class="about-copy-panel about-copy-panel--shared"><p>${escapeHtml(copy.sharedPhotos)}</p></div>
          </div>
        </section>

        <section class="about-v2-section about-v2-section--two-col">
          <div class="about-v2-grid about-v2-grid--two-col about-v2-grid--reverse">
            <div class="about-copy-panel about-copy-panel--community"><p>${escapeHtml(copy.communityPicked)}</p></div>
            ${renderCarouselPanel(ABOUT_IMAGE_SETS.shir2, 'shir2', 'about-v2-image--story')}
          </div>
        </section>

        <section class="about-v2-section about-v2-section--two-col">
          <div class="about-v2-grid about-v2-grid--two-col">
            ${renderImagePanel(FIXED_IMAGES.process4, 'about-v2-image--story')}
            <div class="about-copy-panel about-copy-panel--final"><p>${escapeHtml(copy.processFinal)}</p></div>
          </div>
        </section>

        <section class="about-v2-section about-v2-section--questions">
          <div class="about-question-shell">
            <p class="about-question-intro">${escapeHtml(copy.questionsIntro)}</p>
            <div class="about-question-grid">
              ${copy.questions.map((question) => `<p>${escapeHtml(question)}</p>`).join('')}
            </div>
          </div>
        </section>

        <section class="about-v2-section about-v2-section--full-image about-v2-section--final-image">
          ${renderCarouselPanel(ABOUT_IMAGE_SETS.shir3, 'shir3', 'about-v2-image--full', true)}
        </section>

        <section class="about-v2-section about-v2-section--guide">
          ${renderExploreGuide(copy)}
        </section>
      </main>
    </div>
  `;

  startAboutCarousels();
}

function startAboutCarousels() {
  if (aboutCarouselTimer) {
    window.clearInterval(aboutCarouselTimer);
    aboutCarouselTimer = null;
  }

  const carousels = Array.from(document.querySelectorAll('[data-about-carousel]'));
  if (!carousels.length) return;

  aboutCarouselTimer = window.setInterval(() => {
    document.querySelectorAll('[data-about-carousel]').forEach((carousel) => {
      const slides = Array.from(carousel.querySelectorAll('.about-v2-carousel-image'));
      const bars = Array.from(carousel.querySelectorAll('.about-carousel-progress span'));
      if (slides.length < 2) return;

      const currentIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
      const nextIndex = (currentIndex + 1) % slides.length;
      slides[currentIndex]?.classList.remove('is-active');
      bars[currentIndex]?.classList.remove('is-active');
      slides[nextIndex]?.classList.add('is-active');
      bars[nextIndex]?.classList.add('is-active');
      carousel.style.setProperty('--about-image-url', `url('${slides[nextIndex].getAttribute('src') || ''}')`);
    });
  }, ABOUT_CAROUSEL_INTERVAL_MS);
}

function attachListeners() {
  document.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    if (target.dataset.action === 'toggle-menu') {
      state.menuOpen = !state.menuOpen;
      renderLandingPage();
      return;
    }
    if (target.dataset.action === 'close-menu') {
      state.menuOpen = false;
      renderLandingPage();
      return;
    }
    if (target.dataset.action === 'open-saved') {
      state.menuOpen = false;
      state.savedOpen = true;
      renderLandingPage();
      return;
    }
    if (target.dataset.action === 'close-saved') {
      state.savedOpen = false;
      renderLandingPage();
      return;
    }
    if (target.dataset.action === 'remove-saved') {
      state.savedIds = state.savedIds.filter((id) => String(id) !== String(target.dataset.value));
      localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(state.savedIds.map(String)));
      renderLandingPage();
      return;
    }
    if (target.dataset.action === 'set-language') {
      state.language = target.dataset.value === 'so' ? 'so' : 'en';
      state.menuOpen = false;
      await initialiseI18n(state.language);
      renderLandingPage();
      return;
    }
    if (target.dataset.action === 'set-theme') {
      state.theme = target.dataset.value === 'light' ? 'light' : 'dark';
      state.menuOpen = false;
      renderLandingPage();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (state.savedOpen) {
        state.savedOpen = false;
        renderLandingPage();
      } else if (state.menuOpen) {
        state.menuOpen = false;
        renderLandingPage();
      }
    }
  });
}

async function init() {
  attachListeners();
  renderLoading();
  await initialiseI18n(state.language);
  renderLandingPage();

  fetchStories()
    .then((stories) => {
      state.stories = stories;
      state.siteStats = {
        stories: stories.length,
        reflections: countReflections(stories)
      };
      renderLandingPage();
    })
    .catch((error) => console.warn('Could not load story stats', error));
}

init().catch((error) => {
  console.error(error);
  const app = document.querySelector('#app');
  if (app) app.innerHTML = '<div class="error-state">Failed to load. Check the browser console and verify Supabase configuration.</div>';
});
