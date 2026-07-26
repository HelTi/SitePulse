import {
  Database,
  LockKeyhole,
  ShieldCheck,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { clearAllSiteStats, getSettings, setSettings } from '../shared/storage';
import type { ExtensionSettings } from '../shared/types';
import { normalizeHostnameInput } from '../shared/url';
import { DEFAULT_SETTINGS } from '../shared/constants';

export function App() {
  const [settings, setLocalSettings] =
    useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const loadSettings = useCallback(async () => {
    try {
      setLocalSettings(await getSettings());
    } catch {
      setStatus('无法读取设置，请刷新页面重试。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const persistSettings = async (nextSettings: ExtensionSettings) => {
    setLocalSettings(nextSettings);
    try {
      await setSettings(nextSettings);
      setStatus('设置已保存');
    } catch {
      setStatus('设置保存失败，请重试。');
      await loadSettings();
    }
  };

  const addExclusion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hostname = normalizeHostnameInput(input);
    if (!hostname) {
      setInputError('请输入有效域名或 HTTP/HTTPS 地址。');
      return;
    }

    if (settings.excludedHostnames.includes(hostname)) {
      setInputError('该域名已在排除列表中。');
      return;
    }

    setInput('');
    setInputError('');
    void persistSettings({
      ...settings,
      excludedHostnames: [...settings.excludedHostnames, hostname].sort(),
    });
  };

  const removeExclusion = (hostname: string) => {
    void persistSettings({
      ...settings,
      excludedHostnames: settings.excludedHostnames.filter(
        (item) => item !== hostname,
      ),
    });
  };

  const clearStats = async () => {
    if (
      !window.confirm(
        '确定要清空所有访问统计吗？\n\n该操作无法撤销，排除列表不会被删除。',
      )
    ) {
      return;
    }

    try {
      await clearAllSiteStats();
      setStatus('访问统计已清空，排除列表保持不变。');
    } catch {
      setStatus('清空失败，请重试。');
    }
  };

  return (
    <main className="options-shell">
      <header className="options-heading">
        <span className="brand-mark">
          <TrendingUp size={23} strokeWidth={2.4} />
        </span>
        <div>
          <h1>常访设置</h1>
          <p>控制统计范围与本地数据</p>
        </div>
      </header>

      {loading ? (
        <div className="status-state">正在读取设置…</div>
      ) : (
        <div className="settings-grid">
          <section className="settings-card setting-row">
            <div>
              <h2>启用访问统计</h2>
              <p>关闭后不再记录新访问，已有数据仍会保留。</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.trackingEnabled}
                aria-label="启用访问统计"
                onChange={(event) =>
                  void persistSettings({
                    ...settings,
                    trackingEnabled: event.target.checked,
                  })
                }
              />
              <span aria-hidden="true" />
            </label>
          </section>

          <section className="settings-card">
            <div className="section-title-row">
              <div>
                <h2>排除网站</h2>
                <p>精确匹配域名；排除 example.com 不会排除子域名。</p>
              </div>
              <ShieldCheck size={21} color="#6254df" />
            </div>
            <form className="input-row" onSubmit={addExclusion}>
              <input
                className="text-input"
                value={input}
                placeholder="example.com 或 https://example.com/path"
                aria-label="要排除的网站"
                onChange={(event) => {
                  setInput(event.target.value);
                  setInputError('');
                }}
              />
              <button className="primary-button" type="submit">
                添加
              </button>
            </form>
            {inputError && (
              <p className="field-error" role="alert">
                {inputError}
              </p>
            )}
            {settings.excludedHostnames.length > 0 ? (
              <div className="exclusion-list">
                {settings.excludedHostnames.map((hostname) => (
                  <div className="exclusion-row" key={hostname}>
                    <span>{hostname}</span>
                    <button
                      type="button"
                      aria-label={`移除 ${hostname}`}
                      onClick={() => removeExclusion(hostname)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p>当前没有排除的网站。</p>
            )}
          </section>

          <section className="settings-card setting-row">
            <div>
              <h2>清空统计数据</h2>
              <p>删除全部访问次数，但不会删除排除列表和其他设置。</p>
            </div>
            <button
              className="danger-button"
              type="button"
              onClick={() => void clearStats()}
            >
              清空统计
            </button>
          </section>

          <section className="settings-card privacy-note">
            <LockKeyhole size={22} />
            <div>
              <h2>隐私说明</h2>
              <p>
                所有访问统计仅保存在你的浏览器本地，不会上传到任何服务器。常访不读取网页正文、输入内容或安装前的浏览历史。
              </p>
            </div>
          </section>

          <section className="settings-card">
            <div className="about-line">
              <span>
                <Database size={14} /> 本地存储 · Schema v1
              </span>
              <span>常访 SitePulse · v1.0.0</span>
            </div>
          </section>

          {status && (
            <p className="about-line" role="status">
              {status}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
