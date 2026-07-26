import { MAX_TITLE_LENGTH } from './constants';

export function sanitizeTitle(title: unknown, fallback = ''): string {
  if (typeof title !== 'string') {
    return fallback;
  }

  const cleaned = title.trim();
  if (!cleaned) {
    return fallback;
  }

  return cleaned.slice(0, MAX_TITLE_LENGTH);
}
