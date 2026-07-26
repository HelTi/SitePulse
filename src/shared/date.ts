import { getIntlLocale } from './i18n';
import type { SupportedLocale } from './types';

export function formatRelativeTime(
  timestamp: number,
  locale: SupportedLocale,
  now = Date.now(),
): string {
  const intlLocale = getIntlLocale(locale);
  const relativeTime = new Intl.RelativeTimeFormat(intlLocale, {
    numeric: 'auto',
  });
  const elapsedSeconds = Math.max(0, Math.floor((now - timestamp) / 1_000));

  if (elapsedSeconds < 60) {
    return locale === 'zh_CN' ? '刚刚' : 'Just now';
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return relativeTime.format(-elapsedMinutes, 'minute');
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return relativeTime.format(-elapsedHours, 'hour');
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 30) {
    return relativeTime.format(-elapsedDays, 'day');
  }

  return new Intl.DateTimeFormat(intlLocale, {
    month: 'short',
    day: 'numeric',
  }).format(timestamp);
}
