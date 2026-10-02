import { describe, it, expect } from 'vitest';
import jsQR from 'jsqr';
import {
  createMatrix, buildPath, toSVG, getWarnings, contrastRatio, logoCoverage, DEFAULT_SETTINGS,
} from '../src/utils/qrGenerator';
import { formatQRData } from '../src/utils/qrFormatter';

const settings = (over = {}) => ({ ...DEFAULT_SETTINGS, ...over });
const darkCount = (m) => m.cells.flat().filter(Boolean).length;

/** Paints the matrix into an RGBA buffer, like a screenshot of the code. */
function rasterize(matrix, scale = 8, margin = 4) {
  const total = matrix.size + margin * 2;
  const w = total * scale;
  const data = new Uint8ClampedArray(w * w * 4).fill(255);
  matrix.cells.forEach((row, r) => row.forEach((dark, c) => {
    if (!dark) return;
    for (let y = 0; y < scale; y += 1) {
      for (let x = 0; x < scale; x += 1) {
        const i = (((r + margin) * scale + y) * w + (c + margin) * scale + x) * 4;
        data[i] = 0; data[i + 1] = 0; data[i + 2] = 0;
      }
    }
  }));
  return { data, w };
}

const decode = (text, ecl = 'M') => {
  const { data, w } = rasterize(createMatrix(text, ecl));
  return jsQR(data, w, w)?.data;
};

describe('createMatrix', () => {
  it('produces a square matrix whose size matches the QR version', () => {
    const m = createMatrix('https://example.com', 'M');
    expect(m.cells).toHaveLength(m.size);
    expect(m.cells.every((row) => row.length === m.size)).toBe(true);
    expect(m.size).toBe(17 + 4 * m.version);
  });
  it('is deterministic', () => {
    expect(createMatrix('hello', 'Q').cells).toEqual(createMatrix('hello', 'Q').cells);
  });
  it('higher error correction never makes the code smaller', () => {
    const text = 'https://example.com/some/longer/path?with=query';
    const sizes = ['L', 'M', 'Q', 'H'].map((l) => createMatrix(text, l).size);
    expect([...sizes].sort((a, b) => a - b)).toEqual(sizes);
  });
  it('handles non-English text and emoji', () => {
    expect(() => createMatrix('नमस्ते 👋 こんにちは', 'M')).not.toThrow();
  });
  it('throws a friendly TOO_LONG error when data does not fit', () => {
    expect(() => createMatrix('a'.repeat(5000), 'H')).toThrowError(/too much data/);
    try { createMatrix('a'.repeat(5000), 'L'); } catch (e) { expect(e.code).toBe('TOO_LONG'); }
  });
});

describe('scannability (decoded with jsQR)', () => {
  it.each([
    ['url', { url: 'example.com' }],
    ['text', { text: 'Just some plain text' }],
    ['email', { address: 'name@example.com', subject: 'Hello there' }],
    ['phone', { phone: '+91 98765 43210' }],
    ['wifi', { ssid: 'Home;Net', password: 'pa:ss"word', encryption: 'WPA' }],
  ])('a %s code decodes back to exactly what was encoded', (type, data) => {
    const expected = formatQRData(type, data);
    expect(decode(expected)).toBe(expected);
  });

  it.each(['L', 'M', 'Q', 'H'])('decodes at error correction level %s', (ecl) => {
    expect(decode('https://example.com', ecl)).toBe('https://example.com');
  });
});

