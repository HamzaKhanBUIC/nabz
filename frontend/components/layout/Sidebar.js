"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { NAV_ITEMS, SECTION_FOR_PATH, sectionForPath } from "@/lib/data/nav";
import { useStore } from "@/lib/data/store";
import { getCommander } from "@/lib/data/mission";

export function NavList({ onNavigate }) {
  const pathname = usePathname();
  const section = sectionForPath(pathname);

  return (
    <nav aria-label="Primary" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = section === SECTION_FOR_PATH[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group flex min-h-11 items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-smooth)] active:scale-[0.985] ${
              active
                ? "border border-line-strong bg-raised text-primary shadow-xs"
                : "border border-transparent text-secondary hover:bg-hover hover:text-primary"
            }`}
          >
            <Icon
              name={item.icon}
              filled={active}
              size={20}
              className={`transition-colors duration-150 ${
                active
                  ? "text-accent"
                  : "text-muted group-hover:text-secondary"
              }`}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function UserRow() {
  const { mission, backendOnline } = useStore();
  const commander = getCommander(mission);
  const initials = (commander.name || "S")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-md border border-line bg-surface px-3.5 py-3 shadow-card">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised text-sm font-semibold text-primary">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-primary">
          {commander.name}
        </p>
        <p className="truncate text-xs text-muted">
          {commander.role} · {backendOnline ? "Onboard link active" : "Offline mode"}
        </p>
      </div>
    </div>
  );
}

export default function Sidebar({ className = "" }) {
  return (
    <aside
      className={`hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:justify-between lg:border-r lg:border-line lg:bg-canvas lg:p-5 ${className}`}
    >
      <div>
        <p className="mb-3 px-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
          Menu
        </p>
        <NavList />
      </div>

      <div className="pt-6">
        <UserRow />
      </div>
    </aside>
  );
}
