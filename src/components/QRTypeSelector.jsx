import { QR_TYPES } from '../utils/qrFormatter';

export default function QRTypeSelector({ value, onChange }) {
  return (
    <div className="segmented segmented-wide" role="group" aria-label="QR code type">
      {QR_TYPES.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`seg ${value === t.id ? 'is-active' : ''}`}
          aria-pressed={value === t.id}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
