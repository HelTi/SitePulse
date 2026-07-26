import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAllSiteStats,
  getSettings,
  getSiteStats,
  initializeStorage,
} from '../src/shared/storage';

describe('chrome storage helpers', () => {
  let stored: Record<string, unknown>;

  beforeEach(() => {
    stored = {
      siteStats: {
        'example.com': {
          hostname: 'example.com',
          title: 'Example',
          visitCount: 3,
          firstVisitedAt: 1,
          lastVisitedAt: 2,
          lastUrl: 'https://example.com',
        },
      },
      settings: {
        trackingEnabled: false,
        excludedHostnames: ['internal.example.com'],
      },
      schemaVersion: 1,
    };

    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: async () => structuredClone(stored),
          set: async (updates: Record<string, unknown>) => {
            Object.assign(stored, structuredClone(updates));
          },
        },
      },
    });
  });

  it('clears only site statistics', async () => {
    await clearAllSiteStats();

    expect(stored.siteStats).toEqual({});
    expect(stored.settings).toEqual({
      trackingEnabled: false,
      excludedHostnames: ['internal.example.com'],
    });
    expect(stored.schemaVersion).toBe(1);
  });

  it('initializes missing keys without replacing existing settings', async () => {
    delete stored.siteStats;
    delete stored.schemaVersion;

    await initializeStorage();

    expect(stored.siteStats).toEqual({});
    expect(stored.schemaVersion).toBe(2);
    expect(stored.settings).toEqual({
      trackingEnabled: false,
      excludedHostnames: ['internal.example.com'],
    });
  });

  it('defaults older settings to automatic language selection', async () => {
    const settings = await getSettings();

    expect(settings.language).toBe('auto');
  });

  it('repairs malformed records when reading', async () => {
    stored.siteStats = {
      'legacy.example.com': {
        title: null,
        visitCount: 'invalid',
        lastVisitedAt: 10,
        lastUrl: 'not a url',
      },
    };

    const stats = await getSiteStats();

    expect(stats['legacy.example.com']).toMatchObject({
      hostname: 'legacy.example.com',
      title: 'legacy.example.com',
      visitCount: 1,
      lastUrl: 'https://legacy.example.com',
    });
  });
});
