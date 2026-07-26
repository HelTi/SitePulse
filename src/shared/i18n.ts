import type { LanguagePreference, SupportedLocale } from './types';

const messages = {
  zh_CN: {
    appName: '常访',
    actionTitle: '打开常访',
    popupTagline: '看看哪些网站，占据了你的日常',
    openSettings: '打开设置',
    searchPlaceholder: '搜索网站名称或域名',
    searchAria: '搜索网站',
    summaryAria: '访问统计摘要',
    recordedSites: '已记录网站',
    totalVisits: '累计访问',
    loadingStats: '正在读取本地统计…',
    rankingAria: '常访网站排行榜',
    noSearchResults: '没有找到匹配的网站',
    noVisitRecords: '还没有访问记录',
    searchHint: '试试网站名称或域名中的其他关键词。',
    emptyHint: '打开几个网站后，这里会生成你的常访排行榜。',
    privacyFooter: '所有统计仅保存在本地，不会上传',
    openSiteLabel: '打开 {title}',
    moreActionsLabel: '更多 {hostname}',
    recentlyVisited: '最近访问 {time}',
    menuOpenSite: '打开网站',
    menuExcludeSite: '加入排除列表',
    menuDeleteStats: '删除统计',
    loadStatsError: '暂时无法读取本地统计，请重新打开扩展。',
    openSiteError: '无法打开 {hostname}',
    excludeSiteError: '无法排除 {hostname}',
    deleteConfirm:
      '确定删除 {hostname} 的全部访问统计吗？\n\n之后再次访问会从 1 开始统计。',
    deleteSiteError: '无法删除 {hostname} 的统计',
    optionsTitle: '常访设置',
    optionsSubtitle: '控制显示语言、统计范围与本地数据',
    loadingSettings: '正在读取设置…',
    loadSettingsError: '无法读取设置，请刷新页面重试。',
    settingsSaved: '设置已保存',
    settingsSaveError: '设置保存失败，请重试。',
    languageTitle: '显示语言',
    languageDescription: '跟随浏览器语言，或为扩展单独选择语言。',
    languageAria: '选择显示语言',
    languageAuto: '跟随浏览器',
    languageChinese: '简体中文',
    languageEnglish: 'English',
    trackingTitle: '启用访问统计',
    trackingDescription: '关闭后不再记录新访问，已有数据仍会保留。',
    trackingAria: '启用访问统计',
    exclusionsTitle: '排除网站',
    exclusionsDescription: '精确匹配域名；排除 example.com 不会排除子域名。',
    exclusionPlaceholder: 'example.com 或 https://example.com/path',
    exclusionAria: '要排除的网站',
    add: '添加',
    removeExclusion: '移除 {hostname}',
    noExclusions: '当前没有排除的网站。',
    invalidDomain: '请输入有效域名或 HTTP/HTTPS 地址。',
    duplicateDomain: '该域名已在排除列表中。',
    clearTitle: '清空统计数据',
    clearDescription: '删除全部访问次数，但不会删除排除列表和其他设置。',
    clearButton: '清空统计',
    clearConfirm:
      '确定要清空所有访问统计吗？\n\n该操作无法撤销，排除列表不会被删除。',
    clearSuccess: '访问统计已清空，排除列表保持不变。',
    clearError: '清空失败，请重试。',
    privacyTitle: '隐私说明',
    privacyDescription:
      '所有访问统计仅保存在你的浏览器本地，不会上传到任何服务器。常访不读取网页正文、输入内容或安装前的浏览历史。',
    localStorageLabel: '本地存储 · Schema v2',
    aboutLabel: '常访 SitePulse · v1.0.0',
  },
  en: {
    appName: 'SitePulse',
    actionTitle: 'Open SitePulse',
    popupTagline: 'See which sites shape your daily browsing',
    openSettings: 'Open settings',
    searchPlaceholder: 'Search by site name or domain',
    searchAria: 'Search sites',
    summaryAria: 'Visit statistics summary',
    recordedSites: 'Sites',
    totalVisits: 'Total visits',
    loadingStats: 'Loading local statistics…',
    rankingAria: 'Most visited sites ranking',
    noSearchResults: 'No matching sites',
    noVisitRecords: 'No visits yet',
    searchHint: 'Try another keyword from the site name or domain.',
    emptyHint: 'Visit a few websites and your ranking will appear here.',
    privacyFooter: 'All statistics stay local and are never uploaded',
    openSiteLabel: 'Open {title}',
    moreActionsLabel: 'More actions for {hostname}',
    recentlyVisited: 'Last visited {time}',
    menuOpenSite: 'Open website',
    menuExcludeSite: 'Add to exclusions',
    menuDeleteStats: 'Delete statistics',
    loadStatsError:
      'Local statistics could not be loaded. Please reopen the extension.',
    openSiteError: 'Could not open {hostname}',
    excludeSiteError: 'Could not exclude {hostname}',
    deleteConfirm:
      'Delete all visit statistics for {hostname}?\n\nThe next visit will start again at 1.',
    deleteSiteError: 'Could not delete statistics for {hostname}',
    optionsTitle: 'SitePulse settings',
    optionsSubtitle: 'Control language, tracking scope, and local data',
    loadingSettings: 'Loading settings…',
    loadSettingsError: 'Settings could not be loaded. Please refresh.',
    settingsSaved: 'Settings saved',
    settingsSaveError: 'Could not save settings. Please try again.',
    languageTitle: 'Display language',
    languageDescription:
      'Follow the browser language or choose a language for this extension.',
    languageAria: 'Select display language',
    languageAuto: 'Follow browser',
    languageChinese: '简体中文',
    languageEnglish: 'English',
    trackingTitle: 'Enable visit tracking',
    trackingDescription:
      'Turning this off stops new visits from being recorded. Existing data is kept.',
    trackingAria: 'Enable visit tracking',
    exclusionsTitle: 'Excluded sites',
    exclusionsDescription:
      'Domains are matched exactly. Excluding example.com does not exclude subdomains.',
    exclusionPlaceholder: 'example.com or https://example.com/path',
    exclusionAria: 'Site to exclude',
    add: 'Add',
    removeExclusion: 'Remove {hostname}',
    noExclusions: 'No sites are currently excluded.',
    invalidDomain: 'Enter a valid domain or HTTP/HTTPS URL.',
    duplicateDomain: 'This domain is already excluded.',
    clearTitle: 'Clear statistics',
    clearDescription:
      'Delete all visit counts without removing exclusions or other settings.',
    clearButton: 'Clear statistics',
    clearConfirm:
      'Clear all visit statistics?\n\nThis cannot be undone. Your exclusion list will be kept.',
    clearSuccess: 'Visit statistics cleared. Your exclusions were kept.',
    clearError: 'Could not clear statistics. Please try again.',
    privacyTitle: 'Privacy',
    privacyDescription:
      'All visit statistics are stored only in your browser and are never uploaded. SitePulse does not read page content, form input, or browsing history from before installation.',
    localStorageLabel: 'Local storage · Schema v2',
    aboutLabel: 'SitePulse · v1.0.0',
  },
} as const;

