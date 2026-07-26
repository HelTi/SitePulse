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
import { rankSites } from '../shared/ranking';
import {
  deleteSiteStat,
  getSettings,
  getSiteStats,
  setSettings,
} from '../shared/storage';
import { STORAGE_KEYS } from '../shared/constants';
import type { SiteVisitMap, SiteVisitStat } from '../shared/types';

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
  menuOpen: boolean;
  onToggleMenu: () => void;
  onOpen: () => void;
  onExclude: () => void;
  onDelete: () => void;
}

function SiteRow({
  rank,
  site,
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
        aria-label={`打开 ${site.title}`}
      >
        <span className={`rank ${rank <= 3 ? 'top' : ''}`}>{rank}</span>
        <SiteIcon site={site} />
        <span className="site-copy">
          <span className="site-title">{site.title || site.hostname}</span>
          <span className="site-hostname">{site.hostname}</span>
          <span className="site-meta">
            <strong>{site.visitCount.toLocaleString('zh-CN')} 次</strong>
            <span>最近访问 {formatRelativeTime(site.lastVisitedAt)}</span>
          </span>
        </span>
      </button>
      <button
        className="icon-button more-button"
        type="button"
        aria-label={`更多 ${site.hostname}`}
        aria-expanded={menuOpen}
        onClick={onToggleMenu}
      >
        <MoreHorizontal size={17} />
      </button>
      {menuOpen && (
        <div className="menu" role="menu">
          <button type="button" role="menuitem" onClick={onOpen}>
            <ExternalLink size={14} />
            打开网站
          </button>
          <button type="button" role="menuitem" onClick={onExclude}>
            <Ban size={14} />
            加入排除列表
          </button>
          <button
            className="danger"
            type="button"
            role="menuitem"
            onClick={onDelete}
          >
            <Trash2 size={14} />
            删除统计
          </button>
        </div>
      )}
    </article>
  );
}

export function App() {
  const [siteStats, setSiteStats] = useState<SiteVisitMap>({});
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setSiteStats(await getSiteStats());
      setError('');
    } catch {
      setError('暂时无法读取本地统计，请重新打开扩展。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName === 'local' && changes[STORAGE_KEYS.SITE_STATS]) {
        void loadStats();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [loadStats]);

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
      setError(`无法打开 ${site.hostname}`);
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
      setError(`无法排除 ${hostname}`);
    }
  };

  const removeSite = async (site: SiteVisitStat) => {
    setOpenMenu(null);
    if (
      !window.confirm(
        `确定删除 ${site.hostname} 的全部访问统计吗？\n\n之后再次访问会从 1 开始统计。`,
      )
    ) {
      return;
    }

    try {
      await deleteSiteStat(site.hostname);
      await loadStats();
    } catch {
      setError(`无法删除 ${site.hostname} 的统计`);
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
            <div>
              <h1>常访</h1>
              <p>看看哪些网站，占据了你的日常</p>
            </div>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="打开设置"
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
            placeholder="搜索网站名称或域名"
            aria-label="搜索网站"
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>

        <section className="summary" aria-label="访问统计摘要">
          <span className="summary-item">
            已记录网站 <strong>{siteCount.toLocaleString('zh-CN')}</strong>
          </span>
          <span className="summary-divider" aria-hidden="true" />
          <span className="summary-item">
            累计访问 <strong>{totalVisits.toLocaleString('zh-CN')}</strong>
          </span>
        </section>
      </header>

      {loading ? (
        <div className="status-state">正在读取本地统计…</div>
      ) : error ? (
        <div className="status-state" role="alert">
          {error}
        </div>
      ) : rankedSites.length > 0 ? (
        <section className="site-list" aria-label="常访网站排行榜">
          {rankedSites.map((site, index) => (
            <SiteRow
              key={site.hostname}
              rank={index + 1}
              site={site}
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
            <h2>{keyword ? '没有找到匹配的网站' : '还没有访问记录'}</h2>
            <p>
              {keyword
                ? '试试网站名称或域名中的其他关键词。'
                : '打开几个网站后，这里会生成你的常访排行榜。'}
            </p>
          </div>
        </section>
      )}

      <footer className="popup-footer">
        <ShieldCheck size={11} aria-hidden="true" />{' '}
        所有统计仅保存在本地，不会上传
      </footer>
    </main>
  );
}
