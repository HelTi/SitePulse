import { beforeEach, describe, expect, it } from 'vitest';
import { VisitService } from '../src/background/visit-service';
import type {
  ExtensionSettings,
  SiteStorage,
  SiteVisitMap,
} from '../src/shared/types';

class MemoryStorage implements SiteStorage {
  public stats: SiteVisitMap = {};

  public settings: ExtensionSettings = {
    trackingEnabled: true,
    excludedHostnames: [],
  };

  public async getSiteStats(): Promise<SiteVisitMap> {
    return structuredClone(this.stats);
  }

  public async setSiteStats(stats: SiteVisitMap): Promise<void> {
    this.stats = structuredClone(stats);
  }

  public async getSettings(): Promise<ExtensionSettings> {
    return structuredClone(this.settings);
  }
}

describe('VisitService', () => {
  let storage: MemoryStorage;
  let service: VisitService;

  beforeEach(() => {
    storage = new MemoryStorage();
    service = new VisitService(storage);
  });

  it('creates and accumulates visits without replacing the first timestamp', async () => {
    await service.recordVisit({
      rawUrl: 'https://www.github.com/openai?tab=repositories',
      title: ' GitHub ',
      tabId: 1,
      committedAt: 1_000,
    });
    await service.recordVisit({
      rawUrl: 'https://github.com/settings',
      title: '',
      tabId: 1,
      committedAt: 3_000,
    });

    expect(storage.stats['github.com']).toEqual({
      hostname: 'github.com',
      title: 'GitHub',
      visitCount: 2,
      firstVisitedAt: 1_000,
      lastVisitedAt: 3_000,
      lastUrl: 'https://github.com',
    });
  });

  it('deduplicates the same hostname in one tab within one second', async () => {
    await service.recordVisit({
      rawUrl: 'https://example.com',
      tabId: 7,
      committedAt: 1_000,
    });
    await service.recordVisit({
      rawUrl: 'https://example.com/redirected',
      tabId: 7,
      committedAt: 1_500,
    });

    expect(storage.stats['example.com']?.visitCount).toBe(1);
  });

  it('does not deduplicate different tabs or events after the window', async () => {
    await Promise.all([
      service.recordVisit({
        rawUrl: 'https://example.com',
        tabId: 1,
        committedAt: 1_000,
      }),
      service.recordVisit({
        rawUrl: 'https://example.com',
        tabId: 2,
        committedAt: 1_100,
      }),
    ]);
    await service.recordVisit({
      rawUrl: 'https://example.com',
      tabId: 1,
      committedAt: 2_001,
    });

    expect(storage.stats['example.com']?.visitCount).toBe(3);
  });

  it('respects the tracking switch and exact exclusions', async () => {
    storage.settings.trackingEnabled = false;
    await service.recordVisit({
      rawUrl: 'https://a.com',
      tabId: 1,
      committedAt: 1_000,
    });

    storage.settings = {
      trackingEnabled: true,
      excludedHostnames: ['example.com'],
    };
    await service.recordVisit({
      rawUrl: 'https://example.com',
      tabId: 1,
      committedAt: 2_000,
    });
    await service.recordVisit({
      rawUrl: 'https://docs.example.com',
      tabId: 1,
      committedAt: 3_000,
    });

    expect(Object.keys(storage.stats)).toEqual(['docs.example.com']);
  });

  it('serializes concurrent writes', async () => {
    await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        service.recordVisit({
          rawUrl: 'https://example.com',
          tabId: index,
          committedAt: 1_000 + index,
        }),
      ),
    );

    expect(storage.stats['example.com']?.visitCount).toBe(20);
  });

  it('updates a recorded page title without increasing its count', async () => {
    await service.recordVisit({
      rawUrl: 'https://example.com/page',
      tabId: 1,
      committedAt: 1_000,
    });
    await service.updateSiteTitle(
      'https://example.com/page?private=true',
      ' Example title ',
    );

    expect(storage.stats['example.com']?.title).toBe('Example title');
    expect(storage.stats['example.com']?.visitCount).toBe(1);
  });
});
