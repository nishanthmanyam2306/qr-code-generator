import { PRESETS } from '../data/presets';

const radiusFor = { square: '2px', rounded: '35%', dots: '50%' };

export default function QRPresetSelector({ activeId, onSelect }) {
  return (
    <div className="presets" role="group" aria-label="Style presets">
      {PRESETS.map((p) => {
        const s = p.settings;
        const ink = s.gradient ? `linear-gradient(135deg, ${s.fg}, ${s.fg2})` : s.fg;
        return (
          <button
            key={p.id}
            type="button"
            className={`preset ${activeId === p.id ? 'is-active' : ''}`}
            aria-pressed={activeId === p.id}
            onClick={() => onSelect(p)}
          >
            <span className="swatch" style={{ background: s.bg }} aria-hidden="true">
              <span className="swatch-dot" style={{ background: ink, borderRadius: radiusFor[s.pattern] }} />
              <span className="swatch-dot" style={{ background: ink, borderRadius: radiusFor[s.pattern] }} />
              <span className="swatch-dot" style={{ background: ink, borderRadius: radiusFor[s.pattern] }} />
              <span className="swatch-dot" style={{ background: ink, borderRadius: radiusFor[s.pattern], opacity: 0.0 }} />
            </span>
            <span className="preset-name">{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}
