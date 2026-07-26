import type { ExtensionSettings } from './types';

export const STORAGE_KEYS = {
  SITE_STATS: 'siteStats',
  SETTINGS: 'settings',
  SCHEMA_VERSION: 'schemaVersion',
} as const;

export const SCHEMA_VERSION = 2;
export const DEFAULT_RANKING_LIMIT = 100;
export const DEDUPE_WINDOW_MS = 1_000;
export const MAX_TITLE_LENGTH = 50;

export const DEFAULT_SETTINGS: ExtensionSettings = {
  trackingEnabled: true,
  excludedHostnames: [],
  language: 'auto',
};

export const LOG_PREFIX = '[ChangFang]';
