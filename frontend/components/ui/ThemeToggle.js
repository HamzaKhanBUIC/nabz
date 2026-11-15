"use client";

import Icon from "@/components/ui/Icon";
import { useTheme } from "@/lib/theme";

export default function ThemeToggle({ variant = "outline", className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const nextLabel = isLight ? "Switch to dark theme" : "Switch to light theme";

  const base =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-smooth)] active:scale-95 cursor-pointer";
  const skin =
    variant === "on-emergency"
      ? "border border-white/60 text-white hover:bg-white/15"
      : "border border-line bg-surface text-secondary hover:bg-hover hover:border-line-strong hover:text-primary";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`${base} ${skin} ${className}`}
      aria-label={nextLabel}
      title={nextLabel}
      data-theme-toggle
    >
      <Icon name={isLight ? "dark_mode" : "light_mode"} size={20} />
    </button>
  );
}
