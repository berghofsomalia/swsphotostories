/**
 * Data access layer.
 *
 * All story data flows through this single module. To switch from the flat
 * JSON file to a database or REST API, replace the body of fetchStories()
 * below — nothing else in the codebase needs to change.
 *
 * Expected return shape: an array of story objects matching the schema in
 * data/stories.json.
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
