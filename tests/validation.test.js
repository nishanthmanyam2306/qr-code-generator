import { describe, it, expect } from 'vitest';
import { validateInput, hasErrors, LIMITS } from '../src/utils/validation';

const ok = (type, data) => expect(validateInput(type, data)).toEqual({});
const bad = (type, data, field) => {
  const errors = validateInput(type, data);
  expect(errors[field], `expected an error on "${field}"`).toBeTruthy();
};

describe('URL', () => {
  it('accepts full and bare web addresses', () => {
    ok('url', { url: 'https://example.com' });
    ok('url', { url: 'example.com/path?x=1' });
    ok('url', { url: 'http://localhost:3000' });
    ok('url', { url: 'localhost:3000' });
    ok('url', { url: '  https://example.com  ' });
  });
  it('rejects empty, spaced, and non-web values', () => {
    bad('url', { url: '' }, 'url');
    bad('url', { url: '   ' }, 'url');
    bad('url', { url: 'not a url' }, 'url');
    bad('url', { url: 'ftp://example.com' }, 'url');
    bad('url', { url: 'javascript:alert(1)' }, 'url');
    bad('url', { url: 'mailto:a@b.com' }, 'url');
    bad('url', { url: 'http://' }, 'url');
    bad('url', { url: 'singleword' }, 'url');
  });
});

describe('Text', () => {
  it('accepts normal text', () => ok('text', { text: 'Hello there' }));
  it('rejects empty or whitespace-only text', () => {
    bad('text', { text: '' }, 'text');
    bad('text', { text: '   \n ' }, 'text');
  });
  it('rejects text over the limit', () => {
    ok('text', { text: 'a'.repeat(LIMITS.text) });
    bad('text', { text: 'a'.repeat(LIMITS.text + 1) }, 'text');
  });
});

describe('Email', () => {
  it('accepts a valid address with optional fields', () => {
    ok('email', { address: 'name@example.com' });
    ok('email', { address: 'a.b+tag@mail.example.co.in', subject: 'Hi', body: 'Hello' });
  });
  it('rejects missing and malformed addresses', () => {
    bad('email', { address: '' }, 'address');
    bad('email', { address: 'abc' }, 'address');
    bad('email', { address: 'a@b' }, 'address');
    bad('email', { address: 'a b@c.com' }, 'address');
  });
  it('rejects over-long subject and body', () => {
    bad('email', { address: 'a@b.com', subject: 'x'.repeat(LIMITS.subject + 1) }, 'subject');
    bad('email', { address: 'a@b.com', body: 'x'.repeat(LIMITS.body + 1) }, 'body');
  });
});

describe('Phone', () => {
  it('accepts common formats', () => {
    ok('phone', { phone: '+91 98765 43210' });
    ok('phone', { phone: '(044) 2345-6789' });
    ok('phone', { phone: '9876543210' });
  });
  it('rejects empty, lettered, too-short and too-long numbers', () => {
    bad('phone', { phone: '' }, 'phone');
    bad('phone', { phone: 'call me' }, 'phone');
    bad('phone', { phone: '12345' }, 'phone');
    bad('phone', { phone: '+1234567890123456' }, 'phone');
  });
});

describe('Wi-Fi', () => {
  it('accepts valid WPA, WEP and open networks', () => {
    ok('wifi', { ssid: 'Home', password: 'supersecret', encryption: 'WPA' });
    ok('wifi', { ssid: 'Old', password: 'abcde', encryption: 'WEP' });
    ok('wifi', { ssid: 'Cafe', password: '', encryption: 'nopass' });
  });
  it('requires a network name', () => {
    bad('wifi', { ssid: '', password: 'supersecret', encryption: 'WPA' }, 'ssid');
    bad('wifi', { ssid: 'x'.repeat(33), password: 'supersecret', encryption: 'WPA' }, 'ssid');
  });
  it('checks the password for the chosen security type', () => {
    bad('wifi', { ssid: 'Home', password: '', encryption: 'WPA' }, 'password');
    bad('wifi', { ssid: 'Home', password: 'short', encryption: 'WPA' }, 'password');
    bad('wifi', { ssid: 'Home', password: 'abcdef', encryption: 'WEP' }, 'password');
  });
  it('rejects an unknown security type', () => {
    bad('wifi', { ssid: 'Home', password: 'supersecret', encryption: 'LOL' }, 'encryption');
  });
});

describe('helpers', () => {
  it('hasErrors reflects the error object', () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ url: 'x' })).toBe(true);
  });
  it('reports unknown types', () => {
    expect(hasErrors(validateInput('nope', {}))).toBe(true);
  });
});
