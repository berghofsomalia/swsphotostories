/**
 * Data access layer.
 *
 * All story data and i18n content flows through this module.
 * To switch from flat JSON files to a database or REST API, replace the
 * function bodies below — nothing else in the codebase needs to change.
 */

export async function fetchStories() {
  // ── JSON (test) ──────────────────────────────────────────────────────────
  const url = new URL('../data/stories.json', import.meta.url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load stories (HTTP ${response.status})`);
  const payload = await response.json();
  return payload.stories || [];

  // ── REST API (replace above when backend is ready) ────────────────────────
  // const response = await fetch('/api/stories');
  // if (!response.ok) throw new Error(`API error: ${response.status}`);
  // return response.json();
}
