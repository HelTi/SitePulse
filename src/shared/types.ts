export interface SiteVisitStat {
  hostname: string;
  title: string;
  visitCount: number;
  firstVisitedAt: number;
  lastVisitedAt: number;
  lastUrl: string;
}

export type SiteVisitMap = Record<string, SiteVisitStat>;

export type SupportedLocale = 'zh_CN' | 'en';
export type LanguagePreference = 'auto' | SupportedLocale;

export interface ExtensionSettings {
  trackingEnabled: boolean;
  excludedHostnames: string[];
  language: LanguagePreference;
}

export interface LastNavigationRecord {
  tabId: number;
  hostname: string;
  committedAt: number;
}

export interface NormalizedSite {
  hostname: string;
  url: string;
}

export interface RecordVisitInput {
  rawUrl: string;
  title?: string;
  tabId: number;
  committedAt: number;
}

export interface GetRankedSitesOptions {
  keyword?: string;
  limit?: number;
}

export interface SiteStorage {
  getSiteStats(): Promise<SiteVisitMap>;
  setSiteStats(stats: SiteVisitMap): Promise<void>;
  getSettings(): Promise<ExtensionSettings>;
}
