import type { NormalizedSite } from './types';

export function normalizeSiteUrl(rawUrl: string): NormalizedSite | null {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    let hostname = parsed.hostname.toLowerCase().replace(/\.+$/, '');
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }

    if (!hostname) {
      return null;
    }

    return {
      hostname,
      url: `${parsed.protocol}//${hostname}`,
    };
  } catch {
    return null;
  }
}

export function normalizeHostnameInput(input: string): string | null {
  const value = input.trim();
  if (!value || /\s/.test(value)) {
    return null;
  }

  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(value)
    ? value
    : `https://${value}`;

  return normalizeSiteUrl(withProtocol)?.hostname ?? null;
}
