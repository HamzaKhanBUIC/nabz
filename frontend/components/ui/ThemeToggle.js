"use client";

/**
 * Theme toggle — switches between the Nova dark and light token sets.
 *
 * Rendered as a 44px icon button so it meets the mobile target size, and
 * always paired with an accessible label (Material Symbols are rendered as
 * ligature text, so the visible icon sits next to nothing on the compact
 * variant; `aria-label` carries the meaning).
 */

import Icon from "@/components/ui/Icon";
import { useTheme } from "@/lib/theme";

export default function ThemeToggle({ variant = "outline", className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const nextLabel = isLight ? "Switch to dark theme" : "Switch to light theme";

  const base =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-colors";
  const skin =
    variant === "on-emergency"
      ? "border border-white text-white hover:bg-white/15"
      : "border border-line text-secondary hover:bg-hover";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`${base} ${skin} ${className}`}
      aria-label={nextLabel}
      title={nextLabel}
      data-theme-toggle
    >
      {/* Shows the theme you would switch to. */}
      <Icon name={isLight ? "dark_mode" : "light_mode"} size={22} />
    </button>
  );
}
