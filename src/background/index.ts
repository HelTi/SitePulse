import { registerNavigationListeners } from './navigation-listener';
import { LOG_PREFIX, STORAGE_KEYS } from '../shared/constants';
import { createTranslator, resolveLocale } from '../shared/i18n';
import { getSettings, initializeStorage } from '../shared/storage';

async function updateActionTitle(): Promise<void> {
  try {
    const settings = await getSettings();
    const t = createTranslator(resolveLocale(settings.language));
    await chrome.action.setTitle({ title: t('actionTitle') });
  } catch (error) {
    console.error(`${LOG_PREFIX} Failed to localize action title`, error);
  }
}

async function initializeExtension(): Promise<void> {
  await initializeStorage();
  await updateActionTitle();
}

void initializeExtension();

chrome.runtime.onInstalled.addListener(() => {
  void initializeExtension();
});

chrome.runtime.onStartup.addListener(() => {
  void initializeExtension();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[STORAGE_KEYS.SETTINGS]) {
    void updateActionTitle();
  }
});

registerNavigationListeners();
