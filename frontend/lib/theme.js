"use client";

/**
 * Theme provider — dark (Nova default) / light.
 *
 * The handoff ships `tokens.css` with `:root` (dark) as the default and a
 * light override block, so the app mirrors that: `<html data-theme>` is the
 * single switch and every token in `globals.css` follows it.
 *
 * Persistence is a localStorage flag (frontend-only, no backend), applied by
 * the inline bootstrap script in the root layout *before* first paint so
 * there is no flash of the wrong theme.
 *
 * The value is exposed through `useSyncExternalStore` rather than `useState`
 * + an effect: localStorage is an external store, so React subscribes to it
 * instead of syncing it during render.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

export const THEME_STORAGE_KEY = "nabz:theme";

const ThemeContext = createContext({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

/** Normalise anything coming out of storage into a supported theme name. */
export function normalizeTheme(value) {
  return value === "light" ? "light" : "dark";
}

function readStoredTheme() {
  try {
    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "dark";
  }
}

/* ---- tiny external store ------------------------------------------- */

/** Cached snapshot — `useSyncExternalStore` requires a stable reference. */
let snapshot = null;
const listeners = new Set();

function getSnapshot() {
  if (snapshot === null) snapshot = readStoredTheme();
  return snapshot;
}

/** Server render always starts on the handoff default (dark). */
function getServerSnapshot() {
  return "dark";
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Write the theme to storage + DOM and notify React. */
function persistTheme(next) {
  const value = normalizeTheme(next);
  snapshot = value;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, value);
  } catch {
    // Storage unavailable — the theme still applies for this session.
  }
  const root = document.documentElement;
  root.setAttribute("data-theme", value);
  root.style.colorScheme = value;
  listeners.forEach((listener) => listener());
}

/**
 * Inline, dependency-free snippet that sets `data-theme` + `color-scheme`
 * before the first paint. Rendered as the first child of `<body>`.
 */
export const themeBootstrapScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});t=t==="light"?"light":"dark";var r=document.documentElement;r.setAttribute("data-theme",t);r.style.colorScheme=t;}catch(e){document.documentElement.setAttribute("data-theme","dark");document.documentElement.style.colorScheme="dark";}})();`;

export function ThemeProvider({ children }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next) => {
    persistTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    persistTheme(theme === "light" ? "dark" : "light");
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