describe('buildPath / toSVG', () => {
  const m = createMatrix('https://example.com', 'M');

  it('draws one square per dark module', () => {
    const { d, total } = buildPath(m, settings());
    expect((d.match(/M/g) || []).length).toBe(darkCount(m));
    expect(total).toBe(m.size + 8);
  });
  it('respects the margin', () => {
    expect(buildPath(m, settings({ margin: 0 })).total).toBe(m.size);
    expect(buildPath(m, settings({ margin: 10 })).total).toBe(m.size + 20);
  });
  it('keeps the same number of modules for rounded and dot patterns', () => {
    ['rounded', 'dots'].forEach((pattern) => {
      const { d } = buildPath(m, settings({ pattern }));
      expect((d.match(/M/g) || []).length).toBe(darkCount(m));
    });
  });
  it('leaves room for a logo by removing modules under it', () => {
    const withLogo = buildPath(m, settings({ logo: 'data:image/png;base64,AAAA' })).d;
    expect((withLogo.match(/M/g) || []).length).toBeLessThan(darkCount(m));
  });

  it('produces an SVG carrying the chosen colours', () => {
    const svg = toSVG(m, settings({ fg: '#112233', bg: '#ffeeff' }));
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('fill="#112233"');
    expect(svg).toContain('fill="#ffeeff"');
    expect(svg).toContain(`viewBox="0 0 ${m.size + 8} ${m.size + 8}"`);
  });
  it('adds a gradient definition only when asked', () => {
    expect(toSVG(m, settings())).not.toContain('linearGradient');
    const svg = toSVG(m, settings({ gradient: true, fg: '#000000', fg2: '#4338ca' }));
    expect(svg).toContain('linearGradient');
    expect(svg).toContain('url(#qr-gradient)');
  });
  it('embeds the logo in the SVG', () => {
    expect(toSVG(m, settings({ logo: 'data:image/png;base64,AAAA' }))).toContain('<image');
  });
});

describe('contrastRatio', () => {
  it('matches the known extremes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });
});

describe('getWarnings', () => {
  const m = createMatrix('https://example.com', 'M');
  const ids = (s) => getWarnings(s, m).map((w) => w.id);

  it('has no warnings for the default black-on-white code', () => {
    expect(getWarnings(settings(), m)).toEqual([]);
  });
  it('flags very low contrast as an error', () => {
    const w = getWarnings(settings({ fg: '#cccccc', bg: '#ffffff' }), m).find((x) => x.id === 'contrast');
    expect(w.level).toBe('error');
  });
  it('flags borderline contrast as a warning', () => {
    const w = getWarnings(settings({ fg: '#8a8a8a', bg: '#ffffff' }), m).find((x) => x.id === 'contrast');
    expect(w.level).toBe('warn');
  });
  it('flags inverted colours', () => {
    expect(ids(settings({ fg: '#ffffff', bg: '#000000' }))).toContain('inverted');
  });
  it('checks both ends of a gradient', () => {
    expect(ids(settings({ gradient: true, fg: '#000000', fg2: '#dddddd' }))).toContain('contrast');
  });
  it('flags a margin below 4', () => {
    expect(ids(settings({ margin: 2 }))).toContain('margin');
    expect(ids(settings({ margin: 4 }))).not.toContain('margin');
  });
  it('flags a size that makes modules too small', () => {
    // 'https://example.com' is a 25-module code: 128px / (25 + 2*4) = 3px per square, which is fine
    expect(ids(settings({ size: 128 }))).not.toContain('small');
    // ...but a 10-module margin squeezes it to 2px per square
    expect(ids(settings({ size: 128, margin: 10 }))).toContain('small');
    const big = createMatrix('x'.repeat(400), 'M');
    expect(getWarnings(settings({ size: 128 }), big).map((w) => w.id)).toContain('small');
  });
  it('flags a logo when error correction is too low, but not at H', () => {
    const logo = 'data:image/png;base64,AAAA';
    expect(ids(settings({ logo, ecl: 'M' }))).toContain('logo');
    const h = createMatrix('https://example.com', 'H');
    expect(getWarnings(settings({ logo, ecl: 'H' }), h).map((w) => w.id)).not.toContain('logo');
    expect(logoCoverage(h, settings({ logo }))).toBeGreaterThan(0);
    expect(logoCoverage(h, settings())).toBe(0);
  });
  it('adds an info note for non-square patterns', () => {
    expect(ids(settings({ pattern: 'dots' }))).toContain('pattern');
  });
});
