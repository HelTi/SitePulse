import { LOG_PREFIX } from '../shared/constants';
import { chromeSiteStorage } from '../shared/storage';
import { VisitService } from './visit-service';

const visitService = new VisitService(chromeSiteStorage);

export function registerNavigationListeners(): void {
  chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId !== 0) {
      return;
    }

    void visitService
      .recordVisit({
        rawUrl: details.url,
        tabId: details.tabId,
        committedAt: details.timeStamp,
      })
      .catch((error: unknown) => {
        console.error(`${LOG_PREFIX} Failed to record visit`, error);
      });
  });

  chrome.webNavigation.onCompleted.addListener((details) => {
    if (details.frameId !== 0) {
      return;
    }

    void chrome.tabs
      .get(details.tabId)
      .then((tab) => visitService.updateSiteTitle(details.url, tab.title))
      .catch((error: unknown) => {
        console.error(`${LOG_PREFIX} Failed to update page title`, error);
      });
  });
}
