import { registerNavigationListeners } from './navigation-listener';
import { initializeStorage } from '../shared/storage';

void initializeStorage();

chrome.runtime.onInstalled.addListener(() => {
  void initializeStorage();
});

chrome.runtime.onStartup.addListener(() => {
  void initializeStorage();
});

registerNavigationListeners();
