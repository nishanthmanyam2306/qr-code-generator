import { useEffect, useMemo, useState } from 'react';
import QRTypeSelector from './components/QRTypeSelector';
import QRInputForm from './components/QRInputForm';
import QRCustomization from './components/QRCustomization';
import QRPresetSelector from './components/QRPresetSelector';
import QRPreview from './components/QRPreview';
import QRWarning from './components/QRWarning';
import RecentQRCodes from './components/RecentQRCodes';
import { DEFAULT_FORM_DATA, formatQRData, getLabel } from './utils/qrFormatter';
import { validateInput, hasErrors } from './utils/validation';
import { createMatrix, getWarnings, DEFAULT_SETTINGS } from './utils/qrGenerator';
import {
  loadRecent, saveRecent, removeRecent, clearRecent, loadTheme, saveTheme,
} from './utils/localStorage';
import { DEFAULT_PRESET_ID, PRESETS, PRESET_KEYS } from './data/presets';

const makeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const AUTOSAVE_DELAY_MS = 2000;

export default function App() {
  const [type, setType] = useState('url');
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...PRESETS.find((p) => p.id === DEFAULT_PRESET_ID).settings,
  }));
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID);
  const [recent, setRecent] = useState(() => loadRecent());
  const [theme, setTheme] = useState(() => loadTheme());
  const [edited, setEdited] = useState(false); // becomes true after the first user change

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  /* ---- derive everything from the current inputs ---- */
  const data = formData[type];
  const errors = useMemo(() => validateInput(type, data), [type, data]);
  const valid = !hasErrors(errors);
  const text = useMemo(() => (valid ? formatQRData(type, data) : ''), [valid, type, data]);

  const { matrix, generationError } = useMemo(() => {
    if (!valid || !text) return { matrix: null, generationError: '' };
    try {
      return { matrix: createMatrix(text, settings.ecl), generationError: '' };
    } catch (e) {
      return { matrix: null, generationError: e.message };
    }
  }, [valid, text, settings.ecl]);

  const warnings = useMemo(() => (matrix ? getWarnings(settings, matrix) : []), [settings, matrix]);

  /* ---- save to "recent" once the user pauses on a valid code ---- */
  useEffect(() => {
    if (!matrix || !edited) return undefined;
    const timer = setTimeout(() => {
      setRecent(
        saveRecent({
          id: makeId(),
          type,
          data,
          settings: { ...settings, logo: null }, // logos can be large, so they are not stored
          label: getLabel(type, data),
          createdAt: Date.now(),
        }),
      );
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [matrix, edited, type, data, settings]);

  /* ---- handlers ---- */
  const handleTypeChange = (next) => {
    setType(next);
    setEdited(true);
  };

  const handleDataChange = (patch) => {
    setFormData((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }));
    setEdited(true);
  };

  const handleSettingsChange = (patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    if (PRESET_KEYS.some((k) => k in patch)) setPresetId(null);
    setEdited(true);
  };

  const handlePreset = (preset) => {
    setSettings((prev) => ({ ...prev, ...preset.settings }));
    setPresetId(preset.id);
    setEdited(true);
  };

  const handleUseRecent = (entry) => {
    setType(entry.type);
    setFormData((prev) => ({ ...prev, [entry.type]: { ...DEFAULT_FORM_DATA[entry.type], ...entry.data } }));
    setSettings({ ...DEFAULT_SETTINGS, ...entry.settings, logo: null });
    setPresetId(null);
    setEdited(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>QR Maker</h1>
          <p className="tagline">
            Make a QR code for a link, text, email, phone number, or Wi-Fi network. Everything happens in your browser.
          </p>
        </div>
        <button
          type="button"
          className="btn ghost"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? 'Light theme' : 'Dark theme'}
        </button>
      </header>

      <main className="layout">
        <section className="card area-input" aria-labelledby="h-content">
          <h2 id="h-content">Content</h2>
          <QRTypeSelector value={type} onChange={handleTypeChange} />
          <QRInputForm key={type} type={type} data={data} errors={errors} onChange={handleDataChange} />
        </section>

        <section className="card area-preview" aria-labelledby="h-preview">
          <h2 id="h-preview">Preview</h2>
          <QRPreview
            matrix={matrix}
            settings={settings}
            type={type}
            generationError={generationError}
            emptyMessage="Fill in the details on the left and your QR code will appear here."
          />
          <QRWarning warnings={warnings} active={!!matrix} />
        </section>

        <section className="card area-style" aria-labelledby="h-style">
          <h2 id="h-style">Style</h2>
          <QRPresetSelector activeId={presetId} onSelect={handlePreset} />
          <QRCustomization settings={settings} onChange={handleSettingsChange} />
        </section>

        <section className="card area-recent" aria-labelledby="h-recent">
          <RecentQRCodes
            items={recent}
            onUse={handleUseRecent}
            onRemove={(id) => setRecent(removeRecent(id))}
            onClear={() => setRecent(clearRecent())}
          />
        </section>
      </main>
    </div>
  );
}
