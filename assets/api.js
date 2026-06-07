import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_STORY_PHOTO_BUCKET,
  SUPABASE_URL,
  USE_SUPABASE_IMAGES
} from './supabase-config.js';
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);

function hasRealValue(value, placeholder) {
  return Boolean(value) && value !== placeholder && !String(value).includes('YOUR_');
}

const isSupabaseConfigured =
  hasRealValue(SUPABASE_URL, 'https://YOUR_PROJECT_ID.supabase.co') &&
  hasRealValue(SUPABASE_PUBLISHABLE_KEY, 'YOUR_PUBLISHABLE_OR_LEGACY_ANON_KEY');

let supabaseClientPromise = null;

async function getSupabase() {
  if (!isSupabaseConfigured) return null;
  if (!supabaseClientPromise) {
    supabaseClientPromise = import('https://esm.sh/@supabase/supabase-js@2')
      .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY));
  }
  return supabaseClientPromise;
}

const imageCache = new Map();
const IMAGE_CACHE_PREFIX = 'photostory_images_';

function readCachedImages(code) {
  if (!code) return null;
  if (imageCache.has(code)) return imageCache.get(code);
  try {
    const cached = sessionStorage.getItem(`${IMAGE_CACHE_PREFIX}${code}`);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    imageCache.set(code, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedImages(code, urls) {
  if (!code || !Array.isArray(urls) || urls.length === 0) return;
  imageCache.set(code, urls);
  try {
    sessionStorage.setItem(`${IMAGE_CACHE_PREFIX}${code}`, JSON.stringify(urls));
  } catch {}
}


function labelObject(en = '', so = '', extras = {}) {
  return {
    ...extras,
    en: en || so || '',
    so: so || en || ''
  };
}

function isPublishedStory(story, fallbackStatus = 'draft') {
  return String(story?.status || fallbackStatus).trim().toLowerCase() === 'published';
}

function normaliseReflectionType(value) {
  const type = String(value || '').trim().toLowerCase();
  return type === 'direct' || type === 'indirect' ? type : '';
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isExternalUrl(src = '') {
  return /^(https?:|data:|blob:|\/)/i.test(src);
}

function storagePathToPublicUrl(path = '') {
  const cleanPath = String(path || '').replace(/^\/+/, '');
  if (!isSupabaseConfigured || !USE_SUPABASE_IMAGES || !cleanPath) return '';
  const encodedPath = cleanPath
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `${SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/public/${SUPABASE_STORY_PHOTO_BUCKET}/${encodedPath}`;
}

function localStoryImage(src = '') {
  if (!src) return '';
  if (isExternalUrl(src)) return src;
  return new URL(`../stories/${src.replace(/^\/+/, '')}`, import.meta.url).href;
}

function placeholderImage(story) {
  const code = story?.code || story?.id || 'Story';
  const district = story?.district?.en || story?.districts?.label_en || 'Southwest State';
  const text = `${code} · ${district}`;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" role="img" aria-label="Photo placeholder for ${escapeSvg(text)}">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#20160f"/>
          <stop offset="0.52" stop-color="#7a452a"/>
          <stop offset="1" stop-color="#d8a663"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="38%" r="62%">
          <stop offset="0" stop-color="#fff3d2" stop-opacity="0.34"/>
          <stop offset="1" stop-color="#fff3d2" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#bg)"/>
      <rect width="1600" height="1000" fill="url(#glow)"/>
      <path d="M0 760 C280 665 420 810 690 710 C980 603 1120 710 1600 610 L1600 1000 L0 1000 Z" fill="#100d0b" opacity="0.28"/>
      <circle cx="1260" cy="245" r="112" fill="#f8d18c" opacity="0.28"/>
      <text x="80" y="120" fill="#fff6dc" font-family="Georgia, serif" font-size="44" opacity="0.78">Photo placeholder</text>
      <text x="80" y="860" fill="#fff6dc" font-family="Georgia, serif" font-size="92" font-weight="700">${escapeSvg(code)}</text>
      <text x="84" y="930" fill="#fff6dc" font-family="Arial, sans-serif" font-size="34" opacity="0.76">${escapeSvg(district)}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeSvg(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normaliseLegacyStory(story) {
  const primary = story.primaryTheme
    ? { ...story.primaryTheme, clusterSlug: slugify(story.cluster?.en || 'themes'), cluster: story.cluster || null }
    : null;
  const secondary = (story.secondaryThemes || []).map((tag) => ({
    ...tag,
    clusterSlug: slugify(story.cluster?.en || 'themes'),
    cluster: story.cluster || null
  }));
  const people = (story.actors || []).map((actor) => ({
    slug: slugify(actor),
    en: actor,
    so: actor,
    clusterSlug: 'people',
    cluster: labelObject('People', 'Dadka', { slug: 'people', sort_order: 0 })
  }));
  const topicTags = [primary, ...secondary].filter(Boolean);
  const tags = [...people, ...topicTags];

  return {
    ...story,
    id: story.code || story.id,
    code: story.code || story.id,
    status: story.status || 'published',
    storyteller: story.storyteller || 'Anonymous',
    images: (story.images || []).map(localStoryImage).filter(Boolean),
    imagesLoaded: true,
    tags,
    people,
    topicTags,
    tagSlugs: tags.map((tag) => tag.slug).filter(Boolean),
    reflections: story.reflection
      ? [{ type: normaliseReflectionType(story.reflection_type || story.reflectionType), text: story.reflection }]
      : [],
    reflectionCount: story.reflection ? 1 : 0
  };
}

async function fetchStoriesFromJson() {
  const url = new URL('../data/stories.json', import.meta.url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load fallback stories (HTTP ${response.status})`);
  const payload = await response.json();
  return (payload.stories || [])
    .filter((story) => isPublishedStory(story, 'published'))
    .map(normaliseLegacyStory);
}

function cleanStorageFiles(files = []) {
  return files
    .filter((file) => file?.name && !file.name.startsWith('.'))
    .filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return IMAGE_EXTENSIONS.has(ext);
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
}

function mapStoryPhotos(photos = [], story = {}) {
  const mapped = (photos || [])
    .filter((photo) => photo?.storage_path)
    .sort((a, b) => {
      const order = (a.sort_order ?? 9999) - (b.sort_order ?? 9999);
      if (order !== 0) return order;
      return String(a.storage_path).localeCompare(String(b.storage_path), undefined, { numeric: true, sensitivity: 'base' });
    })
    .map((photo, index) => ({
      id: photo.id,
      url: storagePathToPublicUrl(photo.storage_path),
      storagePath: photo.storage_path,
      alt: labelObject(photo.alt_en || story.storyteller || '', photo.alt_so || story.storyteller || ''),
      caption: labelObject(photo.caption_en, photo.caption_so),
      sortOrder: photo.sort_order ?? index + 1,
      isCover: Boolean(photo.is_cover)
    }))
    .filter((photo) => photo.url);

  if (mapped.length && !mapped.some((photo) => photo.isCover)) {
    mapped[0].isCover = true;
  }

  return mapped;
}

async function fetchImagesForStory(story) {
  const photoUrls = (story?.photos || []).map((photo) => photo.url).filter(Boolean);
  if (photoUrls.length) return photoUrls;
  if (story?.imagesLoaded && story.images?.length) return story.images;

  if (!isSupabaseConfigured || !USE_SUPABASE_IMAGES || !story?.code) {
    return [placeholderImage(story)];
  }

  const cached = readCachedImages(story.code);
  if (cached?.length) return cached;

  const supabase = await getSupabase();
  const { data, error } = await supabase.storage
    .from(SUPABASE_STORY_PHOTO_BUCKET)
    .list(story.code, {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' }
    });

  if (error) {
    console.warn(`Could not load photos for ${story.code}`, error);
    return [placeholderImage(story)];
  }

  const urls = cleanStorageFiles(data).map((file) => {
    const path = `${story.code}/${file.name}`;
    const { data: urlData } = supabase.storage
      .from(SUPABASE_STORY_PHOTO_BUCKET)
      .getPublicUrl(path);
    return urlData.publicUrl;
  });

  const resolved = urls.length > 0 ? urls : [placeholderImage(story)];
  writeCachedImages(story.code, resolved);
  return resolved;
}

export function getPlaceholderImage(story) {
  return placeholderImage(story);
}

export async function ensureStoryImages(story) {
  if (!story || story.imagesLoaded || story.imagesLoading) return story;
  story.imagesLoading = true;
  try {
    story.images = await fetchImagesForStory(story);
    story.imagesLoaded = true;
  } catch (error) {
    console.warn(`Could not hydrate photos for ${story.code || story.id}`, error);
    story.images = story.images?.length ? story.images : [placeholderImage(story)];
    story.imagesLoaded = true;
  } finally {
    story.imagesLoading = false;
  }
  return story;
}

function mapTag(rawTag) {
  if (!rawTag) return null;
  const rawCluster = rawTag.tag_clusters || {};
  const clusterSlug = rawCluster.slug || 'other';
  const cluster = labelObject(rawCluster.label_en || 'Other', rawCluster.label_so || '', {
    id: rawCluster.id,
    slug: clusterSlug,
    sort_order: rawCluster.sort_order ?? 999
  });

  return labelObject(rawTag.label_en || rawTag.slug, rawTag.label_so || rawTag.label_en || rawTag.slug, {
    id: rawTag.id,
    slug: rawTag.slug || slugify(rawTag.label_en),
    sort_order: rawTag.sort_order ?? 999,
    cluster,
    clusterSlug
  });
}

function mapCatalogueCluster(rawCluster = {}) {
  const cluster = labelObject(rawCluster.label_en || rawCluster.slug, rawCluster.label_so || rawCluster.label_en || rawCluster.slug, {
    id: rawCluster.id,
    slug: rawCluster.slug || slugify(rawCluster.label_en),
    sort_order: rawCluster.sort_order ?? 999
  });

  const tags = (rawCluster.tags || [])
    .map((tag) => mapTag({ ...tag, tag_clusters: rawCluster }))
    .filter(Boolean)
    .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999) || a.en.localeCompare(b.en));

  return { ...cluster, tags };
}

function publishedReflections(reflections = []) {
  return reflections
    .filter((reflection) => !reflection.status || reflection.status === 'published')
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

function mapReflection(reflections = []) {
  const published = publishedReflections(reflections);

  return labelObject(
    published.map((reflection) => reflection.reflection_en).filter(Boolean).join('\n\n'),
    published.map((reflection) => reflection.reflection_so).filter(Boolean).join('\n\n')
  );
}

function mapReflections(reflections = []) {
  return publishedReflections(reflections)
    .map((reflection) => ({
      id: reflection.id,
      type: normaliseReflectionType(reflection.reflection_type),
      text: labelObject(reflection.reflection_en, reflection.reflection_so)
    }))
    .filter((reflection) => reflection.text.en || reflection.text.so);
}

async function mapSupabaseStory(row) {
  const district = row.districts
    ? labelObject(row.districts.label_en, row.districts.label_so, {
        id: row.districts.id,
        slug: row.districts.slug,
        sort_order: row.districts.sort_order ?? 999
      })
    : labelObject('', '', { slug: '' });

  const tags = (row.story_tags || [])
    .map((entry) => mapTag(entry.tags))
    .filter(Boolean)
    .sort((a, b) => {
      const clusterSort = (a.cluster?.sort_order ?? 999) - (b.cluster?.sort_order ?? 999);
      if (clusterSort !== 0) return clusterSort;
      return (a.sort_order ?? 999) - (b.sort_order ?? 999) || a.en.localeCompare(b.en);
    });

  const people = tags.filter((tag) => tag.clusterSlug === 'people');
  const topicTags = tags.filter((tag) => tag.clusterSlug !== 'people');
  const firstTopic = topicTags[0] || labelObject('Untagged', 'Calaamad la\'aan', { slug: 'untagged', cluster: null, clusterSlug: '' });

  const story = {
    id: row.code,
    code: row.code,
    dbId: row.id,
    district,
    status: row.status || 'draft',
    storyteller: row.storyteller || 'Anonymous',
    summary: labelObject(row.teaser_en, row.teaser_so),
    story: labelObject(row.story_en, row.story_so),
    reflection: mapReflection(row.community_reflections || []),
    reflections: mapReflections(row.community_reflections || []),
    reflectionCount: publishedReflections(row.community_reflections || []).length,
    tags,
    people,
    topicTags,
    tagSlugs: tags.map((tag) => tag.slug).filter(Boolean),
    primaryTheme: firstTopic,
    secondaryThemes: topicTags.slice(1),
    actors: people.map((tag) => tag.slug),
    cluster: firstTopic.cluster || labelObject('', '', { slug: '' }),
    publishedAt: row.published_at,
    sortOrder: row.sort_order ?? 0,
    images: [],
    imagesLoaded: false,
    imagesLoading: false
  };

  const dbPhotos = mapStoryPhotos(row.story_photos || [], story);
  if (dbPhotos.length) {
    story.photos = dbPhotos;
    story.images = dbPhotos.map((photo) => photo.url);
    story.coverImage = (dbPhotos.find((photo) => photo.isCover) || dbPhotos[0]).url;
    story.imagesLoaded = true;
    writeCachedImages(story.code, story.images);
  } else {
    story.photos = [];
    const cachedImages = readCachedImages(story.code);
    if (cachedImages?.length) {
      story.images = cachedImages;
      story.imagesLoaded = true;
    } else {
      story.images = [placeholderImage(story)];
    }
  }

  return story;
}

const STORY_PHOTOS_SELECT = `
  story_photos (
    id,
    storage_path,
    alt_so,
    alt_en,
    caption_so,
    caption_en,
    sort_order,
    is_cover
  )
`;

function isStoryPhotosPermissionError(error) {
  const text = [
    error?.message,
    error?.details,
    error?.hint,
    error?.code
  ].filter(Boolean).join(' ').toLowerCase();
  return text.includes('story_photos') && (text.includes('permission') || text.includes('grant'));
}

async function fetchHomeStoriesFromSupabase({ includePhotos = true } = {}) {
  const supabase = await getSupabase();
  const photosSelect = includePhotos ? `,\n      ${STORY_PHOTOS_SELECT}` : '';
  const { data, error } = await supabase
    .from('stories')
    .select(`
      id,
      code,
      storyteller,
      teaser_so,
      teaser_en,
      status,
      sort_order,
      published_at,
      districts (
        id,
        slug,
        label_so,
        label_en,
        sort_order
      )${photosSelect}
    `)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false, nullsFirst: false });

  if (error) throw error;

  const mapped = await Promise.all((data || []).map(mapSupabaseStory));
  return mapped.filter((story) => story.code && isPublishedStory(story));
}

async function fetchStoriesFromSupabase({ includePhotos = true } = {}) {
  const supabase = await getSupabase();
  const photosSelect = includePhotos ? `,\n      ${STORY_PHOTOS_SELECT}` : '';
  const { data, error } = await supabase
    .from('stories')
    .select(`
      id,
      code,
      storyteller,
      teaser_so,
      story_so,
      teaser_en,
      story_en,
      status,
      sort_order,
      published_at,
      districts (
        id,
        slug,
        label_so,
        label_en,
        sort_order
      ),
      story_tags (
        tags (
          id,
          slug,
          label_so,
          label_en,
          sort_order,
          tag_clusters (
            id,
            slug,
            label_so,
            label_en,
            sort_order
          )
        )
      ),
      community_reflections (
        id,
        reflection_so,
        reflection_en,
        reflection_type,
        sort_order,
        status
      )${photosSelect}
    `)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false, nullsFirst: false });

  if (error) throw error;

  const mapped = await Promise.all((data || []).map(mapSupabaseStory));
  return mapped.filter((story) => story.code && isPublishedStory(story));
}


function catalogueFromStories(stories = []) {
  const clusters = new Map();

  stories.forEach((story) => {
    (story.tags || []).forEach((tag) => {
      const cluster = tag.cluster || labelObject('Other', 'Other', { slug: tag.clusterSlug || 'other', sort_order: 999 });
      const clusterSlug = cluster.slug || tag.clusterSlug || 'other';
      if (!clusters.has(clusterSlug)) {
        clusters.set(clusterSlug, { ...cluster, slug: clusterSlug, tags: [] });
      }
      clusters.get(clusterSlug).tags.push(tag);
    });
  });

  return [...clusters.values()]
    .map((cluster) => {
      const tagMap = new Map();
      cluster.tags.forEach((tag) => {
        if (!tag.slug || tagMap.has(tag.slug)) return;
        tagMap.set(tag.slug, tag);
      });
      return {
        ...cluster,
        tags: [...tagMap.values()].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999) || a.en.localeCompare(b.en))
      };
    })
    .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999) || a.en.localeCompare(b.en));
}

async function fetchTagCatalogueFromSupabase() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('tag_clusters')
    .select(`
      id,
      slug,
      label_so,
      label_en,
      sort_order,
      tags (
        id,
        slug,
        label_so,
        label_en,
        sort_order
      )
    `)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data || [])
    .map(mapCatalogueCluster)
    .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999) || a.en.localeCompare(b.en));
}

export async function fetchTagCatalogue(stories = []) {
  if (!isSupabaseConfigured) return catalogueFromStories(stories);
  try {
    return await fetchTagCatalogueFromSupabase();
  } catch (error) {
    console.warn('Supabase tag catalogue fetch failed. Falling back to tags found on stories.', error);
    return catalogueFromStories(stories);
  }
}

export async function fetchStories() {
  if (!isSupabaseConfigured) {
    console.info('Supabase is not configured. Loading fallback data/stories.json.');
    return fetchStoriesFromJson();
  }

  try {
    return await fetchStoriesFromSupabase({ includePhotos: true });
  } catch (error) {
    if (isStoryPhotosPermissionError(error)) {
      console.warn('Supabase story_photos is not readable by the public key. Falling back to storage listing for images.', error);
      return fetchStoriesFromSupabase({ includePhotos: false });
    }
    console.error('Supabase story fetch failed.', error);
    throw error;
  }
}

export async function fetchHomeStories() {
  if (!isSupabaseConfigured) {
    console.info('Supabase is not configured. Loading fallback data/stories.json.');
    return fetchStoriesFromJson();
  }

  try {
    return await fetchHomeStoriesFromSupabase({ includePhotos: true });
  } catch (error) {
    if (isStoryPhotosPermissionError(error)) {
      console.warn('Supabase story_photos is not readable by the public key. Falling back to storage listing for home images.', error);
      return fetchHomeStoriesFromSupabase({ includePhotos: false });
    }
    console.error('Supabase home story fetch failed.', error);
    throw error;
  }
}
