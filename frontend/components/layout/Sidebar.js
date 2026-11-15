"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonClassName } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import {
  NAV_ITEMS,
  SECTION_FOR_PATH,
  getSecondaryNavItems,
  sectionForPath,
} from "@/lib/data/nav";
import { getCrewInitials, useSession } from "@/lib/data/session";
import { useStore } from "@/lib/data/store";

function NavLinkItem({ item, active, onNavigate }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`group flex min-h-11 items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-smooth)] active:scale-[0.985] ${
        active
          ? "bg-raised text-primary"
          : "text-muted hover:bg-hover hover:text-primary"
      }`}
    >
      <Icon
        name={item.icon}
        filled={active}
        size={20}
        className={`transition-colors duration-150 ${
          active ? "text-primary" : "text-muted group-hover:text-secondary"
        }`}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function NavList({ onNavigate }) {
  const pathname = usePathname();
  const section = sectionForPath(pathname);
  const { isAuthenticated, isMedicalOfficer } = useSession();

  const secondaryItems = getSecondaryNavItems({
    isAuthenticated,
    isMedicalOfficer,
  });

  return (
    <div className="space-y-5">
      {isAuthenticated ? (
        <nav aria-label="Primary" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLinkItem
              key={item.href}
              item={item}
              active={section === SECTION_FOR_PATH[item.href]}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      ) : null}

      <div>
        <p className="mb-1.5 px-3.5 text-[13px] text-muted">
          {isAuthenticated ? "Data & settings" : "Public access"}
        </p>
        <nav aria-label="Crew and data" className="flex flex-col gap-1">
          {secondaryItems.map((item) => (
            <NavLinkItem
              key={item.href}
              item={item}
              active={section === SECTION_FOR_PATH[item.href]}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}

export function UserRow({ onNavigate }) {
  const { backendOnline } = useStore();
  const { isAuthenticated, crew, switchCrewMember } = useSession();

  if (!isAuthenticated || !crew) {
    return (
      <div className="rounded-md border border-line bg-surface p-3.5">
        <p className="text-sm font-semibold text-primary">Public view</p>
        <p className="mt-0.5 text-xs text-muted">
          Sign in to open your personal check-ins.
        </p>
        <Link
          href="/sign-in"
          onClick={onNavigate}
          className={buttonClassName("primary", "sm", "mt-3 w-full")}
        >
          <Icon name="login" size={16} />
          <span>Sign in</span>
        </Link>
      </div>
    );
  }

  const initials = getCrewInitials(crew.name);

  return (
    <div className="rounded-md border border-line bg-surface p-3.5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised text-sm font-semibold text-primary">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-primary">
            {crew.name}
          </p>
          <p className="truncate text-xs text-muted">
            {crew.role} · {backendOnline ? "Onboard link active" : "Offline mode"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={async () => {
          onNavigate?.();
          await switchCrewMember();
        }}
        className={buttonClassName("secondary", "sm", "mt-3 w-full")}
      >
        <Icon name="swap_horiz" size={16} />
        <span>Switch crew member</span>
      </button>
    </div>
  );
}

export default function Sidebar({ className = "" }) {
  const { isAuthenticated } = useSession();

  return (
    <aside
      className={`hidden lg:sticky lg:top-[65px] lg:flex lg:h-[calc(100dvh-65px)] lg:w-64 lg:shrink-0 lg:flex-col lg:justify-between lg:overflow-y-auto lg:border-r lg:border-line lg:bg-canvas lg:p-5 ${className}`}
    >
      <div>
        <NavList />
      </div>

      <div className="pt-6">
        <UserRow />
      </div>
    </aside>
  );
}
