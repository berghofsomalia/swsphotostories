import { getSupabaseClient, isSupabaseConfigured } from './supabase-client.js';

const app = document.getElementById('admin-app');

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
  searchQuery: '',
  statusFilter: 'all',
  districtFilter: 'all',
  busy: false,
  message: '',
  error: ''
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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

function storyReflection(story) {
  return (story.community_reflections || [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0] || null;
}

function storyTagIds(story) {
  return new Set((story.story_tags || []).map((row) => Number(row.tag_id)).filter(Boolean));
}

function setActiveStory(storyId) {
  state.activeStoryId = storyId ? Number(storyId) : null;
  const story = getActiveStory();
  state.selectedTagIds = story ? storyTagIds(story) : new Set();
}

function getActiveStory() {
  return state.stories.find((story) => Number(story.id) === Number(state.activeStoryId)) || null;
}

function setMessage(message = '', error = '') {
  state.message = message;
  state.error = error;
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

function renderTagsEditor() {
  return `
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

  if (!story) {
    return `
      <section class="admin-editor">
        <div class="admin-empty-editor">
          <div>
            <h2>Select a story</h2>
            <p>Choose a story from the list to edit text, community reflection and tags.</p>
          </div>
        </div>
      </section>
    `;
  }

  const reflection = storyReflection(story);

  return `
    <section class="admin-editor">
      <div class="admin-editor-header">
        <div class="admin-editor-title">
          <h2>${escapeHtml(story.code)}</h2>
          <p>Changes save directly to Supabase. Public pages will show saved changes after refresh.</p>
        </div>
      </div>

      <form class="admin-editor-form" data-form="story-editor">
        <input type="hidden" name="story_id" value="${story.id}">
        <input type="hidden" name="reflection_id" value="${reflection?.id || ''}">

        <div class="admin-editor-grid">
          <div class="admin-field">
            <label for="story-code">Code</label>
            <input id="story-code" value="${escapeHtml(story.code)}" disabled>
          </div>

          <div class="admin-field">
            <label for="story-status">Status</label>
            <select id="story-status" name="status">
              ${['draft', 'published', 'archived'].map((status) => `
                <option value="${status}" ${story.status === status ? 'selected' : ''}>${status}</option>
              `).join('')}
            </select>
          </div>

          <div class="admin-field">
            <label for="story-district">District</label>
            <select id="story-district" name="district_id">
              <option value="">No district</option>
              ${state.districts.map((district) => `
                <option value="${district.id}" ${Number(story.district_id) === Number(district.id) ? 'selected' : ''}>${escapeHtml(labelFor(district))}</option>
              `).join('')}
            </select>
          </div>

          <div class="admin-field">
            <label for="story-sort">Sort order</label>
            <input id="story-sort" name="sort_order" type="number" step="1" value="${Number(story.sort_order ?? 0)}">
          </div>

          <div class="admin-field is-wide">
            <label for="storyteller">Storyteller</label>
            <input id="storyteller" name="storyteller" value="${escapeHtml(story.storyteller || '')}" placeholder="Anonymous">
          </div>

          <h3 class="admin-section-title">Story text</h3>

          <div class="admin-field">
            <label for="teaser-en">Teaser English</label>
            <textarea id="teaser-en" name="teaser_en">${escapeHtml(story.teaser_en || '')}</textarea>
          </div>

          <div class="admin-field">
            <label for="teaser-so">Teaser Somali</label>
            <textarea id="teaser-so" name="teaser_so">${escapeHtml(story.teaser_so || '')}</textarea>
          </div>

          <div class="admin-field">
            <label for="story-en">Story English</label>
            <textarea id="story-en" name="story_en" class="admin-story-textarea">${escapeHtml(story.story_en || '')}</textarea>
          </div>

          <div class="admin-field">
            <label for="story-so">Story Somali</label>
            <textarea id="story-so" name="story_so" class="admin-story-textarea">${escapeHtml(story.story_so || '')}</textarea>
          </div>

          <h3 class="admin-section-title">Community reflection</h3>

          <div class="admin-field is-wide">
            <p class="admin-field-hint">This edits the first community reflection attached to the story. If none exists, saving non-empty reflection text creates one.</p>
          </div>

          <div class="admin-field">
            <label for="reflection-en">Reflection English</label>
            <textarea id="reflection-en" name="reflection_en">${escapeHtml(reflection?.reflection_en || '')}</textarea>
          </div>

          <div class="admin-field">
            <label for="reflection-so">Reflection Somali</label>
            <textarea id="reflection-so" name="reflection_so">${escapeHtml(reflection?.reflection_so || '')}</textarea>
          </div>

          <h3 class="admin-section-title">Tags</h3>
          ${renderTagsEditor()}
        </div>

        <div class="admin-actions">
          <div>
            ${state.error ? `<div class="admin-error">${escapeHtml(state.error)}</div>` : ''}
            ${state.message ? `<div class="admin-success">${escapeHtml(state.message)}</div>` : ''}
          </div>
          <button class="admin-button" type="submit" ${state.busy ? 'disabled' : ''}>${state.busy ? 'Saving…' : 'Save story'}</button>
        </div>
      </form>
    </section>
  `;
}

function renderAdminApp() {
  return `
    <div class="admin-app-frame">
      ${renderStoryList()}
      ${renderEditor()}
    </div>
  `;
}

function render() {
  if (!isSupabaseConfigured) {
    app.innerHTML = renderConfigCard();
    return;
  }

  if (!state.session) {
    app.innerHTML = renderAuthCard();
    return;
  }

  if (!state.adminProfile) {
    app.innerHTML = renderDeniedCard();
    return;
  }

  app.innerHTML = renderAdminApp();
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
  state.stories = [];
  state.activeStoryId = null;
  state.selectedTagIds = new Set();
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
        sort_order,
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

  if (!state.activeStoryId && state.stories.length > 0) {
    setActiveStory(state.stories[0].id);
  } else if (state.activeStoryId) {
    setActiveStory(state.activeStoryId);
  }

  render();
}

async function afterAuthChange() {
  state.adminProfile = await checkAdminAccess();
  if (!state.adminProfile) {
    render();
    return;
  }
  await loadData();
}

async function saveStory(form) {
  const story = getActiveStory();
  if (!story) return;

  const data = new FormData(form);
  const selectedTagRows = [...state.selectedTagIds].map((tagId) => ({
    story_id: story.id,
    tag_id: tagId
  }));

  const nextStatus = String(data.get('status') || 'draft');
  const storyPayload = {
    district_id: data.get('district_id') ? Number(data.get('district_id')) : null,
    storyteller: normaliseText(data.get('storyteller')),
    teaser_en: normaliseText(data.get('teaser_en')),
    teaser_so: normaliseText(data.get('teaser_so')),
    story_en: normaliseText(data.get('story_en')),
    story_so: normaliseText(data.get('story_so')),
    status: nextStatus,
    sort_order: Number(data.get('sort_order') || 0),
    updated_at: new Date().toISOString()
  };

  if (nextStatus === 'published' && !story.published_at) {
    storyPayload.published_at = new Date().toISOString();
  }

  state.busy = true;
  setMessage();
  render();

  const storyUpdate = await state.supabase
    .from('stories')
    .update(storyPayload)
    .eq('id', story.id);

  if (storyUpdate.error) {
    state.busy = false;
    setMessage('', storyUpdate.error.message || 'Could not save story.');
    render();
    return;
  }

  const reflectionId = String(data.get('reflection_id') || '').trim();
  const reflectionPayload = {
    reflection_en: normaliseText(data.get('reflection_en')),
    reflection_so: normaliseText(data.get('reflection_so')),
    status: 'published',
    sort_order: 0,
    updated_at: new Date().toISOString()
  };
  const hasReflectionText = Boolean(reflectionPayload.reflection_en || reflectionPayload.reflection_so);

  if (reflectionId) {
    const reflectionUpdate = await state.supabase
      .from('community_reflections')
      .update(reflectionPayload)
      .eq('id', Number(reflectionId));

    if (reflectionUpdate.error) {
      state.busy = false;
      setMessage('', reflectionUpdate.error.message || 'Story saved, but reflection could not be saved.');
      render();
      return;
    }
  } else if (hasReflectionText) {
    const reflectionInsert = await state.supabase
      .from('community_reflections')
      .insert({ ...reflectionPayload, story_id: story.id });

    if (reflectionInsert.error) {
      state.busy = false;
      setMessage('', reflectionInsert.error.message || 'Story saved, but reflection could not be created.');
      render();
      return;
    }
  }

  const deleteTags = await state.supabase
    .from('story_tags')
    .delete()
    .eq('story_id', story.id);

  if (deleteTags.error) {
    state.busy = false;
    setMessage('', deleteTags.error.message || 'Story saved, but old tags could not be removed.');
    render();
    return;
  }

  if (selectedTagRows.length > 0) {
    const insertTags = await state.supabase
      .from('story_tags')
      .insert(selectedTagRows);

    if (insertTags.error) {
      state.busy = false;
      setMessage('', insertTags.error.message || 'Story saved, but new tags could not be added.');
      render();
      return;
    }
  }

  state.busy = false;
  setMessage(`Saved ${story.code}.`);
  await loadData();
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
    await signOut();
    return;
  }

  if (action === 'select-story') {
    setActiveStory(button.dataset.id);
    setMessage();
    render();
    return;
  }

  if (action === 'toggle-tag') {
    const tagId = Number(button.dataset.id);
    if (state.selectedTagIds.has(tagId)) state.selectedTagIds.delete(tagId);
    else state.selectedTagIds.add(tagId);
    render();
  }
});

app.addEventListener('input', (event) => {
  const field = event.target.closest('[data-field]');
  if (!field) return;

  if (field.dataset.field === 'search') {
    state.searchQuery = field.value;
    render();
  }
});

app.addEventListener('change', (event) => {
  const field = event.target.closest('[data-field]');
  if (!field) return;

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
    state.session = session;
    state.user = session?.user || null;
    state.adminProfile = null;
    if (state.user) await afterAuthChange();
    else render();
  });

  if (state.user) await afterAuthChange();
  else render();
}

init().catch((error) => {
  console.error(error);
  setMessage('', error.message || 'Admin interface failed to initialise.');
  render();
});
