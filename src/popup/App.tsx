import {
  Ban,
  ExternalLink,
  Globe2,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatRelativeTime } from '../shared/date';
import {
  createTranslator,
  formatNumber,
  formatVisitCount,
  resolveLocale,
} from '../shared/i18n';
import type {
  MessageKey,
  MessageReplacements,
  Translator,
} from '../shared/i18n';
import { rankSites } from '../shared/ranking';
import {
  deleteSiteStat,
  getSettings,
  getSiteStats,
  setSettings,
} from '../shared/storage';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../shared/constants';
import type {
  ExtensionSettings,
  SiteVisitMap,
  SiteVisitStat,
  SupportedLocale,
} from '../shared/types';

function SiteIcon({ site }: { site: SiteVisitStat }) {
  const [failed, setFailed] = useState(false);
  const faviconUrl = `${chrome.runtime.getURL('_favicon/')}?${new URLSearchParams(
    {
      pageUrl: site.lastUrl,
      size: '32',
    },
  )}`;

  return (
    <span className="favicon" aria-hidden="true">
      {failed ? (
        <Globe2 size={19} />
      ) : (
        <img
          src={faviconUrl}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

interface SiteRowProps {
  rank: number;
  site: SiteVisitStat;
  locale: SupportedLocale;
  t: Translator;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onOpen: () => void;
  onExclude: () => void;
  onDelete: () => void;
}

function SiteRow({
  rank,
  site,
  locale,
  t,
  menuOpen,
  onToggleMenu,
  onOpen,
  onExclude,
  onDelete,
}: SiteRowProps) {
  return (
    <article className="site-item">
      <button
        className="site-main"
        type="button"
        onClick={onOpen}
        aria-label={t('openSiteLabel', { title: site.title })}
      >
        <span className={`rank ${rank <= 3 ? 'top' : ''}`}>{rank}</span>
        <SiteIcon site={site} />
        <span className="site-copy">
          <span className="site-title">{site.title || site.hostname}</span>
          <span className="site-hostname">{site.hostname}</span>
          <span className="site-meta">
            <strong>{formatVisitCount(site.visitCount, locale)}</strong>
            <span>
              {t('recentlyVisited', {
                time: formatRelativeTime(site.lastVisitedAt, locale),
              })}
            </span>
          </span>
        </span>
      </button>
      <button
        className="icon-button more-button"
        type="button"
        aria-label={t('moreActionsLabel', { hostname: site.hostname })}
        aria-expanded={menuOpen}
        onClick={onToggleMenu}
      >
        <MoreHorizontal size={17} />
      </button>
      {menuOpen && (
        <div className="menu" role="menu">
          <button type="button" role="menuitem" onClick={onOpen}>
            <ExternalLink size={14} />
            {t('menuOpenSite')}
          </button>
          <button type="button" role="menuitem" onClick={onExclude}>
            <Ban size={14} />
            {t('menuExcludeSite')}
          </button>
          <button
            className="danger"
            type="button"
            role="menuitem"
            onClick={onDelete}
          >
            <Trash2 size={14} />
            {t('menuDeleteStats')}
          </button>
        </div>
      )}
    </article>
  );
}

export function App() {
  const [siteStats, setSiteStats] = useState<SiteVisitMap>({});
  const [settings, setLocalSettings] =
    useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    key: MessageKey;
    replacements?: MessageReplacements;
  } | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const locale = useMemo(
    () => resolveLocale(settings.language),
    [settings.language],
  );
  const t = useMemo(() => createTranslator(locale), [locale]);

  const loadData = useCallback(async () => {
    try {
      const [nextStats, nextSettings] = await Promise.all([
        getSiteStats(),
        getSettings(),
      ]);
      setSiteStats(nextStats);
      setLocalSettings(nextSettings);
      setError(null);
    } catch {
      setError({ key: 'loadStatsError' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (
        areaName === 'local' &&
        (changes[STORAGE_KEYS.SITE_STATS] || changes[STORAGE_KEYS.SETTINGS])
      ) {
        void loadData();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [loadData]);

  useEffect(() => {
    document.documentElement.lang = locale === 'zh_CN' ? 'zh-CN' : 'en';
    document.title = t('appName');
  }, [locale, t]);

  const rankedSites = useMemo(
    () => rankSites(siteStats, { keyword }),
    [keyword, siteStats],
  );
  const siteCount = Object.keys(siteStats).length;
  const totalVisits = Object.values(siteStats).reduce(
    (total, site) => total + site.visitCount,
    0,
  );

  const openSite = async (site: SiteVisitStat) => {
    setOpenMenu(null);
    try {
      await chrome.tabs.create({ url: site.lastUrl });
    } catch {
      setError({
        key: 'openSiteError',
        replacements: { hostname: site.hostname },
      });
    }
  };

  const excludeSite = async (hostname: string) => {
    try {
      const settings = await getSettings();
      await setSettings({
        ...settings,
        excludedHostnames: [
          ...new Set([...settings.excludedHostnames, hostname]),
        ].sort(),
      });
      setOpenMenu(null);
    } catch {
      setError({
        key: 'excludeSiteError',
        replacements: { hostname },
      });
    }
  };

  const removeSite = async (site: SiteVisitStat) => {
    setOpenMenu(null);
    if (
      !window.confirm(
        t('deleteConfirm', {
          hostname: site.hostname,
        }),
      )
    ) {
      return;
    }

    try {
      await deleteSiteStat(site.hostname);
      await loadData();
    } catch {
      setError({
        key: 'deleteSiteError',
        replacements: { hostname: site.hostname },
      });
    }
  };

  return (
    <main className="popup-shell">
      <header className="popup-top">
        <div className="brand-row">
          <div className="brand">
            <span className="brand-mark">
              <TrendingUp size={23} strokeWidth={2.4} />
            </span>
            <div className="brand-copy">
              <h1>{t('appName')}</h1>
              <p>{t('popupTagline')}</p>
            </div>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label={t('openSettings')}
            onClick={() => void chrome.runtime.openOptionsPage()}
          >
            <Settings size={19} />
          </button>
        </div>

        <label className="search-box">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={keyword}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchAria')}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>

        <section className="summary" aria-label={t('summaryAria')}>
          <span className="summary-item">
            {t('recordedSites')}{' '}
            <strong>{formatNumber(siteCount, locale)}</strong>
          </span>
          <span className="summary-divider" aria-hidden="true" />
          <span className="summary-item">
            {t('totalVisits')}{' '}
            <strong>{formatNumber(totalVisits, locale)}</strong>
          </span>
        </section>
      </header>

      {loading ? (
        <div className="status-state">{t('loadingStats')}</div>
      ) : error ? (
        <div className="status-state" role="alert">
          {t(error.key, error.replacements)}
        </div>
      ) : rankedSites.length > 0 ? (
        <section className="site-list" aria-label={t('rankingAria')}>
          {rankedSites.map((site, index) => (
            <SiteRow
              key={site.hostname}
              rank={index + 1}
              site={site}
              locale={locale}
              t={t}
              menuOpen={openMenu === site.hostname}
              onToggleMenu={() =>
                setOpenMenu((current) =>
                  current === site.hostname ? null : site.hostname,
                )
              }
              onOpen={() => void openSite(site)}
              onExclude={() => void excludeSite(site.hostname)}
              onDelete={() => void removeSite(site)}
            />
          ))}
        </section>
      ) : (
        <section className="empty-state">
          <div>
            <span className="empty-state-icon">
              {keyword ? <Search size={25} /> : <Globe2 size={27} />}
            </span>
            <h2>{keyword ? t('noSearchResults') : t('noVisitRecords')}</h2>
            <p>{keyword ? t('searchHint') : t('emptyHint')}</p>
          </div>
        </section>
      )}

      <footer className="popup-footer">
        <ShieldCheck size={11} aria-hidden="true" /> {t('privacyFooter')}
      </footer>
    </main>
  );
}
