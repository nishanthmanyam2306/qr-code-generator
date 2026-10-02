import { describe, it, expect } from 'vitest';
import {
  formatQRData, normalizeUrl, escapeWifi, cleanPhone, getLabel, DEFAULT_FORM_DATA,
} from '../src/utils/qrFormatter';

describe('normalizeUrl', () => {
  it('adds https:// to bare domains and leaves full URLs alone', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
    expect(normalizeUrl('  example.com  ')).toBe('https://example.com');
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    expect(normalizeUrl('')).toBe('');
  });
});

describe('formatQRData', () => {
  it('url', () => expect(formatQRData('url', { url: 'example.com' })).toBe('https://example.com'));
  it('text is passed through untouched', () => expect(formatQRData('text', { text: ' hi \n there' })).toBe(' hi \n there'));

  it('email builds a mailto link and encodes subject and body', () => {
    expect(formatQRData('email', { address: 'a@b.com' })).toBe('mailto:a@b.com');
    expect(formatQRData('email', { address: 'a@b.com', subject: 'Hello World' }))
      .toBe('mailto:a@b.com?subject=Hello%20World');
    expect(formatQRData('email', { address: 'a@b.com', subject: 'Hi', body: 'a&b' }))
      .toBe('mailto:a@b.com?subject=Hi&body=a%26b');
  });

  it('phone builds a tel link with punctuation removed', () => {
    expect(formatQRData('phone', { phone: '+91 (987) 65-43210' })).toBe('tel:+919876543210');
    expect(formatQRData('phone', { phone: '98765 43210' })).toBe('tel:9876543210');
    expect(cleanPhone('+1 555.123.4567')).toBe('+15551234567');
  });

  it('wifi builds the WIFI: format', () => {
    expect(formatQRData('wifi', { ssid: 'Home', password: 'secret123', encryption: 'WPA' }))
      .toBe('WIFI:T:WPA;S:Home;P:secret123;;');
  });
  it('wifi omits the password for open networks and adds H:true for hidden ones', () => {
    expect(formatQRData('wifi', { ssid: 'Cafe', password: 'ignored', encryption: 'nopass' }))
      .toBe('WIFI:T:nopass;S:Cafe;;');
    expect(formatQRData('wifi', { ssid: 'Quiet', password: 'secret123', encryption: 'WPA', hidden: true }))
      .toBe('WIFI:T:WPA;S:Quiet;P:secret123;H:true;;');
  });
  it('wifi escapes special characters in the name and password', () => {
    expect(escapeWifi('a;b,c:d"e\\f')).toBe('a\\;b\\,c\\:d\\"e\\\\f');
    expect(formatQRData('wifi', { ssid: 'Home;Net', password: 'pa:ss"w,o\\rd', encryption: 'WPA' }))
      .toBe('WIFI:T:WPA;S:Home\\;Net;P:pa\\:ss\\"w\\,o\\\\rd;;');
  });
});

describe('getLabel', () => {
  it('describes each type briefly', () => {
    expect(getLabel('url', { url: 'example.com' })).toBe('https://example.com');
    expect(getLabel('email', { address: 'a@b.com' })).toBe('a@b.com');
    expect(getLabel('wifi', { ssid: 'Home' })).toBe('Wi-Fi: Home');
    expect(getLabel('phone', { phone: '123456' })).toBe('123456');
  });
  it('shortens long text', () => {
    const label = getLabel('text', { text: 'word '.repeat(40) });
    expect(label.length).toBeLessThanOrEqual(48);
    expect(label.endsWith('…')).toBe(true);
  });
});

describe('defaults', () => {
  it('has a starting value for every type', () => {
    ['url', 'text', 'email', 'phone', 'wifi'].forEach((t) => expect(DEFAULT_FORM_DATA[t]).toBeTruthy());
  });
});
