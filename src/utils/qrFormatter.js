// Turns what the user typed into the exact string that goes inside the QR code.

export const QR_TYPES = [
  { id: 'url', label: 'URL' },
  { id: 'text', label: 'Text' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'wifi', label: 'Wi-Fi' },
];

export const DEFAULT_FORM_DATA = {
  url: { url: 'https://example.com' },
  text: { text: '' },
  email: { address: '', subject: '', body: '' },
  phone: { phone: '' },
  wifi: { ssid: '', password: '', encryption: 'WPA', hidden: false },
};

/** Adds https:// when the user typed a bare domain like "example.com". */
export function normalizeUrl(raw = '') {
  const value = String(raw).trim();
  if (!value) return '';
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
}

/** Wi-Fi QR strings use backslash escapes for \ ; , : and " */
export function escapeWifi(value = '') {
  return String(value).replace(/([\\;,:"])/g, '\\$1');
}

export function cleanPhone(raw = '') {
  const value = String(raw).trim();
  const plus = value.startsWith('+') ? '+' : '';
  return plus + value.replace(/\D/g, '');
}

export function formatQRData(type, data = {}) {
  switch (type) {
    case 'url':
      return normalizeUrl(data.url);

    case 'text':
      return data.text ?? '';

    case 'email': {
      const address = (data.address || '').trim();
      const params = [];
      if (data.subject?.trim()) params.push(`subject=${encodeURIComponent(data.subject.trim())}`);
      if (data.body?.trim()) params.push(`body=${encodeURIComponent(data.body.trim())}`);
      return `mailto:${address}${params.length ? `?${params.join('&')}` : ''}`;
    }

    case 'phone':
      return `tel:${cleanPhone(data.phone)}`;

    case 'wifi': {
      const encryption = data.encryption || 'WPA';
      let out = `WIFI:T:${encryption};S:${escapeWifi(data.ssid)};`;
      if (encryption !== 'nopass') out += `P:${escapeWifi(data.password)};`;
      if (data.hidden) out += 'H:true;';
      return `${out};`;
    }

    default:
      return '';
  }
}

/** Short human-readable name used in the "Recent" list. */
export function getLabel(type, data = {}) {
  let label;
  switch (type) {
    case 'url': label = normalizeUrl(data.url); break;
    case 'text': label = (data.text || '').replace(/\s+/g, ' ').trim(); break;
    case 'email': label = data.address || ''; break;
    case 'phone': label = data.phone || ''; break;
    case 'wifi': label = `Wi-Fi: ${data.ssid || ''}`; break;
    default: label = '';
  }
  return label.length > 48 ? `${label.slice(0, 47)}…` : label;
}
