"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  readBrowserValue,
  writeBrowserValue,
} from "../../storage/browserStorage";
import { useI18n } from "./i18n";

export type ThemeMode = "system" | "light" | "dark";
const STORAGE_KEY = "pokguy-theme";
const modes: ThemeMode[] = ["light", "dark", "system"];
const labels = { light: "浅色", dark: "深色", system: "跟随系统" };
const descriptions = {
  light: "暖纸底色，清爽明亮",
  dark: "柔和暗色，专注牌局",
  system: "随设备外观自动切换",
};

function validMode(value: string | null): ThemeMode {
  return value === "light" || value === "dark" ? value : "system";
}

function applyTheme(mode: ThemeMode, systemDark: boolean) {
  const resolved = mode === "system" ? (systemDark ? "dark" : "light") : mode;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themeMode = mode;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", resolved === "dark" ? "#171e1b" : "#f3f2ec");
}

const ThemeContext = createContext<{
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}>({ mode: "system", setMode: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const sync = () => {
      const next = validMode(readBrowserValue(STORAGE_KEY));
      setModeState(next);
      applyTheme(next, media?.matches ?? false);
    };
    // Hydrate the saved preference after the server's neutral system selection.
    sync();
    const onSystemChange = () => {
      const current = validMode(
        document.documentElement.dataset.themeMode ?? null,
      );
      applyTheme(current, media?.matches ?? false);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) sync();
    };
    media?.addEventListener?.("change", onSystemChange);
    window.addEventListener("storage", onStorage);
    return () => {
      media?.removeEventListener?.("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    writeBrowserValue(STORAGE_KEY, next);
    applyTheme(
      next,
      window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false,
    );
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

function ThemeIcon({ mode }: { mode: ThemeMode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {mode === "light" ? (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </>
      ) : mode === "dark" ? (
        <path d="M20.5 13.2A8.7 8.7 0 0 1 10.8 3.5a8.7 8.7 0 1 0 9.7 9.7Z" />
      ) : (
        <>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8m-4-4v4M12 4v13" />
        </>
      )}
    </svg>
  );
}

export function ThemeSelect() {
  const { mode, setMode } = useContext(ThemeContext);
  const { t } = useI18n();
  return (
    <label className="theme-select" title={t("外观模式")}>
      <ThemeIcon mode={mode} />
      <select
        aria-label={t("外观模式")}
        value={mode}
        onChange={(event) => setMode(event.target.value as ThemeMode)}
      >
        {modes.map((value) => (
          <option key={value} value={value}>
            {t(labels[value])}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ThemeSettings() {
  const { mode, setMode } = useContext(ThemeContext);
  const { t } = useI18n();
  return (
    <section className="panel settings-section appearance-section">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{t("界面偏好")}</p>
          <h2>{t("外观")}</h2>
        </div>
        <span className="appearance-note">{t("自动保存于此设备")}</span>
      </div>
      <div
        className="theme-options"
        role="radiogroup"
        aria-label={t("外观模式")}
      >
        {modes.map((value) => (
          <label className="theme-option" key={value}>
            <input
              type="radio"
              name="appearance"
              value={value}
              checked={mode === value}
              onChange={() => setMode(value)}
            />
            <span className="theme-option-icon">
              <ThemeIcon mode={value} />
            </span>
            <span className="theme-option-copy">
              <strong>{t(labels[value])}</strong>
              <small>{t(descriptions[value])}</small>
            </span>
            <span className="theme-option-check" aria-hidden="true" />
          </label>
        ))}
      </div>
    </section>
  );
}