export type MessageKey = keyof (typeof messages)['zh_CN'];
export type MessageReplacements = Record<string, string | number>;
export type Translator = (
  key: MessageKey,
  replacements?: MessageReplacements,
) => string;

export function getBrowserLanguage(): string {
  if (typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage) {
    return chrome.i18n.getUILanguage();
  }

  return typeof navigator !== 'undefined' ? navigator.language : 'zh-CN';
}

export function resolveLocale(
  preference: LanguagePreference,
  browserLanguage = getBrowserLanguage(),
): SupportedLocale {
  if (preference !== 'auto') {
    return preference;
  }

  const normalized = browserLanguage.toLowerCase();
  if (normalized.startsWith('en')) {
    return 'en';
  }

  return 'zh_CN';
}

export function getIntlLocale(locale: SupportedLocale): string {
  return locale === 'zh_CN' ? 'zh-CN' : 'en';
}

export function createTranslator(locale: SupportedLocale): Translator {
  return (key, replacements = {}) =>
    Object.entries(replacements).reduce<string>(
      (message, [name, value]) =>
        message.replaceAll(`{${name}}`, String(value)),
      messages[locale][key],
    );
}

export function formatNumber(value: number, locale: SupportedLocale): string {
  return value.toLocaleString(getIntlLocale(locale));
}

export function formatVisitCount(
  value: number,
  locale: SupportedLocale,
): string {
  const count = formatNumber(value, locale);
  if (locale === 'zh_CN') {
    return `${count} 次`;
  }

  return `${count} ${value === 1 ? 'visit' : 'visits'}`;
}
