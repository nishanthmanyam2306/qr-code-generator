import { normalizeUrl } from './qrFormatter';

export const LIMITS = {
  text: 1000,
  subject: 200,
  body: 500,
  ssid: 32,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_CHARS_RE = /^\+?[\d\s\-().]+$/;

function validateUrl(raw, errors) {
  const value = (raw || '').trim();
  if (!value) {
    errors.url = 'Enter a web address.';
  } else if (/\s/.test(value)) {
    errors.url = 'A web address cannot contain spaces.';
  } else if (/^[a-z][a-z0-9+.-]*:(?!\/\/|\d)/i.test(value)) {
    // things like javascript:..., mailto:..., tel:...
    errors.url = 'Only http and https links are supported.';
  } else {
    try {
      const url = new URL(normalizeUrl(value));
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.url = 'Only http and https links are supported.';
      } else if (!url.hostname.includes('.') && url.hostname !== 'localhost') {
        errors.url = 'Enter a full web address, like example.com.';
      }
    } catch {
      errors.url = 'That doesn\u2019t look like a valid web address.';
    }
  }
}

function validateText(raw, errors) {
  const value = raw || '';
  if (!value.trim()) errors.text = 'Enter some text.';
  else if (value.length > LIMITS.text) errors.text = `Keep the text under ${LIMITS.text} characters (currently ${value.length}).`;
}

function validateEmail(data, errors) {
  const address = (data.address || '').trim();
  if (!address) errors.address = 'Enter an email address.';
  else if (!EMAIL_RE.test(address)) errors.address = 'Enter a valid email address, like name@example.com.';

  if ((data.subject || '').length > LIMITS.subject) errors.subject = `Keep the subject under ${LIMITS.subject} characters.`;
  if ((data.body || '').length > LIMITS.body) errors.body = `Keep the message under ${LIMITS.body} characters.`;
}

function validatePhone(raw, errors) {
  const value = (raw || '').trim();
  if (!value) {
    errors.phone = 'Enter a phone number.';
    return;
  }
  if (!PHONE_CHARS_RE.test(value)) {
    errors.phone = 'Use only digits, spaces, and + - ( ).';
    return;
  }
  const digits = value.replace(/\D/g, '').length;
  if (digits < 6) errors.phone = 'That number is too short.';
  else if (digits > 15) errors.phone = 'That number is too long (15 digits maximum).';
}

function validateWifi(data, errors) {
  const ssid = data.ssid || '';
  if (!ssid.trim()) errors.ssid = 'Enter the network name.';
  else if (ssid.length > LIMITS.ssid) errors.ssid = `Network names are at most ${LIMITS.ssid} characters.`;

  const encryption = data.encryption || 'WPA';
  if (!['WPA', 'WEP', 'nopass'].includes(encryption)) {
    errors.encryption = 'Choose a security type.';
    return;
  }
  if (encryption === 'nopass') return;

  const password = data.password || '';
  if (!password) errors.password = 'Enter the network password.';
  else if (encryption === 'WPA' && (password.length < 8 || password.length > 63)) {
    errors.password = 'WPA passwords are 8 to 63 characters long.';
  } else if (encryption === 'WEP' && ![5, 10, 13, 26].includes(password.length)) {
    errors.password = 'WEP passwords are 5 or 13 characters (or 10 or 26 hex digits).';
  }
}

/** Returns an object of { fieldName: message }. Empty object means valid. */
export function validateInput(type, data = {}) {
  const errors = {};
  switch (type) {
    case 'url': validateUrl(data.url, errors); break;
    case 'text': validateText(data.text, errors); break;
    case 'email': validateEmail(data, errors); break;
    case 'phone': validatePhone(data.phone, errors); break;
    case 'wifi': validateWifi(data, errors); break;
    default: errors.type = 'Unknown QR code type.';
  }
  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
