import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadRecent, saveRecent, removeRecent, clearRecent, loadTheme, saveTheme, MAX_RECENT,
} from '../src/utils/localStorage';

/** A minimal in-memory stand-in for window.localStorage. */
function makeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    _map: map,
  };
}

const entry = (n, over = {}) => ({
  id: `id-${n}`, type: 'text', data: { text: `item ${n}` }, settings: { fg: '#000000' },
  label: `item ${n}`, createdAt: n, ...over,
});

let storage;
beforeEach(() => {
  storage = makeStorage();
  vi.stubGlobal('localStorage', storage);
});

describe('recent codes', () => {
  it('starts empty', () => expect(loadRecent()).toEqual([]));

  it('saves an entry and reads it back', () => {
    saveRecent(entry(1));
    expect(loadRecent()).toEqual([entry(1)]);
  });

  it('puts the newest entry first', () => {
    saveRecent(entry(1));
    saveRecent(entry(2));
    expect(loadRecent().map((e) => e.id)).toEqual(['id-2', 'id-1']);
  });

  it('survives a page refresh (a fresh read from the same storage)', () => {
    saveRecent(entry(1));
    saveRecent(entry(2));
    // Simulate a reload: nothing in memory, only what is in storage.
    const afterReload = loadRecent();
    expect(afterReload).toHaveLength(2);
    expect(afterReload[0].data.text).toBe('item 2');
  });

  it('does not duplicate identical codes, it moves them to the top', () => {
    saveRecent(entry(1));
    saveRecent(entry(2));
    saveRecent(entry(3, { data: { text: 'item 1' } })); // same content as entry 1
    const list = loadRecent();
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe('id-3');
  });

  it('keeps only the most recent MAX_RECENT entries', () => {
    for (let i = 1; i <= MAX_RECENT + 4; i += 1) saveRecent(entry(i));
    const list = loadRecent();
    expect(list).toHaveLength(MAX_RECENT);
    expect(list[0].id).toBe(`id-${MAX_RECENT + 4}`);
  });

  it('removes one entry', () => {
    saveRecent(entry(1));
    saveRecent(entry(2));
    expect(removeRecent('id-1').map((e) => e.id)).toEqual(['id-2']);
    expect(loadRecent().map((e) => e.id)).toEqual(['id-2']);
  });

  it('clears everything', () => {
    saveRecent(entry(1));
    expect(clearRecent()).toEqual([]);
    expect(loadRecent()).toEqual([]);
  });

  it('ignores corrupted or malformed data', () => {
    storage.setItem('qr-generator:recent', '{not json');
    expect(loadRecent()).toEqual([]);
    storage.setItem('qr-generator:recent', JSON.stringify([{ nope: true }, entry(1)]));
    expect(loadRecent()).toEqual([entry(1)]);
    storage.setItem('qr-generator:recent', JSON.stringify({ not: 'an array' }));
    expect(loadRecent()).toEqual([]);
  });

  it('does not crash when storage is full or blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceededError'); },
      removeItem: () => { throw new Error('blocked'); },
    });
    expect(() => saveRecent(entry(1))).not.toThrow();
    expect(() => clearRecent()).not.toThrow();
  });

  it('does not crash when localStorage does not exist at all', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(loadRecent()).toEqual([]);
    expect(() => saveRecent(entry(1))).not.toThrow();
  });
});

describe('theme', () => {
  it('saves and loads the chosen theme', () => {
    saveTheme('dark');
    expect(loadTheme()).toBe('dark');
    saveTheme('light');
    expect(loadTheme()).toBe('light');
  });
  it('falls back to light when nothing valid is stored', () => {
    storage.setItem('qr-generator:theme', 'purple');
    expect(loadTheme()).toBe('light');
  });
});
