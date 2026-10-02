import qrcode from 'qrcode-generator';

// The library's default text encoder drops anything outside Latin-1.
// Swap in a UTF-8 encoder so emoji and non-English text work.
qrcode.stringToBytes = (s) => Array.from(new TextEncoder().encode(s));

export const ECL_RECOVERY = { L: 0.07, M: 0.15, Q: 0.25, H: 0.3 };

export const DEFAULT_SETTINGS = {
  size: 512,
  fg: '#000000',
  bg: '#ffffff',
  fg2: '#4338ca', // second colour, only used when gradient is on
  gradient: false,
  ecl: 'M',
  margin: 4,
  pattern: 'square', // 'square' | 'rounded' | 'dots'
  logo: null, // data URL
};

/* ------------------------------------------------------------------ */
/* Matrix                                                              */
/* ------------------------------------------------------------------ */

/** Encodes text and returns { size, version, cells } where cells[r][c] is true for dark. */
export function createMatrix(text, ecl = 'M') {
  const qr = qrcode(0, ecl);
  try {
    qr.addData(text);
    qr.make();
  } catch {
    const err = new Error('That is too much data for a QR code at this error correction level. Shorten it or choose a lower level.');
    err.code = 'TOO_LONG';
    throw err;
  }
  const size = qr.getModuleCount();
  const cells = [];
  for (let r = 0; r < size; r += 1) {
    const row = new Array(size);
    for (let c = 0; c < size; c += 1) row[c] = qr.isDark(r, c);
    cells.push(row);
  }
  return { size, version: (size - 17) / 4, cells };
}

