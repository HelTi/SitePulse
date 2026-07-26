import { DEDUPE_WINDOW_MS } from '../shared/constants';
import type {
  LastNavigationRecord,
  RecordVisitInput,
  SiteStorage,
} from '../shared/types';
import { normalizeSiteUrl } from '../shared/url';
import { sanitizeTitle } from '../shared/validation';

export class VisitService {
  private readonly lastNavigationByTab = new Map<
    number,
    LastNavigationRecord
  >();

  private writeQueue: Promise<void> = Promise.resolve();

  public constructor(
    private readonly storage: SiteStorage,
    private readonly dedupeWindowMs = DEDUPE_WINDOW_MS,
  ) {}

  public recordVisit(input: RecordVisitInput): Promise<void> {
    return this.enqueue(async () => {
      const normalized = normalizeSiteUrl(input.rawUrl);
      if (!normalized) {
        return;
      }

      const settings = await this.storage.getSettings();
      if (
        !settings.trackingEnabled ||
        settings.excludedHostnames.includes(normalized.hostname)
      ) {
        return;
      }

      const previous = this.lastNavigationByTab.get(input.tabId);
      const elapsed = input.committedAt - (previous?.committedAt ?? 0);
      if (
        previous?.hostname === normalized.hostname &&
        elapsed >= 0 &&
        elapsed <= this.dedupeWindowMs
      ) {
        return;
      }

      this.lastNavigationByTab.set(input.tabId, {
        tabId: input.tabId,
        hostname: normalized.hostname,
        committedAt: input.committedAt,
      });

      const stats = await this.storage.getSiteStats();
      const existing = stats[normalized.hostname];
      const title = sanitizeTitle(
        input.title,
        existing?.title ?? normalized.hostname,
      );

      stats[normalized.hostname] = existing
        ? {
            ...existing,
            title,
            visitCount: existing.visitCount + 1,
            lastVisitedAt: input.committedAt,
            lastUrl: normalized.url,
          }
        : {
            hostname: normalized.hostname,
            title,
            visitCount: 1,
            firstVisitedAt: input.committedAt,
            lastVisitedAt: input.committedAt,
            lastUrl: normalized.url,
          };

      await this.storage.setSiteStats(stats);
    });
  }

  public updateSiteTitle(rawUrl: string, title?: string): Promise<void> {
    return this.enqueue(async () => {
      const normalized = normalizeSiteUrl(rawUrl);
      const cleanedTitle = sanitizeTitle(title);
      if (!normalized || !cleanedTitle) {
        return;
      }

      const stats = await this.storage.getSiteStats();
      const existing = stats[normalized.hostname];
      if (!existing || existing.title === cleanedTitle) {
        return;
      }

      stats[normalized.hostname] = {
        ...existing,
        title: cleanedTitle,
      };
      await this.storage.setSiteStats(stats);
    });
  }

  private enqueue(task: () => Promise<void>): Promise<void> {
    const queuedTask = this.writeQueue.then(task);
    this.writeQueue = queuedTask.catch(() => undefined);
    return queuedTask;
  }
}
