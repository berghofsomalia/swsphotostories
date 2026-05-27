import { getSupabaseClient, isSupabaseConfigured } from './supabase-client.js';

const app = document.getElementById('admin-app');

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

const state = {
  supabase: null,
  session: null,
  user: null,
  adminProfile: null,
  stories: [],
  districts: [],
  clusters: [],
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
  pendingNavigation: null
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

function isCreatingStory() {
  return !getActiveStory();
}

function resetEditorDraft() {
  state.formDraft = {};
}

function startNewStory() {
  state.activeStoryId = null;
  state.selectedTagIds = new Set();
  state.editorDistrictId = null;
  state.newCodeKind = 'standard';
  resetEditorDraft();
  markClean();
}

function setActiveStory(storyId) {
  const story = state.stories.find((item) => Number(item.id) === Number(storyId));
  if (!story) {
    startNewStory();
    return;
  }

  state.activeStoryId = Number(story.id);
  state.selectedTagIds = storyTagIds(story);
  state.editorDistrictId = story.district_id ? Number(story.district_id) : null;
  state.newCodeKind = 'standard';
  resetEditorDraft();
  markClean();
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

function autoGrowTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight + 2}px`;
}

function autoGrowAllTextareas() {
  app.querySelectorAll('textarea').forEach(autoGrowTextarea);
}

function finishRender() {
  window.requestAnimationFrame(autoGrowAllTextareas);
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
        <button type="button" class="admin-new-story-button ${creating ? 'is-active' : ''}" data-action="new-story">+ New story</button>
        <div class="admin-search">
          <input type="search" data-field="search" placeholder="Search code, name, text…" value="${escapeHtml(state.searchQuery)}">
          <div class="admin-filter-grid">
            <select class="admin-filter-select" data-field="status-filter" aria-label="Filter by status">
              ${['all', 'draft', 'published', 'archived'].map((status) => `
                <option value="${status}" ${state.statusFilter === status ? 'selected' : ''}>${status === 'all' ? 'All statuses' : status}</option>
              `).join('')}
            </select>
            <select class="admin-filter-select" data-field="district-filter" aria-label="Filter by district">
              <option value="all" ${state.districtFilter === 'all' ? 'selected' : ''}>All districts</option>
              ${state.districts.map((district) => `
                <option value="${district.id}" ${String(state.districtFilter) === String(district.id) ? 'selected' : ''}>${escapeHtml(labelFor(district))}</option>
              `).join('')}
            </select>
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
  const slides = [1, 2, 3, 4];

  return `
    <h3 class="admin-section-title">Images</h3>
    <div class="admin-image-slider" aria-label="Story images">
      ${slides.map((number) => `
        <div class="admin-image-placeholder">
          <div class="admin-image-placeholder-art">${escapeHtml(code)}</div>
          <div class="admin-image-placeholder-caption">Placeholder ${number}</div>
        </div>
      `).join('')}
    </div>
    <p class="admin-field-hint admin-image-hint">Later, this can read images from the Supabase Storage folder for this story code.</p>
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
        return `
          <div class="admin-reflection-block">
            <h4>${escapeHtml(label)}</h4>
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

function renderAdminApp() {
  return `
    <div class="admin-app-frame">
      ${renderStoryList()}
      ${renderEditor()}
    </div>
    ${renderUnsavedModal()}
  `;
}

function render() {
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
        community_reflections(id,reflection_so,reflection_en,status,sort_order)
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

  if (state.activeStoryId && state.stories.some((story) => Number(story.id) === Number(state.activeStoryId))) {
    setActiveStory(state.activeStoryId);
  } else {
    startNewStory();
  }

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

async function saveReflections(storyId, data) {
  const count = Number(data.get('reflection_count') || 0);

  for (let index = 0; index < count; index += 1) {
    const reflectionId = String(data.get(`reflection_id_${index}`) || '').trim();
    const reflectionPayload = {
      reflection_en: normaliseText(data.get(`reflection_en_${index}`)),
      reflection_so: normaliseText(data.get(`reflection_so_${index}`)),
      status: 'published',
      sort_order: index,
      updated_at: new Date().toISOString()
    };
    const hasReflectionText = Boolean(reflectionPayload.reflection_en || reflectionPayload.reflection_so);

    if (reflectionId) {
      const reflectionUpdate = await state.supabase
        .from('community_reflections')
        .update(reflectionPayload)
        .eq('id', Number(reflectionId));

      if (reflectionUpdate.error) return reflectionUpdate.error;
    } else if (hasReflectionText) {
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
  state.activeStoryId = savedStoryId;
  markClean();
  setMessage(`${creating ? 'Created' : 'Saved'} ${savedStoryCode}.`);
  await loadData();
  return true;
}


function performNavigation(request, discard = false) {
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
    render();
    return;
  }

  if (request.type === 'select-story') {
    setActiveStory(request.id);
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

  if (action === 'toggle-tag') {
    captureFormDraft();
    markDirty();
    const tagId = Number(button.dataset.id);
    if (state.selectedTagIds.has(tagId)) state.selectedTagIds.delete(tagId);
    else state.selectedTagIds.add(tagId);
    render();
  }
});

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
    captureFormDraft();
    state.searchQuery = field.value;
    render();
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
