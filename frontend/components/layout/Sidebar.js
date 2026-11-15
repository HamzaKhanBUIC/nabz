"use client";

/**
 * Desktop sidebar — handoff "Sidebar" (240 wide, bg-surface, right border,
 * user footer).
 *
 *   Today → 01, Check-in → 02, Measure → 05, user row → 14 Profile.
 *   Active item = bg-raised + 4px accent bar on the left edge, filled icon in
 *   accent-primary.
 *
 * `variant` is "fixed" (always visible) or "drawer" (mobile sheet).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { NAV_ITEMS, SECTION_FOR_PATH, sectionForPath } from "@/lib/data/nav";
import { useSession } from "@/lib/data/session";

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
            className={[
              "relative flex h-12 items-center gap-3 rounded-md pl-4 pr-3",
              "text-base font-medium transition-colors",
              active
                ? "bg-raised text-primary"
                : "text-secondary hover:bg-hover hover:text-primary",
            ].join(" ")}
          >
            {active ? (
              <span
                aria-hidden="true"
                className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-pill bg-accent"
              />
            ) : null}
            <Icon
              name={item.icon}
              filled={active}
              size={24}
              className={active ? "text-accent" : "text-secondary"}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function UserRow({ onNavigate }) {
  const { profile } = useSession();
  const pathname = usePathname();
  const active = sectionForPath(pathname) === "profile";

  const name = profile?.name || "Crew member";
  const role = profile?.role || "Not signed in";

  return (
    <Link
      href="/profile"
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center gap-3 rounded-md p-3 transition-colors ${
        active ? "bg-raised" : "hover:bg-hover"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          active ? "bg-hover" : "bg-raised"
        }`}
      >
        <Icon name="person" size={24} className="text-muted" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold leading-5 text-primary">
          {name}
        </span>
        <span className="block truncate text-xs leading-4 text-muted">
          {role}
        </span>
      </span>
    </Link>
  );
}

export default function Sidebar({ className = "" }) {
  return (
    <aside
      className={`sticky top-[72px] hidden h-[calc(100vh-72px)] w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex ${className}`}
    >
      <div className="flex flex-col px-3 pt-6">
        <NavList />
      </div>
      <div className="mt-auto px-3 pb-3">
        <UserRow />
      </div>
    </aside>
  );
}

export { UserRow };