const isFinder = (r, c, n) =>
  (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

/** Square (in module units) reserved for a centred logo, or null. */
export function logoRect(matrix, settings) {
  if (!settings.logo) return null;
  let side = Math.round(matrix.size * 0.2);
  if (side % 2 === 0) side += 1; // matrix size is odd, so an odd side centres exactly
  const start = (matrix.size - side) / 2;
  return { x: start, y: start, side };
}

const inClearZone = (r, c, rect) =>
  rect && r >= rect.y - 1 && r < rect.y + rect.side + 1 && c >= rect.x - 1 && c < rect.x + rect.side + 1;

/** Fraction of modules removed to make room for the logo. */
export function logoCoverage(matrix, settings) {
  const rect = logoRect(matrix, settings);
  if (!rect) return 0;
  return ((rect.side + 2) ** 2) / (matrix.size ** 2);
}

/* ------------------------------------------------------------------ */
/* Shapes (one SVG path string drives both the canvas and the SVG)     */
/* ------------------------------------------------------------------ */

const f = (v) => +v.toFixed(3);

function shapePath(kind, x, y) {
  if (kind === 'dots') {
    const r = 0.45;
    return `M${f(x + 0.5 - r)} ${f(y + 0.5)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
  }
  if (kind === 'rounded') {
    const r = 0.3;
    const s = f(1 - 2 * r);
    return `M${f(x + r)} ${y}h${s}a${r} ${r} 0 0 1 ${r} ${r}v${s}a${r} ${r} 0 0 1 ${-r} ${r}h${-s}a${r} ${r} 0 0 1 ${-r} ${-r}v${-s}a${r} ${r} 0 0 1 ${r} ${-r}z`;
  }
  return `M${x} ${y}h1v1h-1z`;
}

/** Builds the dark-module path in module units, including the quiet-zone offset. */
export function buildPath(matrix, settings) {
  const { cells, size } = matrix;
  const margin = settings.margin;
  const clear = logoRect(matrix, settings);
  let d = '';
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (!cells[r][c] || inClearZone(r, c, clear)) continue;
      // The three corner "eyes" stay square so scanners can always find them.
      const kind = isFinder(r, c, size) ? 'square' : settings.pattern;
      d += shapePath(kind, c + margin, r + margin);
    }
  }
  return { d, total: size + margin * 2 };
}

/* ------------------------------------------------------------------ */
/* Canvas / SVG output                                                 */
/* ------------------------------------------------------------------ */

/**
 * Draws the QR code. The scale is a whole number of pixels per module so
 * edges stay sharp, which means the final size can be slightly under targetPx.
 */
export function renderToCanvas(canvas, matrix, settings, targetPx, logoImg = null) {
  const { d, total } = buildPath(matrix, settings);
  const scale = Math.max(1, Math.floor(targetPx / total));
  const px = total * scale;
  canvas.width = px;
  canvas.height = px;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = settings.bg;
  ctx.fillRect(0, 0, px, px);

  ctx.save();
  ctx.scale(scale, scale);
  if (settings.gradient) {
    const g = ctx.createLinearGradient(0, 0, total, total);
    g.addColorStop(0, settings.fg);
    g.addColorStop(1, settings.fg2);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = settings.fg;
  }
  ctx.fill(new Path2D(d));

  const rect = logoRect(matrix, settings);
  if (rect && logoImg && logoImg.width && logoImg.height) {
    const ratio = Math.min(rect.side / logoImg.width, rect.side / logoImg.height);
    const w = logoImg.width * ratio;
    const h = logoImg.height * ratio;
    ctx.drawImage(
      logoImg,
      settings.margin + rect.x + (rect.side - w) / 2,
      settings.margin + rect.y + (rect.side - h) / 2,
      w,
      h,
    );
  }
  ctx.restore();
  return { px, scale };
}

export function toSVG(matrix, settings) {
  const { d, total } = buildPath(matrix, settings);
  const rect = logoRect(matrix, settings);
  const fill = settings.gradient ? 'url(#qr-gradient)' : settings.fg;
  const crisp = settings.pattern === 'square' ? ' shape-rendering="crispEdges"' : '';

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${total} ${total}" width="${settings.size}" height="${settings.size}"${crisp}>`;
  if (settings.gradient) {
    svg += `<defs><linearGradient id="qr-gradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${total}" y2="${total}"><stop offset="0" stop-color="${settings.fg}"/><stop offset="1" stop-color="${settings.fg2}"/></linearGradient></defs>`;
  }
  svg += `<rect width="${total}" height="${total}" fill="${settings.bg}"/>`;
  svg += `<path d="${d}" fill="${fill}"/>`;
  if (rect) {
    const x = settings.margin + rect.x;
    const y = settings.margin + rect.y;
    svg += `<image href="${settings.logo}" xlink:href="${settings.logo}" x="${x}" y="${y}" width="${rect.side}" height="${rect.side}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return `${svg}</svg>`;
}

/* ------------------------------------------------------------------ */
/* Browser helpers (download / copy / image loading)                   */
/* ------------------------------------------------------------------ */

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the logo image.'));
    img.src = src;
  });
}

export function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image.'))), 'image/png');
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyCanvasToClipboard(canvas) {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    throw new Error('Your browser does not allow copying images here.');
  }
  const blob = await canvasToBlob(canvas);
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}

/* ------------------------------------------------------------------ */
/* Scan reliability                                                    */
/* ------------------------------------------------------------------ */

export function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA, hexB) {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Returns a list of { id, level: 'error' | 'warn' | 'info', message }. */
export function getWarnings(settings, matrix) {
  const out = [];
  const add = (id, level, message) => out.push({ id, level, message });

  const colours = settings.gradient ? [settings.fg, settings.fg2] : [settings.fg];
  const ratio = Math.min(...colours.map((c) => contrastRatio(c, settings.bg)));
  if (ratio < 3) {
    add('contrast', 'error', `Contrast is very low (${ratio.toFixed(1)}:1). Most scanners will not read this code. Aim for at least 4.5:1.`);
  } else if (ratio < 4.5) {
    add('contrast', 'warn', `Contrast is on the low side (${ratio.toFixed(1)}:1). The code may fail in dim light or when printed. Aim for at least 4.5:1.`);
  }

  const bgLum = relativeLuminance(settings.bg);
  if (colours.some((c) => relativeLuminance(c) > bgLum)) {
    add('inverted', 'warn', 'The code is lighter than its background. Some scanner apps cannot read inverted codes, so use a dark code on a light background.');
  }

  if (settings.margin < 4) {
    add('margin', 'warn', `A margin of ${settings.margin} is below the recommended 4 modules. Scanners use that blank border to find the edges of the code.`);
  }

  if (matrix) {
    const total = matrix.size + settings.margin * 2;
    const perModule = Math.floor(settings.size / total);
    if (perModule < 3) {
      add('small', 'warn', `At ${settings.size}px each square is only ${perModule}px wide. Increase the size so phones can resolve it.`);
    }

    if (settings.logo) {
      const coverage = logoCoverage(matrix, settings);
      const safe = ECL_RECOVERY[settings.ecl] * 0.4;
      if (coverage > safe) {
        add('logo', 'warn', `The logo hides about ${Math.round(coverage * 100)}% of the code. Raise error correction to Q or H so it can still be recovered.`);
      }
    }

    if (matrix.size >= 57) {
      add('dense', 'info', `This code is dense (version ${matrix.version}). Shorten the content or print it larger so phones can focus on it.`);
    }
  }

  if (settings.pattern !== 'square') {
    add('pattern', 'info', 'Rounded and dot patterns scan fine on modern phones, but some older readers prefer plain squares. The three corner markers always stay square.');
  }

  return out;
}
