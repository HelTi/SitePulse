import {
  DEFAULT_SETTINGS,
  LOG_PREFIX,
  SCHEMA_VERSION,
  STORAGE_KEYS,
} from './constants';
import type {
  ExtensionSettings,
  GetRankedSitesOptions,
  SiteStorage,
  SiteVisitMap,
  SiteVisitStat,
} from './types';
import { rankSites } from './ranking';
import { normalizeHostnameInput, normalizeSiteUrl } from './url';
import { sanitizeTitle } from './validation';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeSiteStat(
  storageKey: string,
  value: unknown,
): SiteVisitStat | null {
  if (!isObject(value)) {
    return null;
  }

  const normalized =
    (typeof value.lastUrl === 'string'
      ? normalizeSiteUrl(value.lastUrl)
      : null) ?? normalizeSiteUrl(`https://${storageKey}`);
  if (!normalized) {
    return null;
  }

  const visitCount =
    typeof value.visitCount === 'number' &&
    Number.isFinite(value.visitCount) &&
    value.visitCount > 0
      ? Math.floor(value.visitCount)
      : 1;
  const lastVisitedAt =
    typeof value.lastVisitedAt === 'number' &&
    Number.isFinite(value.lastVisitedAt)
      ? value.lastVisitedAt
      : Date.now();
  const firstVisitedAt =
    typeof value.firstVisitedAt === 'number' &&
    Number.isFinite(value.firstVisitedAt)
      ? value.firstVisitedAt
      : lastVisitedAt;

  return {
    hostname: normalized.hostname,
    title: sanitizeTitle(value.title, normalized.hostname),
    visitCount,
    firstVisitedAt,
    lastVisitedAt,
    lastUrl: normalized.url,
  };
}

function sanitizeSiteStats(value: unknown): SiteVisitMap {
  if (!isObject(value)) {
    return {};
  }

  return Object.entries(value).reduce<SiteVisitMap>((stats, [key, entry]) => {
    const site = sanitizeSiteStat(key, entry);
    if (site) {
      stats[site.hostname] = site;
    }
    return stats;
  }, {});
}

function sanitizeSettings(value: unknown): ExtensionSettings {
  if (!isObject(value)) {
    return { ...DEFAULT_SETTINGS };
  }

  const excludedHostnames = Array.isArray(value.excludedHostnames)
    ? [
        ...new Set(
          value.excludedHostnames.flatMap((hostname) => {
            if (typeof hostname !== 'string') {
              return [];
            }
            const normalized = normalizeHostnameInput(hostname);
            return normalized ? [normalized] : [];
          }),
        ),
      ].sort()
    : [];

  return {
    trackingEnabled:
      typeof value.trackingEnabled === 'boolean'
        ? value.trackingEnabled
        : DEFAULT_SETTINGS.trackingEnabled,
    excludedHostnames,
    language:
      value.language === 'zh_CN' ||
      value.language === 'en' ||
      value.language === 'auto'
        ? value.language
        : DEFAULT_SETTINGS.language,
  };
}

export async function getSiteStats(): Promise<SiteVisitMap> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SITE_STATS);
  return sanitizeSiteStats(result[STORAGE_KEYS.SITE_STATS]);
}

export async function setSiteStats(stats: SiteVisitMap): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.SITE_STATS]: stats });
}

export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return sanitizeSettings(result[STORAGE_KEYS.SETTINGS]);
}

export async function setSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.SETTINGS]: sanitizeSettings(settings),
  });
}

export async function getRankedSites(
  options: GetRankedSitesOptions = {},
): Promise<SiteVisitStat[]> {
  return rankSites(await getSiteStats(), options);
}

export async function deleteSiteStat(hostname: string): Promise<void> {
  const stats = await getSiteStats();
  if (!(hostname in stats)) {
    return;
  }

  delete stats[hostname];
  await setSiteStats(stats);
}

export async function clearAllSiteStats(): Promise<void> {
  await setSiteStats({});
}

export async function initializeStorage(): Promise<void> {
  try {
    const stored = await chrome.storage.local.get([
      STORAGE_KEYS.SCHEMA_VERSION,
      STORAGE_KEYS.SITE_STATS,
      STORAGE_KEYS.SETTINGS,
    ]);
    const storedVersion = stored[STORAGE_KEYS.SCHEMA_VERSION];

    if (typeof storedVersion === 'number' && storedVersion > SCHEMA_VERSION) {
      console.warn(
        `${LOG_PREFIX} Storage schema is newer than this extension version.`,
      );
      return;
    }

    const updates: Record<string, unknown> = {};
    if (stored[STORAGE_KEYS.SITE_STATS] === undefined) {
      updates[STORAGE_KEYS.SITE_STATS] = {};
    }
    if (stored[STORAGE_KEYS.SETTINGS] === undefined) {
      updates[STORAGE_KEYS.SETTINGS] = DEFAULT_SETTINGS;
    }
    if (storedVersion !== SCHEMA_VERSION) {
      updates[STORAGE_KEYS.SCHEMA_VERSION] = SCHEMA_VERSION;
    }

    if (Object.keys(updates).length > 0) {
      await chrome.storage.local.set(updates);
    }
  } catch (error) {
    console.error(`${LOG_PREFIX} Failed to initialize storage`, error);
  }
}

export const chromeSiteStorage: SiteStorage = {
  getSiteStats,
  setSiteStats,
  getSettings,
};
