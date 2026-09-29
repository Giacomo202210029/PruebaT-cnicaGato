import { getJson, putJson } from './store.js';
import { CLEAN_PHRASES, RELAPSE_PHRASES } from '../../shared/constants.js';

const CONTENT_KEY = 'config/content.json';

const DEFAULTS = {
  cleanPhrases: CLEAN_PHRASES,
  relapsePhrases: RELAPSE_PHRASES,
  scienceFacts: [],
};

/** Admin-editable copy (phrases + awareness facts), seeded from the built-in defaults. */
export async function getContent() {
  const stored = await getJson(CONTENT_KEY);
  return { ...DEFAULTS, ...stored };
}

export async function saveContent(patch) {
  const current = await getContent();
  const merged = {
    cleanPhrases: sanitizeList(patch.cleanPhrases) ?? current.cleanPhrases,
    relapsePhrases: sanitizeList(patch.relapsePhrases) ?? current.relapsePhrases,
    scienceFacts: sanitizeList(patch.scienceFacts) ?? current.scienceFacts,
  };
  await putJson(CONTENT_KEY, merged, { allowOverwrite: true });
  return merged;
}

function sanitizeList(list) {
  if (!Array.isArray(list)) return null;
  return list.map((s) => String(s).trim()).filter(Boolean);
}

export function pickRandom(list) {
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

/** Same pick for everyone on a given date — a shared "fact of the day" rather than per-view randomness. */
export function pickForDate(list, dateStr) {
  if (!list || list.length === 0) return null;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
