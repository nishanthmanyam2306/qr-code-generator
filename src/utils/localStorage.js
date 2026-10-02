// Small wrapper around window.localStorage. Every call is wrapped in try/catch
// because storage can be blocked (private mode) or full.

const RECENT_KEY = 'qr-generator:recent';
const THEME_KEY = 'qr-generator:theme';

export const MAX_RECENT = 8;

const isEntry = (e) =>
  e && typeof e === 'object' && typeof e.id === 'string' &&
  typeof e.type === 'string' && e.data && typeof e.data === 'object' &&
  e.settings && typeof e.settings === 'object';

export function entryKey(entry) {
  return JSON.stringify([entry.type, entry.data, entry.settings]);
}

export function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter(isEntry) : [];
  } catch {
    return [];
  }
}

function persist(list) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

/** Adds an entry to the top. An identical earlier entry is replaced, not duplicated. */
export function saveRecent(entry) {
  const key = entryKey(entry);
  const list = loadRecent().filter((e) => entryKey(e) !== key);
  list.unshift(entry);
  const trimmed = list.slice(0, MAX_RECENT);
  persist(trimmed);
  return trimmed;
}

export function removeRecent(id) {
  const list = loadRecent().filter((e) => e.id !== id);
  persist(list);
  return list;
}

export function clearRecent() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    /* ignore */
  }
  return [];
}

export function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}
