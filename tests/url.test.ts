import { describe, expect, it } from 'vitest';
import { normalizeHostnameInput, normalizeSiteUrl } from '../src/shared/url';

describe('normalizeSiteUrl', () => {
  it.each([
    ['https://www.example.com/path', 'example.com', 'https://example.com'],
    ['http://example.com:8080/page', 'example.com', 'http://example.com'],
    [
      'https://docs.example.com/a?query=1#top',
      'docs.example.com',
      'https://docs.example.com',
    ],
    ['https://www.Example.com./page', 'example.com', 'https://example.com'],
  ])('normalizes %s', (input, hostname, url) => {
    expect(normalizeSiteUrl(input)).toEqual({ hostname, url });
  });

  it.each([
    'chrome://extensions',
    'chrome-extension://abc/page.html',
    'file:///Users/test/index.html',
    'invalid-url',
    '',
  ])('rejects %s', (input) => {
    expect(normalizeSiteUrl(input)).toBeNull();
  });
});

describe('normalizeHostnameInput', () => {
  it.each([
    ['example.com', 'example.com'],
    ['www.example.com', 'example.com'],
    ['https://example.com/path', 'example.com'],
  ])('extracts a hostname from %s', (input, expected) => {
    expect(normalizeHostnameInput(input)).toBe(expected);
  });

  it('rejects invalid input', () => {
    expect(normalizeHostnameInput('not a hostname')).toBeNull();
  });
});
