import { useEffect, useMemo, useRef } from 'react';
import { createMatrix, renderToCanvas, DEFAULT_SETTINGS } from '../utils/qrGenerator';
import { formatQRData, QR_TYPES } from '../utils/qrFormatter';

function Thumb({ entry }) {
  const ref = useRef(null);
  const matrix = useMemo(() => {
    try {
      const settings = { ...DEFAULT_SETTINGS, ...entry.settings };
      return createMatrix(formatQRData(entry.type, entry.data), settings.ecl);
    } catch {
      return null;
    }
  }, [entry]);

  useEffect(() => {
    if (!matrix || !ref.current) return;
    renderToCanvas(ref.current, matrix, { ...DEFAULT_SETTINGS, ...entry.settings, logo: null }, 120);
  }, [matrix, entry]);

  return matrix ? <canvas ref={ref} className="thumb" aria-hidden="true" /> : <div className="thumb thumb-empty" />;
}

const typeLabel = (id) => QR_TYPES.find((t) => t.id === id)?.label ?? id;

export default function RecentQRCodes({ items, onUse, onRemove, onClear }) {
  return (
    <>
      <div className="section-head">
        <h2 id="h-recent">Recent codes</h2>
        {items.length > 0 && (
          <button type="button" className="btn ghost small" onClick={onClear}>Clear all</button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="placeholder">Codes you make are saved here, in this browser only, so you can reuse them later.</p>
      ) : (
        <ul className="recent-list" aria-labelledby="h-recent">
          {items.map((entry) => (
            <li key={entry.id} className="recent-item">
              <Thumb entry={entry} />
              <div className="recent-body">
                <span className="recent-type">{typeLabel(entry.type)}</span>
                <span className="recent-label" title={entry.label}>{entry.label || '(empty)'}</span>
                <time className="recent-time" dateTime={new Date(entry.createdAt).toISOString()}>
                  {new Date(entry.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </time>
              </div>
              <div className="recent-actions">
                <button type="button" className="btn primary small" onClick={() => onUse(entry)}>Use</button>
                <button type="button" className="btn ghost small" onClick={() => onRemove(entry.id)} aria-label={`Remove ${entry.label || 'this code'}`}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
