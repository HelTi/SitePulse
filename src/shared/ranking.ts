import { DEFAULT_RANKING_LIMIT } from './constants';
import type {
  GetRankedSitesOptions,
  SiteVisitMap,
  SiteVisitStat,
} from './types';

export function compareSiteStats(
  first: SiteVisitStat,
  second: SiteVisitStat,
): number {
  if (second.visitCount !== first.visitCount) {
    return second.visitCount - first.visitCount;
  }

  if (second.lastVisitedAt !== first.lastVisitedAt) {
    return second.lastVisitedAt - first.lastVisitedAt;
  }

  return first.hostname.localeCompare(second.hostname);
}

export function rankSites(
  siteStats: SiteVisitMap,
  options: GetRankedSitesOptions = {},
): SiteVisitStat[] {
  const keyword = options.keyword?.trim().toLocaleLowerCase() ?? '';
  const limit = Math.max(0, options.limit ?? DEFAULT_RANKING_LIMIT);

  return Object.values(siteStats)
    .filter((site) => {
      if (!keyword) {
        return true;
      }

      return (
        site.hostname.toLocaleLowerCase().includes(keyword) ||
        site.title.toLocaleLowerCase().includes(keyword)
      );
    })
    .sort(compareSiteStats)
    .slice(0, limit);
}
