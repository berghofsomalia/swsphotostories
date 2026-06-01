import { getSupabaseClient, isSupabaseConfigured } from './supabase-client.js';
import {
  SUPABASE_STORY_PHOTO_BUCKET,
  USE_SUPABASE_IMAGES
} from './supabase-config.js';

const app = document.getElementById('admin-app');

const ADMIN_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);

const DISTRICT_CODE_PREFIXES = {
  baidoa: 'BD',
  baydhabo: 'BD',
  barawe: 'BW',
  baraawe: 'BW',
  barawy: 'BW',
  hudur: 'HD',
  xudur: 'HD',
  xuddur: 'HD'
};

const REFLECTION_TYPES = [
  { value: 'direct', label: 'Direct' },
  { value: 'indirect', label: 'Indirect' }
];

const state = {
  supabase: null,
  session: null,
  user: null,
  adminProfile: null,
  stories: [],
  districts: [],
  clusters: [],
  editorMode: 'overview',
  activeStoryId: null,
  selectedTagIds: new Set(),
  editorDistrictId: null,
  newCodeKind: 'standard',
  formDraft: {},
  searchQuery: '',
  statusFilter: 'all',
  districtFilter: 'all',
  busy: false,
  message: '',
  error: '',
  adminAccessChecked: false,
  adminAccessLoading: false,
  authCheckVersion: 0,
  hasUnsavedChanges: false,
  pendingNavigation: null,
  storyImages: {},
  storyImageLoading: new Set(),
  storyImageErrors: {},
  overviewImageAuditLoading: false,
  overviewImageAuditError: '',
  selectedImagePath: null,
  pendingImageDelete: null,
  sidebarScrollTop: 0
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeRegExp(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normaliseText(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed || null;
}

function normaliseReflectionType(value) {
  const type = String(value || '').trim().toLowerCase();
  return REFLECTION_TYPES.some((option) => option.value === type) ? type : null;
}

function labelFor(record, language = 'en') {
  if (!record) return '';
  if (language === 'so') return record.label_so || record.so || record.label_en || record.en || record.slug || '';
  return record.label_en || record.en || record.label_so || record.so || record.slug || '';
}

function storyDistrict(story) {
  return state.districts.find((district) => Number(district.id) === Number(story.district_id)) || story.districts || null;
}

function storyReflections(story) {
  return (story?.community_reflections || [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || Number(a.id) - Number(b.id));
}

function storyTagIds(story) {
  return new Set((story?.story_tags || []).map((row) => Number(row.tag_id)).filter(Boolean));
}

function getActiveStory() {
  return state.stories.find((story) => Number(story.id) === Number(state.activeStoryId)) || null;
}

function findStoryByIdentifier(identifier) {
  return state.stories.find((item) => (
    Number(item.id) === Number(identifier)
    || String(item.code || '').toLowerCase() === String(identifier || '').toLowerCase()
  )) || null;
}

function isCreatingStory() {
  return state.editorMode === 'create';
}

function resetEditorDraft() {
  state.formDraft = {};
}

function showOverview() {
  state.editorMode = 'overview';
  state.activeStoryId = null;
  state.selectedTagIds = new Set();
  state.editorDistrictId = null;
  state.newCodeKind = 'standard';
  state.selectedImagePath = null;
  resetEditorDraft();
  markClean();
}

function startNewStory() {
  state.editorMode = 'create';
  state.activeStoryId = null;
  state.selectedTagIds = new Set();
  state.editorDistrictId = null;
  state.newCodeKind = 'standard';
  state.selectedImagePath = null;
  resetEditorDraft();
  markClean();
}

function setActiveStory(storyId) {
  const story = findStoryByIdentifier(storyId);
  if (!story) {
    showOverview();
    return;
  }

  state.activeStoryId = Number(story.id);
  state.editorMode = 'edit';
  state.selectedTagIds = storyTagIds(story);
  state.editorDistrictId = story.district_id ? Number(story.district_id) : null;
  state.newCodeKind = 'standard';
  state.selectedImagePath = null;
  resetEditorDraft();
  markClean();
}

function normaliseNavigationRequest(request = {}) {
  if (request.type === 'new-story') return { type: 'new-story' };
  if (request.type === 'select-story') {
    const story = findStoryByIdentifier(request.id || request.code);
    if (story) return { type: 'select-story', id: story.id, code: story.code };
    if (request.id || request.code) return { type: 'select-story', id: request.id || request.code, code: request.code || request.id };
    return { type: 'overview' };
  }
  return { type: 'overview' };
}

function navigationRequestFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const story = params.get('story');
  if (story) return normaliseNavigationRequest({ type: 'select-story', id: story });
  if (params.get('new') === 'story') return { type: 'new-story' };
  return { type: 'overview' };
}

function navigationRequestFromState() {
  if (state.editorMode === 'create') return { type: 'new-story' };
  if (state.editorMode === 'edit') {
    const story = getActiveStory();
    if (story) return { type: 'select-story', id: story.id, code: story.code };
  }
  return { type: 'overview' };
}

function adminUrlForNavigation(request = {}) {
  const route = normaliseNavigationRequest(request);
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';

  if (route.type === 'new-story') {
    url.searchParams.set('new', 'story');
  } else if (route.type === 'select-story') {
    url.searchParams.set('story', route.code || route.id);
  }

  return url;
}

function syncAdminHistory(request = navigationRequestFromState(), mode = 'push') {
  const route = normaliseNavigationRequest(request);
  const url = adminUrlForNavigation(route);
  const nextHref = `${url.pathname}${url.search}${url.hash}`;
  const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const method = mode === 'replace' || nextHref === currentHref ? 'replaceState' : 'pushState';
  window.history[method]({ adminRoute: route }, '', url);
}

function setMessage(message = '', error = '') {
  state.message = message;
  state.error = error;
}

function markDirty() {
  state.hasUnsavedChanges = true;
}

function markClean() {
  state.hasUnsavedChanges = false;
}

function captureFormDraft() {
  const form = app.querySelector('form[data-form="story-editor"]');
  if (!form) return;

  const draft = {};
  for (const [key, value] of new FormData(form).entries()) {
    draft[key] = value;
  }
  state.formDraft = draft;
}

function draftValue(name, fallback = '') {
  return Object.prototype.hasOwnProperty.call(state.formDraft, name)
    ? state.formDraft[name]
    : fallback;
}

function selectedDistrictId() {
  const drafted = draftValue('district_id', state.editorDistrictId || '');
  return drafted ? Number(drafted) : null;
}

function districtPrefix(district) {
  if (!district) return '';
  const candidates = [district.slug, district.label_en, district.label_so]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);

  for (const candidate of candidates) {
    if (DISTRICT_CODE_PREFIXES[candidate]) return DISTRICT_CODE_PREFIXES[candidate];
  }

  return '';
}

function nextCodeForPrefix(prefix, community = false) {
  if (!prefix) return '';
  const escapedPrefix = escapeRegExp(prefix);
  const pattern = community
    ? new RegExp(`^${escapedPrefix}CM(\\d+)$`, 'i')
    : new RegExp(`^${escapedPrefix}(\\d+)$`, 'i');

  const maxNumber = state.stories.reduce((max, story) => {
    const match = String(story.code || '').trim().match(pattern);
    if (!match) return max;
    const number = Number(match[1]);
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);

  const nextNumber = String(maxNumber + 1).padStart(2, '0');
  return community ? `${prefix}CM${nextNumber}` : `${prefix}${nextNumber}`;
}

function getNewCodeOptions(districtId = selectedDistrictId()) {
  const district = state.districts.find((item) => Number(item.id) === Number(districtId));
  const prefix = districtPrefix(district);
  if (!prefix) return [];

  return [
    {
      kind: 'standard',
      code: nextCodeForPrefix(prefix, false),
      title: 'Story',
      note: `${prefix}XX`
    },
    {
      kind: 'community',
      code: nextCodeForPrefix(prefix, true),
      title: 'Community story',
      note: `${prefix}CMXX`
    }
  ];
}

function cleanStorageFiles(files = []) {
  return files
    .filter((file) => file?.name && !file.name.startsWith('.'))
    .filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ADMIN_IMAGE_EXTENSIONS.has(ext);
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
}

function buildPlaceholderSlides(code = 'NEW') {
  return [1, 2, 3, 4].map((number) => ({
    type: 'placeholder',
    code,
    caption: `Placeholder ${number}`
  }));
}

async function loadStoryImages(code, options = {}) {
  const { silent = false } = options;
  if (!USE_SUPABASE_IMAGES || !state.supabase || !code) return;
  if (Array.isArray(state.storyImages[code]) || state.storyImageLoading.has(code)) return;

  state.storyImageLoading.add(code);
  delete state.storyImageErrors[code];

  const { data, error } = await state.supabase.storage
    .from(SUPABASE_STORY_PHOTO_BUCKET)
    .list(code, {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' }
    });

  state.storyImageLoading.delete(code);

  if (error) {
    console.warn(`Could not load admin photos for ${code}`, error);
    state.storyImages[code] = [];
    state.storyImageErrors[code] = error.message || 'Could not load photos.';
    if (!silent) render();
    return;
  }

  state.storyImages[code] = cleanStorageFiles(data).map((file) => {
    const path = `${code}/${file.name}`;
    const { data: urlData } = state.supabase.storage
      .from(SUPABASE_STORY_PHOTO_BUCKET)
      .getPublicUrl(path);

    return {
      type: 'image',
      name: file.name,
      path,
      url: urlData.publicUrl
    };
  });

  if (!silent) render();
}

function ensureActiveStoryImages() {
  const story = getActiveStory();
  if (!story?.code || !USE_SUPABASE_IMAGES) return;
  loadStoryImages(story.code);
}

async function ensureOverviewImageAudit() {
  if (state.editorMode !== 'overview') return;
  if (!USE_SUPABASE_IMAGES || !state.supabase || state.overviewImageAuditLoading) return;

  const pendingCodes = state.stories
    .map((story) => String(story.code || '').trim())
    .filter(Boolean)
    .filter((code) => !Array.isArray(state.storyImages[code]) && !state.storyImageLoading.has(code));

  if (!pendingCodes.length) return;

  state.overviewImageAuditLoading = true;
  state.overviewImageAuditError = '';
  render();

  try {
    const batchSize = 8;
    for (let index = 0; index < pendingCodes.length; index += batchSize) {
      await Promise.all(
        pendingCodes
          .slice(index, index + batchSize)
          .map((code) => loadStoryImages(code, { silent: true }))
      );
    }
  } catch (error) {
    console.warn('Could not complete image audit', error);
    state.overviewImageAuditError = error?.message || 'Could not complete image audit.';
  } finally {
    state.overviewImageAuditLoading = false;
    render();
  }
}

function filteredStories() {
  const query = state.searchQuery.trim().toLowerCase();

  return state.stories.filter((story) => {
    if (state.statusFilter !== 'all' && story.status !== state.statusFilter) return false;
    if (state.districtFilter !== 'all' && Number(story.district_id) !== Number(state.districtFilter)) return false;
    if (!query) return true;

    const haystack = [
      story.code,
      story.storyteller,
      story.teaser_en,
      story.teaser_so,
      story.story_en,
      story.story_so,
      labelFor(storyDistrict(story), 'en'),
      labelFor(storyDistrict(story), 'so')
    ].join(' ').toLowerCase();

    return haystack.includes(query);
  });
}

function activeStoriesForOverview(stories = state.stories) {
  return stories.filter((story) => story.status !== 'archived');
}

function imageAuditForStories(stories = []) {
  if (!USE_SUPABASE_IMAGES) {
    return { without: null, unknown: stories.length, total: stories.length, enabled: false };
  }

  return stories.reduce((summary, story) => {
    const code = String(story.code || '').trim();
    const images = code ? state.storyImages[code] : null;
    summary.total += 1;

    if (!Array.isArray(images)) {
      summary.unknown += 1;
    } else if (images.length === 0) {
      summary.without += 1;
    }

    return summary;
  }, { without: 0, unknown: 0, total: 0, enabled: true });
}

function reflectionRowsForStories(stories = []) {
  return stories.flatMap((story) => storyReflections(story));
}

function isTextMissing(story, fieldNames) {
  return fieldNames.some((fieldName) => !normaliseText(story[fieldName]));
}

function overviewRows() {
  const rows = state.districts.map((district) => {
    const stories = state.stories.filter((story) => Number(story.district_id) === Number(district.id));
    const activeStories = activeStoriesForOverview(stories);
    return {
      label: labelFor(district) || 'Unnamed district',
      stories,
      activeStories,
      published: stories.filter((story) => story.status === 'published').length,
      draft: stories.filter((story) => story.status === 'draft').length,
      archived: stories.filter((story) => story.status === 'archived').length,
      reflections: reflectionRowsForStories(stories).length
    };
  });

  const assignedDistrictIds = new Set(state.districts.map((district) => Number(district.id)));
  const unassignedStories = state.stories.filter((story) => !assignedDistrictIds.has(Number(story.district_id)));
  if (unassignedStories.length) {
    rows.push({
      label: 'No district',
      stories: unassignedStories,
      activeStories: activeStoriesForOverview(unassignedStories),
      published: unassignedStories.filter((story) => story.status === 'published').length,
      draft: unassignedStories.filter((story) => story.status === 'draft').length,
      archived: unassignedStories.filter((story) => story.status === 'archived').length,
      reflections: reflectionRowsForStories(unassignedStories).length
    });
  }

  return rows;
}

function overviewTotals() {
  const stories = state.stories;
  return {
    label: 'Total',
    stories,
    activeStories: activeStoriesForOverview(stories),
    published: stories.filter((story) => story.status === 'published').length,
    draft: stories.filter((story) => story.status === 'draft').length,
    archived: stories.filter((story) => story.status === 'archived').length,
    reflections: reflectionRowsForStories(stories).length
  };
}

function overviewChecks() {
  const activeStories = activeStoriesForOverview();
  const imageAudit = imageAuditForStories(activeStories);
  const missingImages = imageAudit.enabled
    ? activeStories.filter((story) => {
        const images = state.storyImages[String(story.code || '').trim()];
        return Array.isArray(images) && images.length === 0;
      })
    : [];

  return [
    {
      label: 'Missing tags',
      stories: activeStories.filter((story) => !(story.story_tags || []).length),
      detail: 'published or draft stories'
    },
    {
      label: 'Missing text',
      stories: activeStories.filter((story) => isTextMissing(story, ['teaser_en', 'teaser_so', 'story_en', 'story_so'])),
      detail: 'teaser or story fields'
    },
    {
      label: 'Missing images',
      stories: missingImages,
      detail: imageAudit.enabled
        ? imageAudit.unknown
          ? `${state.overviewImageAuditLoading ? 'checking' : 'unknown'} ${imageAudit.unknown}`
          : 'storage folders checked'
        : 'storage image checks disabled'
    }
  ];
}

function autoGrowTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight + 2}px`;
}

function autoGrowAllTextareas() {
  app.querySelectorAll('textarea').forEach(autoGrowTextarea);
}

function finishRender() {
  window.requestAnimationFrame(() => {
    restoreSidebarScroll();
    autoGrowAllTextareas();
    ensureActiveStoryImages();
    ensureOverviewImageAudit();
  });
}

function restoreFieldFocus(selector, selectionStart = null, selectionEnd = null) {
  window.requestAnimationFrame(() => {
    const field = app.querySelector(selector);
    if (!field) return;

    field.focus({ preventScroll: true });

    if (
      selectionStart !== null
      && selectionEnd !== null
      && typeof field.setSelectionRange === 'function'
    ) {
      field.setSelectionRange(selectionStart, selectionEnd);
    }
  });
}

function captureSidebarScroll() {
  const list = app.querySelector('.admin-story-list');
  if (list) state.sidebarScrollTop = list.scrollTop;
}

function restoreSidebarScroll() {
  const list = app.querySelector('.admin-story-list');
  if (!list) return;
  list.scrollTop = state.sidebarScrollTop || 0;
}

function renderAuthCard() {
  return `
    <section class="admin-login-card">
      <h1>Admin</h1>
      <p>Sign in with the Supabase user account that has been added to <span class="admin-small-code">admin_users</span>.</p>
      <form data-form="login">
        <div class="admin-form-row">
          <label for="admin-email">Email</label>
          <input id="admin-email" name="email" type="email" autocomplete="email" required>
        </div>
        <div class="admin-form-row">
          <label for="admin-password">Password</label>
          <input id="admin-password" name="password" type="password" autocomplete="current-password" required>
        </div>
        <button class="admin-button" type="submit" ${state.busy ? 'disabled' : ''}>${state.busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      ${state.error ? `<div class="admin-error">${escapeHtml(state.error)}</div>` : ''}
    </section>
  `;
}

function renderConfigCard() {
  return `
    <section class="admin-config-card">
      <h1>Supabase not configured</h1>
      <p>Fill in <span class="admin-small-code">assets/supabase-config.js</span> before using the admin page.</p>
    </section>
  `;
}

function renderLoadingCard(message = 'Loading admin interface…') {
  return `
    <section class="admin-loading-card">
      <p>${escapeHtml(message)}</p>
    </section>
  `;
}

function renderDeniedCard() {
  return `
    <section class="admin-denied-card">
      <h1>Access not enabled</h1>
      <p>You are signed in as <strong>${escapeHtml(state.user?.email || '')}</strong>, but this account is not listed in <span class="admin-small-code">public.admin_users</span>.</p>
      <p>Add this user ID in Supabase, then refresh:</p>
      <p><span class="admin-small-code">${escapeHtml(state.user?.id || '')}</span></p>
      <button type="button" class="admin-secondary-button" data-action="sign-out">Sign out</button>
      ${state.error ? `<div class="admin-error">${escapeHtml(state.error)}</div>` : ''}
    </section>
  `;
}

function renderStoryList() {
  const stories = filteredStories();
  const creating = isCreatingStory();
  const overviewActive = state.editorMode === 'overview';
  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' }
  ];

  return `
    <aside class="admin-sidebar">
      <div class="admin-sidebar-header">
        <div class="admin-topline">
          <div class="admin-title-block">
            <h1>Stories</h1>
            <p>Edit story text, reflections and tags.</p>
          </div>
          <button type="button" class="admin-secondary-button" data-action="sign-out">Sign out</button>
        </div>
        <div class="admin-user-line">Signed in as ${escapeHtml(state.user?.email || '')}</div>
        <button type="button" class="admin-new-story-button ${overviewActive ? 'is-active' : ''}" data-action="show-overview">Overview</button>
        <button type="button" class="admin-new-story-button ${creating ? 'is-active' : ''}" data-action="new-story">+ New story</button>
        <div class="admin-search">
          <input type="search" data-field="search" placeholder="Search code, name, text…" value="${escapeHtml(state.searchQuery)}">
          <div class="admin-filter-stack">
            <div class="admin-filter-section">
              <div class="admin-filter-label">Status</div>
              <div class="admin-filter-button-set" role="radiogroup" aria-label="Filter by status">
                ${statusOptions.map((option) => `
                  <button
                    type="button"
                    class="admin-filter-button ${state.statusFilter === option.value ? 'is-selected' : ''}"
                    data-action="set-status-filter"
                    data-value="${escapeHtml(option.value)}"
                    aria-pressed="${state.statusFilter === option.value ? 'true' : 'false'}"
                  >${escapeHtml(option.label)}</button>
                `).join('')}
              </div>
            </div>
            <div class="admin-filter-section">
              <div class="admin-filter-label">District</div>
              <div class="admin-filter-button-set" role="radiogroup" aria-label="Filter by district">
                <button
                  type="button"
                  class="admin-filter-button ${state.districtFilter === 'all' ? 'is-selected' : ''}"
                  data-action="set-district-filter"
                  data-value="all"
                  aria-pressed="${state.districtFilter === 'all' ? 'true' : 'false'}"
                >All districts</button>
                ${state.districts.map((district) => `
                  <button
                    type="button"
                    class="admin-filter-button ${String(state.districtFilter) === String(district.id) ? 'is-selected' : ''}"
                    data-action="set-district-filter"
                    data-value="${district.id}"
                    aria-pressed="${String(state.districtFilter) === String(district.id) ? 'true' : 'false'}"
                  >${escapeHtml(labelFor(district))}</button>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
        <div class="admin-story-count">${stories.length} of ${state.stories.length} stories shown</div>
      </div>
      <div class="admin-story-list">
        ${stories.map((story) => {
          const district = storyDistrict(story);
          const active = Number(story.id) === Number(state.activeStoryId);
          return `
            <button type="button" class="admin-story-list-button ${active ? 'is-active' : ''}" data-action="select-story" data-id="${story.id}">
              <span class="admin-story-code-row">
                <span class="admin-story-code">${escapeHtml(story.code)}</span>
                <span class="admin-status-pill is-${escapeHtml(story.status || 'draft')}">${escapeHtml(story.status || 'draft')}</span>
              </span>
              <span class="admin-story-name">${escapeHtml(story.storyteller || 'Anonymous')}</span>
              <span class="admin-story-meta">${escapeHtml(labelFor(district) || 'No district')}</span>
            </button>
          `;
        }).join('') || '<div class="admin-note">No stories match this filter.</div>'}
      </div>
    </aside>
  `;
}

function renderDistrictButtons(currentDistrictId = selectedDistrictId()) {
  return `
    <div class="admin-district-buttons" role="radiogroup" aria-label="District">
      ${state.districts.map((district) => {
        const selected = Number(currentDistrictId) === Number(district.id);
        const prefix = districtPrefix(district);
        return `
          <button
            type="button"
            class="admin-district-button ${selected ? 'is-selected' : ''}"
            data-action="set-form-district"
            data-id="${district.id}"
            aria-pressed="${selected ? 'true' : 'false'}"
          >
            <span>${escapeHtml(labelFor(district))}</span>
            ${prefix ? `<small>${escapeHtml(prefix)}</small>` : ''}
          </button>
        `;
      }).join('')}
    </div>
    <input type="hidden" name="district_id" value="${currentDistrictId || ''}">
  `;
}

function renderCodeSelector(story = null) {
  if (story) {
    return `
      <div class="admin-field">
        <label for="story-code">Code</label>
        <input id="story-code" value="${escapeHtml(story.code)}" disabled>
      </div>
    `;
  }

  const districtId = selectedDistrictId();
  const options = getNewCodeOptions(districtId);
  const selectedOption = options.find((option) => option.kind === state.newCodeKind) || options[0] || null;
  const selectedCode = selectedOption?.code || '';

  if (!districtId) {
    return `
      <div class="admin-field is-wide">
        <label>Code</label>
        <div class="admin-code-empty">Choose a district to generate the next story code.</div>
      </div>
    `;
  }

  if (!options.length) {
    return `
      <div class="admin-field is-wide">
        <label>Code</label>
        <div class="admin-code-empty">This district does not have a recognised code prefix yet.</div>
      </div>
    `;
  }

  return `
    <div class="admin-field is-wide">
      <label>Code</label>
      <input type="hidden" name="code" value="${escapeHtml(selectedCode)}" required>
      <div class="admin-code-options" role="radiogroup" aria-label="New story code">
        ${options.map((option) => `
          <button
            type="button"
            class="admin-code-option ${selectedOption?.kind === option.kind ? 'is-selected' : ''}"
            data-action="set-code-kind"
            data-kind="${escapeHtml(option.kind)}"
            aria-pressed="${selectedOption?.kind === option.kind ? 'true' : 'false'}"
          >
            <span>${escapeHtml(option.code)}</span>
            <small>${escapeHtml(option.note)}</small>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderImageSlider(story = null) {
  const code = story?.code || draftValue('code', '') || 'NEW';
  const storageImages = story?.code ? state.storyImages[story.code] : null;
  const isLoading = story?.code && state.storyImageLoading.has(story.code);
  const loadError = story?.code ? state.storyImageErrors[story.code] : '';
  const hasStorageImages = Array.isArray(storageImages) && storageImages.length > 0;
  const slides = hasStorageImages ? storageImages : buildPlaceholderSlides(code);

  const hint = story?.code
    ? isLoading
      ? `Loading photos from ${SUPABASE_STORY_PHOTO_BUCKET}/${story.code}/…`
      : hasStorageImages
        ? `${storageImages.length} photo${storageImages.length === 1 ? '' : 's'} loaded from ${SUPABASE_STORY_PHOTO_BUCKET}/${story.code}/.`
        : USE_SUPABASE_IMAGES
          ? loadError || `No photos found in ${SUPABASE_STORY_PHOTO_BUCKET}/${story.code}/ yet.`
          : 'Supabase images are disabled in assets/supabase-config.js, so placeholders are shown.'
    : 'Save the story first, then upload images to the matching story-code folder.';

  return `
    <h3 class="admin-section-title">Images</h3>
    <div class="admin-image-slider" aria-label="Story images">
      ${slides.map((slide) => {
        if (slide.type === 'image') {
          const selected = slide.path && state.selectedImagePath === slide.path;
          return `
            <figure class="admin-image-card ${selected ? 'is-selected' : ''}">
              <button
                type="button"
                class="admin-image-select"
                data-action="select-image"
                data-path="${escapeHtml(slide.path)}"
                data-name="${escapeHtml(slide.name)}"
                aria-pressed="${selected ? 'true' : 'false'}"
              >
                <img src="${escapeHtml(slide.url)}" alt="${escapeHtml(`${code} ${slide.name}`)}" loading="lazy">
              </button>
              <figcaption>
                <span>${escapeHtml(slide.name)}</span>
                ${selected ? `
                  <button
                    type="button"
                    class="admin-image-delete-button"
                    data-action="request-delete-image"
                    data-path="${escapeHtml(slide.path)}"
                    data-name="${escapeHtml(slide.name)}"
                  >Delete</button>
                ` : ''}
              </figcaption>
            </figure>
          `;
        }

        return `
          <div class="admin-image-placeholder">
            <div class="admin-image-placeholder-art">${escapeHtml(slide.code)}</div>
            <div class="admin-image-placeholder-caption">${escapeHtml(slide.caption)}</div>
          </div>
        `;
      }).join('')}
    </div>
    <p class="admin-field-hint admin-image-hint ${loadError ? 'is-error' : ''}">${escapeHtml(hint)}</p>
  `;
}

function renderTextFields(story = null) {
  return `
    <h3 class="admin-section-title">Story text</h3>

    <div class="admin-field">
      <label for="teaser-en">Teaser English</label>
      <textarea id="teaser-en" name="teaser_en">${escapeHtml(draftValue('teaser_en', story?.teaser_en || ''))}</textarea>
    </div>

    <div class="admin-field">
      <label for="teaser-so">Teaser Somali</label>
      <textarea id="teaser-so" name="teaser_so">${escapeHtml(draftValue('teaser_so', story?.teaser_so || ''))}</textarea>
    </div>

    <div class="admin-field">
      <label for="story-en">Story English</label>
      <textarea id="story-en" name="story_en" class="admin-story-textarea">${escapeHtml(draftValue('story_en', story?.story_en || ''))}</textarea>
    </div>

    <div class="admin-field">
      <label for="story-so">Story Somali</label>
      <textarea id="story-so" name="story_so" class="admin-story-textarea">${escapeHtml(draftValue('story_so', story?.story_so || ''))}</textarea>
    </div>
  `;
}

function renderReflectionsEditor(story = null) {
  const existingReflections = storyReflections(story);
  const rows = existingReflections.length
    ? [...existingReflections, null]
    : [null];

  return `
    <h3 class="admin-section-title">Community reflections</h3>
    <div class="admin-reflection-groups">
      ${rows.map((reflection, index) => {
        const label = reflection
          ? `Community reflection ${index + 1}`
          : existingReflections.length
            ? 'Add another community reflection'
            : 'Add a community reflection';
        const idValue = reflection?.id || '';
        const enName = `reflection_en_${index}`;
        const soName = `reflection_so_${index}`;
        const idName = `reflection_id_${index}`;
        const typeName = `reflection_type_${index}`;
        const typeValue = normaliseReflectionType(draftValue(typeName, reflection?.reflection_type || '')) || '';
        return `
          <div class="admin-reflection-block">
            <div class="admin-reflection-heading">
              <h4>${escapeHtml(label)}</h4>
              <fieldset class="admin-reflection-type-options" aria-label="${escapeHtml(`${label} type`)}">
                ${REFLECTION_TYPES.map((option) => `
                  <label class="admin-radio-pill">
                    <input
                      type="radio"
                      name="${typeName}"
                      value="${escapeHtml(option.value)}"
                      ${typeValue === option.value ? 'checked' : ''}
                    >
                    <span>${escapeHtml(option.label)}</span>
                  </label>
                `).join('')}
              </fieldset>
            </div>
            <input type="hidden" name="${idName}" value="${escapeHtml(idValue)}">
            <div class="admin-field">
              <label for="${enName}">Reflection English</label>
              <textarea id="${enName}" name="${enName}">${escapeHtml(draftValue(enName, reflection?.reflection_en || ''))}</textarea>
            </div>
            <div class="admin-field">
              <label for="${soName}">Reflection Somali</label>
              <textarea id="${soName}" name="${soName}">${escapeHtml(draftValue(soName, reflection?.reflection_so || ''))}</textarea>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <input type="hidden" name="reflection_count" value="${rows.length}">
  `;
}

function renderTagsEditor() {
  return `
    <h3 class="admin-section-title">Tags</h3>
    <div class="admin-tag-groups">
      ${state.clusters.map((cluster) => `
        <div class="admin-tag-cluster">
          <div class="admin-tag-cluster-title">${escapeHtml(labelFor(cluster))}</div>
          <div class="admin-tag-buttons">
            ${(cluster.tags || []).map((tag) => {
              const selected = state.selectedTagIds.has(Number(tag.id));
              return `
                <button
                  type="button"
                  class="admin-tag-button ${selected ? 'is-selected' : ''}"
                  data-action="toggle-tag"
                  data-id="${tag.id}"
                  aria-pressed="${selected ? 'true' : 'false'}"
                >${escapeHtml(labelFor(tag))}</button>
              `;
            }).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderOverview() {
  const rows = overviewRows();
  const totals = overviewTotals();
  const checks = overviewChecks();
  const renderStoryCodeList = (stories = []) => {
    if (!stories.length) return '<div class="admin-overview-empty-list">None</div>';
    return `
      <div class="admin-overview-code-list">
        ${stories.map((story) => `
          <button
            type="button"
            class="admin-overview-code-link"
            data-action="select-story"
            data-id="${story.id}"
          >${escapeHtml(story.code || `#${story.id}`)}</button>
        `).join('')}
      </div>
    `;
  };
  const renderRow = (row, extraClass = '') => `
    <tr class="${extraClass}">
      <th scope="row">${escapeHtml(row.label)}</th>
      <td>${row.published}</td>
      <td>${row.draft}</td>
      <td>${row.archived}</td>
      <td>${row.reflections}</td>
    </tr>
  `;

  return `
    <section class="admin-editor admin-overview">
      <div class="admin-editor-header">
        <div class="admin-editor-title">
          <h2>Overview</h2>
          <p>Quick checks across districts before editing individual stories.</p>
        </div>
      </div>

      <div class="admin-overview-body">
        <div class="admin-overview-table-wrap">
          <table class="admin-overview-table">
            <thead>
              <tr>
                <th scope="col">District</th>
                <th scope="col">Published</th>
                <th scope="col">Draft</th>
                <th scope="col">Archived</th>
                <th scope="col">Community reflections</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((row) => renderRow(row)).join('')}
            </tbody>
            <tfoot>
              ${renderRow(totals, 'admin-overview-total-row')}
            </tfoot>
          </table>
        </div>

        ${state.overviewImageAuditError ? `<div class="admin-error">${escapeHtml(state.overviewImageAuditError)}</div>` : ''}

        <div class="admin-overview-checks" aria-label="Useful admin checks">
          ${checks.map((check) => `
            <div class="admin-overview-check">
              <span>${escapeHtml(check.label)}</span>
              <strong>${check.stories.length}</strong>
              ${renderStoryCodeList(check.stories)}
              <small>${escapeHtml(check.detail)}</small>
            </div>
          `).join('')}
        </div>

        <div class="admin-overview-suggestions">
          <h3>Other useful admin checks</h3>
          <p>Useful next additions would be: recent edits, published stories missing community reflections, and a translation-completeness column for English/Somali fields.</p>
        </div>
      </div>
    </section>
  `;
}

function renderEditor() {
  const story = getActiveStory();
  const mode = story ? 'edit' : 'create';
  const currentDistrictId = selectedDistrictId();
  const statusValue = draftValue('status', story?.status || 'draft');

  return `
    <section class="admin-editor">
      <div class="admin-editor-header">
        <div class="admin-editor-title">
          <h2>${story ? escapeHtml(story.code) : 'Add new story'}</h2>
          <p>${story ? 'Changes save directly to Supabase. Public pages will show saved changes after refresh.' : 'Start with the district, then choose the generated code before adding text and tags.'}</p>
        </div>
      </div>

      <form class="admin-editor-form" data-form="story-editor">
        <input type="hidden" name="mode" value="${mode}">
        ${story ? `<input type="hidden" name="story_id" value="${story.id}">` : ''}

        <div class="admin-editor-grid">
          <div class="admin-field is-wide">
            <label>District</label>
            ${renderDistrictButtons(currentDistrictId)}
          </div>

          ${renderCodeSelector(story)}

          <div class="admin-field">
            <label for="story-status">Status</label>
            <select id="story-status" name="status">
              ${['draft', 'published', 'archived'].map((status) => `
                <option value="${status}" ${statusValue === status ? 'selected' : ''}>${status}</option>
              `).join('')}
            </select>
          </div>

          <div class="admin-field ${story ? '' : 'is-wide'}">
            <label for="storyteller">Storyteller</label>
            <input id="storyteller" name="storyteller" value="${escapeHtml(draftValue('storyteller', story?.storyteller || ''))}" placeholder="Anonymous">
          </div>

          ${renderImageSlider(story)}
          ${renderTextFields(story)}
          ${renderReflectionsEditor(story)}
          ${renderTagsEditor()}
        </div>

        <div class="admin-actions">
          <div>
            ${state.error ? `<div class="admin-error">${escapeHtml(state.error)}</div>` : ''}
            ${state.message ? `<div class="admin-success">${escapeHtml(state.message)}</div>` : ''}
          </div>
          <button class="admin-button" type="submit" ${state.busy ? 'disabled' : ''}>${state.busy ? 'Saving…' : story ? 'Save story' : 'Create story'}</button>
        </div>
      </form>
    </section>
  `;
}

function renderUnsavedModal() {
  if (!state.pendingNavigation) return '';

  return `
    <div class="admin-modal-backdrop" role="presentation">
      <section class="admin-unsaved-modal" role="dialog" aria-modal="true" aria-labelledby="unsaved-title">
        <h2 id="unsaved-title">Unsaved changes</h2>
        <p>You have changes that have not been saved yet.</p>
        <div class="admin-modal-actions">
          <button type="button" class="admin-secondary-button" data-action="discard-changes">Discard changes</button>
          <button type="button" class="admin-button" data-action="save-before-navigation">Save changes</button>
          <button type="button" class="admin-secondary-button" data-action="cancel-navigation">Cancel</button>
        </div>
      </section>
    </div>
  `;
}

function renderImageDeleteModal() {
  if (!state.pendingImageDelete) return '';

  return `
    <div class="admin-modal-backdrop" role="presentation">
      <section class="admin-unsaved-modal" role="dialog" aria-modal="true" aria-labelledby="delete-image-title">
        <h2 id="delete-image-title">Delete image?</h2>
        <p>This will permanently delete <strong>${escapeHtml(state.pendingImageDelete.name || state.pendingImageDelete.path)}</strong> from the Supabase Storage bucket.</p>
        <div class="admin-modal-actions">
          <button type="button" class="admin-danger-button" data-action="confirm-delete-image" ${state.busy ? 'disabled' : ''}>${state.busy ? 'Deleting…' : 'Yes, delete'}</button>
          <button type="button" class="admin-secondary-button" data-action="cancel-delete-image" ${state.busy ? 'disabled' : ''}>Cancel</button>
        </div>
      </section>
    </div>
  `;
}

function renderAdminApp() {
  const mainPanel = state.editorMode === 'overview' ? renderOverview() : renderEditor();
  return `
    <div class="admin-app-frame">
      ${renderStoryList()}
      ${mainPanel}
    </div>
    ${renderUnsavedModal()}
    ${renderImageDeleteModal()}
  `;
}

function render() {
  captureSidebarScroll();

  if (!isSupabaseConfigured) {
    app.innerHTML = renderConfigCard();
    finishRender();
    return;
  }

  if (!state.session) {
    app.innerHTML = renderAuthCard();
    finishRender();
    return;
  }

  if (state.adminAccessLoading || !state.adminAccessChecked) {
    app.innerHTML = renderLoadingCard('Checking admin access…');
    finishRender();
    return;
  }

  if (!state.adminProfile) {
    app.innerHTML = renderDeniedCard();
    finishRender();
    return;
  }

  app.innerHTML = renderAdminApp();
  finishRender();
}

async function signIn(form) {
  const data = new FormData(form);
  state.busy = true;
  setMessage();
  render();

  const { data: authData, error } = await state.supabase.auth.signInWithPassword({
    email: String(data.get('email') || '').trim(),
    password: String(data.get('password') || '')
  });

  state.busy = false;

  if (error) {
    setMessage('', error.message || 'Sign-in failed.');
    render();
    return;
  }

  state.session = authData.session;
  state.user = authData.user;
  await afterAuthChange();
}

async function signOut() {
  await state.supabase.auth.signOut();
  state.session = null;
  state.user = null;
  state.adminProfile = null;
  state.adminAccessChecked = false;
  state.adminAccessLoading = false;
  state.stories = [];
  startNewStory();
  setMessage();
  render();
}

async function checkAdminAccess() {
  if (!state.user) return null;

  const { data, error } = await state.supabase
    .from('admin_users')
    .select('user_id,email')
    .eq('user_id', state.user.id)
    .maybeSingle();

  if (error) {
    setMessage('', `Could not verify admin access: ${error.message}`);
    return null;
  }

  return data || null;
}

async function loadData() {
  state.busy = true;
  setMessage();
  render();

  const [districtResult, clusterResult, storyResult] = await Promise.all([
    state.supabase
      .from('districts')
      .select('id,slug,label_so,label_en,sort_order')
      .order('sort_order', { ascending: true }),
    state.supabase
      .from('tag_clusters')
      .select('id,slug,label_so,label_en,sort_order,tags(id,slug,label_so,label_en,sort_order)')
      .order('sort_order', { ascending: true }),
    state.supabase
      .from('stories')
      .select(`
        id,
        code,
        district_id,
        storyteller,
        teaser_so,
        story_so,
        teaser_en,
        story_en,
        status,
        published_at,
        districts(id,slug,label_so,label_en,sort_order),
        story_tags(tag_id,tags(id,slug,label_so,label_en,sort_order,cluster_id)),
        community_reflections(id,reflection_so,reflection_en,reflection_type,status,sort_order)
      `)
      .order('code', { ascending: true })
  ]);

  state.busy = false;

  const firstError = districtResult.error || clusterResult.error || storyResult.error;
  if (firstError) {
    setMessage('', firstError.message || 'Could not load admin data.');
    render();
    return;
  }

  state.districts = districtResult.data || [];
  state.clusters = (clusterResult.data || [])
    .map((cluster) => ({
      ...cluster,
      tags: (cluster.tags || []).slice().sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999) || labelFor(a).localeCompare(labelFor(b)))
    }))
    .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999) || labelFor(a).localeCompare(labelFor(b)));
  state.stories = storyResult.data || [];

  const route = navigationRequestFromUrl();
  const routedStory = route.type === 'select-story' ? findStoryByIdentifier(route.id || route.code) : null;
  if (routedStory) {
    setActiveStory(routedStory.id);
  } else if (route.type === 'new-story') {
    startNewStory();
  } else {
    showOverview();
  }

  syncAdminHistory(navigationRequestFromState(), 'replace');
  render();
}

async function afterAuthChange() {
  if (!state.user) {
    state.adminProfile = null;
    state.adminAccessChecked = false;
    state.adminAccessLoading = false;
    render();
    return;
  }

  const checkVersion = state.authCheckVersion + 1;
  state.authCheckVersion = checkVersion;
  state.adminAccessLoading = true;
  state.adminAccessChecked = false;
  render();

  const profile = await checkAdminAccess();
  if (checkVersion !== state.authCheckVersion) return;

  state.adminProfile = profile;
  state.adminAccessChecked = true;
  state.adminAccessLoading = false;

  if (!state.adminProfile) {
    render();
    return;
  }

  await loadData();
}

function buildStoryPayload(data, story = null) {
  const nextStatus = String(data.get('status') || 'draft');
  const payload = {
    district_id: data.get('district_id') ? Number(data.get('district_id')) : null,
    storyteller: normaliseText(data.get('storyteller')),
    teaser_en: normaliseText(data.get('teaser_en')),
    teaser_so: normaliseText(data.get('teaser_so')),
    story_en: normaliseText(data.get('story_en')),
    story_so: normaliseText(data.get('story_so')),
    status: nextStatus,
    updated_at: new Date().toISOString()
  };

  if (!story) {
    payload.code = normaliseText(data.get('code'));
    payload.created_at = new Date().toISOString();
  }

  if (nextStatus === 'published' && !story?.published_at) {
    payload.published_at = new Date().toISOString();
  }

  return payload;
}

function reflectionRowsFromForm(data) {
  const count = Number(data.get('reflection_count') || 0);
  return Array.from({ length: count }, (_, index) => {
    const id = String(data.get(`reflection_id_${index}`) || '').trim();
    const reflection_en = normaliseText(data.get(`reflection_en_${index}`));
    const reflection_so = normaliseText(data.get(`reflection_so_${index}`));
    const reflection_type = normaliseReflectionType(data.get(`reflection_type_${index}`));
    return {
      index,
      id,
      reflection_en,
      reflection_so,
      reflection_type,
      hasText: Boolean(reflection_en || reflection_so),
      isExisting: Boolean(id)
    };
  });
}

function validateReflectionRows(data) {
  const missingType = reflectionRowsFromForm(data)
    .find((row) => (row.hasText || row.isExisting) && !row.reflection_type);

  if (!missingType) return '';
  return 'Choose Direct or Indirect for each community reflection before saving.';
}

async function saveReflections(storyId, data) {
  for (const row of reflectionRowsFromForm(data)) {
    const reflectionId = row.id;
    const reflectionPayload = {
      reflection_en: row.reflection_en,
      reflection_so: row.reflection_so,
      reflection_type: row.reflection_type,
      status: 'published',
      sort_order: row.index,
      updated_at: new Date().toISOString()
    };

    if (reflectionId) {
      const reflectionUpdate = await state.supabase
        .from('community_reflections')
        .update(reflectionPayload)
        .eq('id', Number(reflectionId));

      if (reflectionUpdate.error) return reflectionUpdate.error;
    } else if (row.hasText) {
      const reflectionInsert = await state.supabase
        .from('community_reflections')
        .insert({ ...reflectionPayload, story_id: storyId, created_at: new Date().toISOString() });

      if (reflectionInsert.error) return reflectionInsert.error;
    }
  }

  return null;
}

async function saveTags(storyId) {
  const selectedTagRows = [...state.selectedTagIds].map((tagId) => ({
    story_id: storyId,
    tag_id: tagId
  }));

  const deleteTags = await state.supabase
    .from('story_tags')
    .delete()
    .eq('story_id', storyId);

  if (deleteTags.error) return deleteTags.error;

  if (selectedTagRows.length > 0) {
    const insertTags = await state.supabase
      .from('story_tags')
      .insert(selectedTagRows);

    if (insertTags.error) return insertTags.error;
  }

  return null;
}

async function saveStory(form) {
  const story = getActiveStory();
  const data = new FormData(form);
  const mode = String(data.get('mode') || (story ? 'edit' : 'create'));
  const creating = mode === 'create' || !story;

  if (creating && !data.get('district_id')) {
    setMessage('', 'Choose a district before creating a story.');
    render();
    return false;
  }

  if (creating && !normaliseText(data.get('code'))) {
    setMessage('', 'Choose a generated code before creating a story.');
    render();
    return false;
  }

  const reflectionValidationError = validateReflectionRows(data);
  if (reflectionValidationError) {
    state.formDraft = Object.fromEntries(data.entries());
    setMessage('', reflectionValidationError);
    render();
    return false;
  }

  const storyPayload = buildStoryPayload(data, creating ? null : story);

  state.busy = true;
  setMessage();
  render();

  let savedStoryId = story?.id || null;
  let savedStoryCode = story?.code || storyPayload.code;

  if (creating) {
    const storyInsert = await state.supabase
      .from('stories')
      .insert(storyPayload)
      .select('id,code')
      .single();

    if (storyInsert.error) {
      state.busy = false;
      setMessage('', storyInsert.error.message || 'Could not create story.');
      render();
      return false;
    }

    savedStoryId = storyInsert.data.id;
    savedStoryCode = storyInsert.data.code;
  } else {
    const storyUpdate = await state.supabase
      .from('stories')
      .update(storyPayload)
      .eq('id', story.id);

    if (storyUpdate.error) {
      state.busy = false;
      setMessage('', storyUpdate.error.message || 'Could not save story.');
      render();
      return false;
    }
  }

  const reflectionError = await saveReflections(savedStoryId, data);
  if (reflectionError) {
    state.busy = false;
    setMessage('', reflectionError.message || 'Story saved, but reflections could not be saved.');
    render();
    return false;
  }

  const tagError = await saveTags(savedStoryId);
  if (tagError) {
    state.busy = false;
    setMessage('', tagError.message || 'Story saved, but tags could not be saved.');
    render();
    return false;
  }

  state.busy = false;
  state.editorMode = 'edit';
  state.activeStoryId = savedStoryId;
  markClean();
  setMessage(`${creating ? 'Created' : 'Saved'} ${savedStoryCode}.`);
  syncAdminHistory({ type: 'select-story', id: savedStoryId, code: savedStoryCode }, creating ? 'replace' : 'replace');
  await loadData();
  return true;
}


async function deletePendingImage() {
  const pending = state.pendingImageDelete;
  if (!pending?.path) return;

  state.busy = true;
  setMessage();
  render();

  const { error } = await state.supabase.storage
    .from(SUPABASE_STORY_PHOTO_BUCKET)
    .remove([pending.path]);

  state.busy = false;

  if (error) {
    setMessage('', error.message || 'Could not delete image.');
    state.pendingImageDelete = null;
    render();
    return;
  }

  const storyCode = pending.storyCode || pending.path.split('/')[0];
  state.storyImages[storyCode] = (state.storyImages[storyCode] || [])
    .filter((image) => image.path !== pending.path);
  state.selectedImagePath = null;
  state.pendingImageDelete = null;
  setMessage(`Deleted ${pending.name || pending.path}.`);
  render();
}


function performNavigation(request, discard = false, historyMode = 'push') {
  if (!request) return;

  if (discard) markClean();
  state.pendingNavigation = null;
  setMessage();

  if (request.type === 'sign-out') {
    signOut();
    return;
  }

  if (request.type === 'new-story') {
    startNewStory();
    if (historyMode !== 'none') syncAdminHistory({ type: 'new-story' }, historyMode);
    render();
    return;
  }

  if (request.type === 'overview') {
    showOverview();
    if (historyMode !== 'none') syncAdminHistory({ type: 'overview' }, historyMode);
    render();
    return;
  }

  if (request.type === 'select-story') {
    setActiveStory(request.id);
    if (historyMode !== 'none') syncAdminHistory(navigationRequestFromState(), historyMode);
    render();
  }
}

function requestNavigation(request) {
  if (!state.hasUnsavedChanges) {
    performNavigation(request);
    return;
  }

  captureFormDraft();
  state.pendingNavigation = request;
  render();
}

app.addEventListener('submit', async (event) => {
  const form = event.target.closest('form');
  if (!form) return;
  event.preventDefault();

  if (form.dataset.form === 'login') {
    await signIn(form);
    return;
  }

  if (form.dataset.form === 'story-editor') {
    await saveStory(form);
  }
});

app.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const action = button.dataset.action;

  if (action === 'sign-out') {
    requestNavigation({ type: 'sign-out' });
    return;
  }

  if (action === 'new-story') {
    requestNavigation({ type: 'new-story' });
    return;
  }

  if (action === 'show-overview') {
    requestNavigation({ type: 'overview' });
    return;
  }

  if (action === 'set-status-filter') {
    captureFormDraft();
    state.statusFilter = button.dataset.value || 'all';
    render();
    return;
  }

  if (action === 'set-district-filter') {
    captureFormDraft();
    state.districtFilter = button.dataset.value || 'all';
    render();
    return;
  }

  if (action === 'select-story') {
    requestNavigation({ type: 'select-story', id: button.dataset.id });
    return;
  }

  if (action === 'discard-changes') {
    performNavigation(state.pendingNavigation, true);
    return;
  }

  if (action === 'cancel-navigation') {
    state.pendingNavigation = null;
    render();
    return;
  }

  if (action === 'save-before-navigation') {
    const form = app.querySelector('form[data-form="story-editor"]');
    if (!form) {
      performNavigation(state.pendingNavigation, true);
      return;
    }

    const pending = state.pendingNavigation;
    const saved = await saveStory(form);
    if (saved) {
      state.pendingNavigation = pending;
      performNavigation(pending, false);
    }
    return;
  }

  if (action === 'set-form-district') {
    captureFormDraft();
    markDirty();
    state.editorDistrictId = Number(button.dataset.id);
    state.formDraft.district_id = String(button.dataset.id);

    if (isCreatingStory()) {
      const options = getNewCodeOptions(state.editorDistrictId);
      const selectedOption = options.find((option) => option.kind === state.newCodeKind) || options[0];
      state.formDraft.code = selectedOption?.code || '';
    }

    render();
    return;
  }

  if (action === 'set-code-kind') {
    captureFormDraft();
    markDirty();
    state.newCodeKind = button.dataset.kind || 'standard';
    const options = getNewCodeOptions(selectedDistrictId());
    const selectedOption = options.find((option) => option.kind === state.newCodeKind) || options[0];
    state.formDraft.code = selectedOption?.code || '';
    render();
    return;
  }

  if (action === 'select-image') {
    const path = button.dataset.path || '';
    state.selectedImagePath = state.selectedImagePath === path ? null : path;
    render();
    return;
  }

  if (action === 'request-delete-image') {
    const story = getActiveStory();
    state.pendingImageDelete = {
      path: button.dataset.path || '',
      name: button.dataset.name || button.dataset.path || '',
      storyCode: story?.code || ''
    };
    render();
    return;
  }

  if (action === 'cancel-delete-image') {
    state.pendingImageDelete = null;
    render();
    return;
  }

  if (action === 'confirm-delete-image') {
    await deletePendingImage();
    return;
  }

  if (action === 'toggle-tag') {
    captureFormDraft();
    markDirty();
    const tagId = Number(button.dataset.id);
    if (state.selectedTagIds.has(tagId)) state.selectedTagIds.delete(tagId);
    else state.selectedTagIds.add(tagId);
    render();
  }
});

app.addEventListener('scroll', (event) => {
  if (event.target?.classList?.contains('admin-story-list')) {
    state.sidebarScrollTop = event.target.scrollTop;
  }
}, true);

app.addEventListener('input', (event) => {
  const field = event.target.closest('[data-field]');

  if (event.target.closest('form[data-form="story-editor"]')) {
    markDirty();
  }

  if (event.target.matches('textarea')) {
    autoGrowTextarea(event.target);
  }

  if (!field) return;

  if (field.dataset.field === 'search') {
    const selectionStart = field.selectionStart;
    const selectionEnd = field.selectionEnd;

    state.searchQuery = field.value;
    render();
    restoreFieldFocus('[data-field=\"search\"]', selectionStart, selectionEnd);
  }
});

app.addEventListener('change', (event) => {
  if (event.target.closest('form[data-form="story-editor"]')) {
    captureFormDraft();
    markDirty();
  }

  const field = event.target.closest('[data-field]');
  if (!field) return;

  captureFormDraft();

  if (field.dataset.field === 'status-filter') {
    state.statusFilter = field.value;
    render();
  }

  if (field.dataset.field === 'district-filter') {
    state.districtFilter = field.value;
    render();
  }
});

window.addEventListener('popstate', () => {
  if (!state.adminProfile || !state.stories.length) return;

  const route = navigationRequestFromUrl();
  if (state.hasUnsavedChanges) {
    const discard = window.confirm('Discard unsaved changes and go back?');
    if (!discard) {
      syncAdminHistory(navigationRequestFromState(), 'push');
      return;
    }
  }

  performNavigation(route, state.hasUnsavedChanges, 'none');
});

async function init() {
  if (!isSupabaseConfigured) {
    render();
    return;
  }

  state.supabase = await getSupabaseClient();
  const { data, error } = await state.supabase.auth.getSession();

  if (error) {
    setMessage('', error.message || 'Could not read Supabase session.');
    render();
    return;
  }

  state.session = data.session;
  state.user = data.session?.user || null;

  state.supabase.auth.onAuthStateChange(async (_event, session) => {
    const previousUserId = state.user?.id || null;
    const nextUserId = session?.user?.id || null;

    state.session = session;
    state.user = session?.user || null;

    if (!state.user) {
      state.adminProfile = null;
      state.adminAccessChecked = false;
      state.adminAccessLoading = false;
      render();
      return;
    }

    if (previousUserId === nextUserId && state.adminProfile) return;

    state.adminProfile = null;
    state.adminAccessChecked = false;
    await afterAuthChange();
  });

  if (state.user) await afterAuthChange();
  else render();
}

window.addEventListener('beforeunload', (event) => {
  if (!state.hasUnsavedChanges) return;
  event.preventDefault();
  event.returnValue = '';
});

init().catch((error) => {
  console.error(error);
  setMessage('', error.message || 'Admin interface failed to initialise.');
  render();
});
