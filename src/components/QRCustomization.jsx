import { useState } from 'react';
import ErrorMessage from './ErrorMessage';

const ECL_OPTIONS = [
  { id: 'L', hint: '7%' },
  { id: 'M', hint: '15%' },
  { id: 'Q', hint: '25%' },
  { id: 'H', hint: '30%' },
];

const PATTERNS = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'dots', label: 'Dots' },
];

const MAX_LOGO_BYTES = 512 * 1024;

function Segmented({ label, options, value, onChange, renderLabel }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`seg ${value === o.id ? 'is-active' : ''}`}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {renderLabel ? renderLabel(o) : o.label}
        </button>
      ))}
    </div>
  );
}

export default function QRCustomization({ settings, onChange }) {
  const [logoError, setLogoError] = useState('');

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be chosen again later
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoError('Choose an image file (PNG, JPG, SVG, or WebP).');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('That image is over 512 KB. Choose a smaller one.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoError('');
      onChange({ logo: reader.result });
    };
    reader.onerror = () => setLogoError('Could not read that file.');
    reader.readAsDataURL(file);
  };

  return (
    <div className="customize">
      <div className="field">
        <label className="field-label" htmlFor="size">
          Size <span className="value">{settings.size} px</span>
        </label>
        <input
          id="size" type="range" min="128" max="2048" step="32"
          value={settings.size}
          onChange={(e) => onChange({ size: +e.target.value })}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="margin">
          Margin <span className="value">{settings.margin} modules</span>
        </label>
        <input
          id="margin" type="range" min="0" max="10" step="1"
          value={settings.margin}
          onChange={(e) => onChange({ margin: +e.target.value })}
        />
      </div>

      <div className="row-2">
        <div className="field">
          <label className="field-label" htmlFor="fg">{settings.gradient ? 'Gradient start' : 'Code colour'}</label>
          <input id="fg" type="color" value={settings.fg} onChange={(e) => onChange({ fg: e.target.value })} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="bg">Background</label>
          <input id="bg" type="color" value={settings.bg} onChange={(e) => onChange({ bg: e.target.value })} />
        </div>
      </div>

      <label className="check">
        <input type="checkbox" checked={settings.gradient} onChange={(e) => onChange({ gradient: e.target.checked })} />
        Use a gradient
      </label>
      {settings.gradient && (
        <div className="field">
          <label className="field-label" htmlFor="fg2">Gradient end</label>
          <input id="fg2" type="color" value={settings.fg2} onChange={(e) => onChange({ fg2: e.target.value })} />
        </div>
      )}

      <div className="field">
        <span className="field-label" id="pattern-label">Pattern</span>
        <Segmented
          label="Module pattern" options={PATTERNS}
          value={settings.pattern} onChange={(pattern) => onChange({ pattern })}
        />
      </div>

      <div className="field">
        <span className="field-label" id="ecl-label">Error correction</span>
        <Segmented
          label="Error correction level" options={ECL_OPTIONS}
          value={settings.ecl} onChange={(ecl) => onChange({ ecl })}
          renderLabel={(o) => <>{o.id} <small>{o.hint}</small></>}
        />
        <p className="hint">Higher levels survive more damage or a logo, but make the code denser.</p>
      </div>

      <div className="field">
        <span className="field-label">Logo</span>
        <div className="logo-row">
          <label className="btn ghost file-btn">
            {settings.logo ? 'Change image' : 'Add an image'}
            <input type="file" accept="image/*" onChange={handleLogo} />
          </label>
          {settings.logo && (
            <>
              <img className="logo-thumb" src={settings.logo} alt="Selected logo" />
              <button type="button" className="btn ghost" onClick={() => { setLogoError(''); onChange({ logo: null }); }}>
                Remove
              </button>
            </>
          )}
        </div>
        <ErrorMessage id="logo-error" message={logoError} />
      </div>
    </div>
  );
}
