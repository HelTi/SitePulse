import {
  Database,
  Languages,
  LockKeyhole,
  ShieldCheck,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DEFAULT_SETTINGS } from '../shared/constants';
import { createTranslator, resolveLocale } from '../shared/i18n';
import type { MessageKey } from '../shared/i18n';
import { clearAllSiteStats, getSettings, setSettings } from '../shared/storage';
import type { ExtensionSettings, LanguagePreference } from '../shared/types';
import { normalizeHostnameInput } from '../shared/url';

export function App() {
  const [settings, setLocalSettings] =
    useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState<MessageKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<MessageKey | null>(null);
  const locale = useMemo(
    () => resolveLocale(settings.language),
    [settings.language],
  );
  const t = useMemo(() => createTranslator(locale), [locale]);

  const loadSettings = useCallback(async () => {
    try {
      setLocalSettings(await getSettings());
    } catch {
      setStatus('loadSettingsError');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    document.documentElement.lang = locale === 'zh_CN' ? 'zh-CN' : 'en';
    document.title = t('optionsTitle');
  }, [locale, t]);

  const persistSettings = async (nextSettings: ExtensionSettings) => {
    setLocalSettings(nextSettings);
    try {
      await setSettings(nextSettings);
      setStatus('settingsSaved');
    } catch {
      setStatus('settingsSaveError');
      await loadSettings();
    }
  };

  const addExclusion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hostname = normalizeHostnameInput(input);
    if (!hostname) {
      setInputError('invalidDomain');
      return;
    }

    if (settings.excludedHostnames.includes(hostname)) {
      setInputError('duplicateDomain');
      return;
    }

    setInput('');
    setInputError(null);
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
    if (!window.confirm(t('clearConfirm'))) {
      return;
    }

    try {
      await clearAllSiteStats();
      setStatus('clearSuccess');
    } catch {
      setStatus('clearError');
    }
  };

  return (
    <main className="options-shell">
      <header className="options-heading">
        <span className="brand-mark">
          <TrendingUp size={23} strokeWidth={2.4} />
        </span>
        <div>
          <h1>{t('optionsTitle')}</h1>
          <p>{t('optionsSubtitle')}</p>
        </div>
      </header>

      {loading ? (
        <div className="status-state">{t('loadingSettings')}</div>
      ) : (
        <div className="settings-grid">
          <section className="settings-card setting-row">
            <div>
              <h2>{t('languageTitle')}</h2>
              <p>{t('languageDescription')}</p>
            </div>
            <div className="select-wrap">
              <Languages size={17} aria-hidden="true" />
              <select
                className="select-input"
                value={settings.language}
                aria-label={t('languageAria')}
                onChange={(event) =>
                  void persistSettings({
                    ...settings,
                    language: event.target.value as LanguagePreference,
                  })
                }
              >
                <option value="auto">{t('languageAuto')}</option>
                <option value="zh_CN">{t('languageChinese')}</option>
                <option value="en">{t('languageEnglish')}</option>
              </select>
            </div>
          </section>

          <section className="settings-card setting-row">
            <div>
              <h2>{t('trackingTitle')}</h2>
              <p>{t('trackingDescription')}</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.trackingEnabled}
                aria-label={t('trackingAria')}
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
                <h2>{t('exclusionsTitle')}</h2>
                <p>{t('exclusionsDescription')}</p>
              </div>
              <ShieldCheck size={21} color="#6254df" />
            </div>
            <form className="input-row" onSubmit={addExclusion}>
              <input
                className="text-input"
                value={input}
                placeholder={t('exclusionPlaceholder')}
                aria-label={t('exclusionAria')}
                onChange={(event) => {
                  setInput(event.target.value);
                  setInputError(null);
                }}
              />
              <button className="primary-button" type="submit">
                {t('add')}
              </button>
            </form>
            {inputError && (
              <p className="field-error" role="alert">
                {t(inputError)}
              </p>
            )}
            {settings.excludedHostnames.length > 0 ? (
              <div className="exclusion-list">
                {settings.excludedHostnames.map((hostname) => (
                  <div className="exclusion-row" key={hostname}>
                    <span>{hostname}</span>
                    <button
                      type="button"
                      aria-label={t('removeExclusion', { hostname })}
                      onClick={() => removeExclusion(hostname)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p>{t('noExclusions')}</p>
            )}
          </section>

          <section className="settings-card setting-row">
            <div>
              <h2>{t('clearTitle')}</h2>
              <p>{t('clearDescription')}</p>
            </div>
            <button
              className="danger-button"
              type="button"
              onClick={() => void clearStats()}
            >
              {t('clearButton')}
            </button>
          </section>

          <section className="settings-card privacy-note">
            <LockKeyhole size={22} />
            <div>
              <h2>{t('privacyTitle')}</h2>
              <p>{t('privacyDescription')}</p>
            </div>
          </section>

          <section className="settings-card">
            <div className="about-line">
              <span>
                <Database size={14} /> {t('localStorageLabel')}
              </span>
              <span>{t('aboutLabel')}</span>
            </div>
          </section>

          {status && (
            <p className="about-line" role="status">
              {t(status)}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
