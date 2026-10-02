import { useEffect, useRef, useState } from 'react';
import ErrorMessage from './ErrorMessage';
import {
  renderToCanvas, toSVG, loadImage, canvasToBlob, downloadBlob, copyCanvasToClipboard,
} from '../utils/qrGenerator';

export default function QRPreview({ matrix, settings, type, emptyMessage, generationError }) {
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const [pixels, setPixels] = useState(0);
  const [notice, setNotice] = useState({ text: '', kind: '' });

  // Redraw whenever the matrix or any setting changes.
  useEffect(() => {
    if (!matrix) return undefined;
    let cancelled = false;
    (async () => {
      let img = null;
      if (settings.logo) {
        try { img = await loadImage(settings.logo); } catch { img = null; }
      }
      if (cancelled || !canvasRef.current) return;
      const { px } = renderToCanvas(canvasRef.current, matrix, settings, settings.size, img);
      setPixels(px);
    })();
    return () => { cancelled = true; };
  }, [matrix, settings]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const flash = (text, kind = 'ok') => {
    clearTimeout(timerRef.current);
    setNotice({ text, kind });
    timerRef.current = setTimeout(() => setNotice({ text: '', kind: '' }), 2600);
  };

  // The PNG is taken from the very canvas shown on screen, so the file matches the preview.
  const downloadPng = async () => {
    try {
      downloadBlob(await canvasToBlob(canvasRef.current), `qr-code-${type}.png`);
      flash('PNG downloaded.');
    } catch (e) { flash(e.message, 'error'); }
  };

  const downloadSvg = () => {
    try {
      downloadBlob(new Blob([toSVG(matrix, settings)], { type: 'image/svg+xml' }), `qr-code-${type}.svg`);
      flash('SVG downloaded.');
    } catch (e) { flash(e.message, 'error'); }
  };

  const copy = async () => {
    try {
      await copyCanvasToClipboard(canvasRef.current);
      flash('Copied to clipboard.');
    } catch (e) { flash(e.message || 'Could not copy the image.', 'error'); }
  };

  return (
    <div className="preview">
      <div className="frame">
        {matrix ? (
          <canvas ref={canvasRef} role="img" aria-label="Generated QR code" />
        ) : generationError ? (
          <ErrorMessage message={generationError} />
        ) : (
          <p className="placeholder">{emptyMessage}</p>
        )}
      </div>

      <p className="meta">
        {matrix && pixels ? `${pixels} × ${pixels} px, version ${matrix.version}` : '\u00a0'}
      </p>

      <div className="actions">
        <button type="button" className="btn primary" onClick={downloadPng} disabled={!matrix}>Download PNG</button>
        <button type="button" className="btn ghost" onClick={downloadSvg} disabled={!matrix}>Download SVG</button>
        <button type="button" className="btn ghost" onClick={copy} disabled={!matrix}>Copy image</button>
      </div>

      <p className={`toast ${notice.kind === 'error' ? 'toast-error' : ''}`} role="status" aria-live="polite">
        {notice.text}
      </p>
    </div>
  );
}
