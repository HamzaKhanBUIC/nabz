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
            className={`group flex min-h-11 items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-raised text-primary border border-line-strong"
                : "text-secondary border border-transparent hover:bg-hover hover:text-primary"
            }`}
          >
            <Icon
              name={item.icon}
              filled={active}
              size={20}
              className={active ? "text-accent" : "text-muted group-hover:text-secondary"}
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
    <div className="flex items-center gap-3 rounded-md border border-line bg-surface px-3.5 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised text-sm font-semibold text-primary">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-primary">
          {commander.name}
        </p>
        <p className="truncate text-xs text-muted">
          {commander.role} · {backendOnline ? "Local API ready" : "Offline cache"}
        </p>
      </div>
    </div>
  );
}

export default function Sidebar({ className = "" }) {
  return (
    <aside
      className={`hidden md:flex md:w-64 md:shrink-0 md:flex-col md:justify-between md:border-r md:border-line md:bg-canvas md:p-5 ${className}`}
    >
      <div>
        <p className="mb-3 px-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
          Crew workspace
        </p>
        <NavList />
      </div>

      <div className="pt-6">
        <UserRow />
      </div>
    </aside>
  );
}
