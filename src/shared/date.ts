const relativeTime = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });

export function formatRelativeTime(
  timestamp: number,
  now = Date.now(),
): string {
  const elapsedSeconds = Math.max(0, Math.floor((now - timestamp) / 1_000));

  if (elapsedSeconds < 60) {
    return '刚刚';
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

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
  }).format(timestamp);
}
