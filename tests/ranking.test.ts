import { describe, expect, it } from 'vitest';
import { rankSites } from '../src/shared/ranking';
import type { SiteVisitMap } from '../src/shared/types';

const stats: SiteVisitMap = {
  'a.com': {
    hostname: 'a.com',
    title: 'Alpha',
    visitCount: 10,
    firstVisitedAt: 1,
    lastVisitedAt: 100,
    lastUrl: 'https://a.com',
  },
  'b.com': {
    hostname: 'b.com',
    title: 'Beta',
    visitCount: 20,
    firstVisitedAt: 1,
    lastVisitedAt: 50,
    lastUrl: 'https://b.com',
  },
  'c.com': {
    hostname: 'c.com',
    title: 'Gamma',
    visitCount: 10,
    firstVisitedAt: 1,
    lastVisitedAt: 200,
    lastUrl: 'https://c.com',
  },
};

describe('rankSites', () => {
  it('sorts by visits, recency, then hostname', () => {
    expect(rankSites(stats).map((site) => site.hostname)).toEqual([
      'b.com',
      'c.com',
      'a.com',
    ]);
  });

  it('searches all records before applying the limit', () => {
    expect(rankSites(stats, { keyword: 'gamma', limit: 1 })[0]?.hostname).toBe(
      'c.com',
    );
  });

  it('matches hostnames without case sensitivity', () => {
    expect(rankSites(stats, { keyword: 'B.COM' })[0]?.hostname).toBe('b.com');
  });
});
