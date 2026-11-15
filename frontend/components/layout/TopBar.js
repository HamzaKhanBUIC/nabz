"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import BrandLogo from "@/components/ui/BrandLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useStore } from "@/lib/data/store";
import { getCrewInitials, useSession } from "@/lib/data/session";
import { getEarthDelayLabel } from "@/lib/data/mission";
import { APP_NAME } from "@/lib/data/nav";

/** "3 to 22 min" -> "Earth delay 3 to 22 min"; a link with no figure ("Satellite link only") stays as written. */
function delayFact(env) {
  const delay = env?.oneWayDelay;
  if (!delay?.text) return null;
  if (delay.minSeconds == null && delay.maxSeconds == null) return delay.text;
  return `Earth delay ${delay.text.charAt(0).toLowerCase()}${delay.text.slice(1)}`;
}

/** One link that says where the crew is: mission day and environment, then the two facts that change daily life. */
function MissionStatus({ missionDay, missionName, env, fallbackDelay, href }) {
  const title = env ? `Day ${missionDay} · ${env.name}` : `Day ${missionDay} · ${missionName}`;
  const facts = env ? [delayFact(env), env.gravity].filter(Boolean) : [fallbackDelay];
  const tooltip = env
    ? `${missionName}, day ${missionDay}. ${env.name}: ${[delayFact(env), env.gravity, env.timeToCare]
        .filter(Boolean)
        .join(", ")}.${href ? " Open mission environment." : ""}`
    : undefined;

  const body = (
    <>
      <span className="block truncate text-sm font-semibold text-primary">{title}</span>
      <span className="block truncate text-xs text-muted">{facts.join(" · ")}</span>
    </>
  );

  const base = "min-w-0 max-w-[26rem] rounded-md px-2 py-1";
  if (!href) {
    return (
      <div className={base} title={tooltip}>
        {body}
      </div>
    );
  }
  return (
    <Link
      href={href}
      title={tooltip}
      className={`${base} -mx-0.5 transition-colors duration-150 hover:bg-hover focus-visible:bg-hover`}
    >
      {body}
    </Link>
  );
}

/** Below lg the sidebar is hidden, so the crew member and their actions live here. */
function AccountMenu({ crew, onSwitch }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${crew.name}, ${crew.role}. Open account menu`}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-raised text-sm font-semibold text-primary transition-[transform,background-color,border-color] duration-150 ease-[var(--ease-smooth)] hover:border-line-strong hover:bg-hover active:scale-95"
      >
        {getCrewInitials(crew.name)}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-64 rounded-lg border border-line bg-surface p-2 shadow-lg">
          <div className="px-2.5 pb-2 pt-1.5">
            <p className="truncate text-sm font-semibold text-primary">{crew.name}</p>
            <p className="truncate text-xs text-muted">{crew.role}</p>
          </div>
          <div className="border-t border-line pt-1.5">
            <Link
              href="/privacy"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium text-secondary transition-colors hover:bg-hover hover:text-primary"
            >
              <Icon name="lock" size={18} />
              <span>Privacy and sharing</span>
            </Link>
            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await onSwitch();
              }}
              className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-left text-sm font-medium text-secondary transition-colors hover:bg-hover hover:text-primary"
            >
              <Icon name="swap_horiz" size={18} />
              <span>Switch crew member</span>
            </button>
            <div className="flex min-h-11 items-center justify-between gap-2.5 rounded-md pl-2.5 text-sm font-medium text-secondary sm:hidden">
              <span>Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TopBar({ onOpenMenu }) {
  const { mission, environment, backendOnline } = useStore();
  const { isAuthenticated, crew, switchCrewMember } = useSession();
  const missionDay = mission?.missionDay ?? 1;
  const missionName = mission?.name || "Mars Transit Sim";
  const signedIn = isAuthenticated && crew;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas">
      <div className="flex min-h-16 items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-secondary transition-[transform,background-color,color] duration-150 ease-[var(--ease-smooth)] hover:bg-hover hover:text-primary active:scale-95 lg:hidden"
        >
          <Icon name="menu" size={24} />
        </button>

        <Link
          href={isAuthenticated ? "/" : "/real-data"}
          aria-label={`${APP_NAME} home`}
          className="group hidden shrink-0 items-center sm:flex lg:w-[15.375rem]"
        >
          <BrandLogo />
        </Link>

        <span aria-hidden="true" className="hidden h-8 w-px shrink-0 bg-line sm:block lg:hidden" />

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <MissionStatus
            missionDay={missionDay}
            missionName={missionName}
            env={environment?.active || null}
            fallbackDelay={getEarthDelayLabel(mission, environment)}
            href={isAuthenticated ? "/environment" : undefined}
          />
          {!backendOnline ? (
            <span
              title="Local server unreachable. Emergency guides still work offline."
              className="inline-flex shrink-0 items-center gap-1 rounded-pill border border-attention/40 bg-attention/10 px-2 py-0.5 text-xs font-medium text-attention"
            >
              <Icon name="cloud_off" size={14} />
              <span>Offline</span>
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <ThemeToggle className="hidden sm:flex" />
          {signedIn ? (
            <AccountMenu crew={crew} onSwitch={switchCrewMember} />
          ) : (
            <Link
              href="/sign-in"
              className="hidden min-h-11 items-center gap-1.5 rounded-md border border-line bg-surface px-3.5 text-sm font-medium text-secondary transition-colors hover:bg-hover hover:text-primary sm:inline-flex"
            >
              <Icon name="login" size={18} />
              <span>Sign in</span>
            </Link>
          )}
          <Link
            href="/emergency"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md bg-emergency-solid px-3 text-sm font-semibold text-white transition-[transform,background-color,box-shadow] duration-150 ease-[var(--ease-smooth)] hover:bg-emergency-hover active:scale-[0.98] sm:px-4"
            aria-label="Open emergency mode"
          >
            <Icon name="emergency" filled size={20} />
            <span className="hidden sm:inline">Emergency</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
