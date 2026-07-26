import { describe, expect, it } from 'vitest';
import {
  createTranslator,
  formatVisitCount,
  resolveLocale,
} from '../src/shared/i18n';

describe('internationalization helpers', () => {
  it.each([
    ['auto', 'zh-CN', 'zh_CN'],
    ['auto', 'zh-TW', 'zh_CN'],
    ['auto', 'en-US', 'en'],
    ['auto', 'fr-FR', 'zh_CN'],
    ['en', 'zh-CN', 'en'],
    ['zh_CN', 'en-US', 'zh_CN'],
  ] as const)(
    'resolves %s with browser language %s',
    (preference, browserLanguage, expected) => {
      expect(resolveLocale(preference, browserLanguage)).toBe(expected);
    },
  );

  it('translates messages and replaces placeholders', () => {
    expect(
      createTranslator('en')('openSiteError', {
        hostname: 'example.com',
      }),
    ).toBe('Could not open example.com');
  });

  it('formats visit counts with English pluralization', () => {
    expect(formatVisitCount(1, 'en')).toBe('1 visit');
    expect(formatVisitCount(2, 'en')).toBe('2 visits');
    expect(formatVisitCount(2, 'zh_CN')).toBe('2 次');
  });
});
