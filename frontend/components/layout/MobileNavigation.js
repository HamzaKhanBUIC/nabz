"use client";

/**
 * Mobile navigation:
 *   - bottom tab bar with the three primary sections (>=44px targets)
 *   - slide-in drawer (top bar menu button) with the nav + profile row
 *
 * Both replace the 240px sidebar below `lg`.
 */

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Icon from "@/components/ui/Icon";
import { NAV_ITEMS, SECTION_FOR_PATH, sectionForPath } from "@/lib/data/nav";
import { NavList, UserRow } from "@/components/layout/Sidebar";

export function BottomTabBar({ enabled = true }) {
  const pathname = usePathname();
  const section = sectionForPath(pathname);

  if (!enabled || pathname === "/emergency") return null;

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex">
        {NAV_ITEMS.map((item) => {
          const active = section === SECTION_FOR_PATH[item.href];
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-14 min-w-[44px] flex-col items-center justify-center gap-0.5 px-1 text-center transition-colors ${
                  active ? "text-accent" : "text-secondary hover:text-primary"
                }`}
              >
                <Icon name={item.icon} filled={active} size={22} />
                <span className="truncate text-[11px] font-medium leading-4">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileDrawer({ open, onClose }) {
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Close whenever the route changes.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            className="absolute inset-0 bg-[#070b14]/70"
          />
          <motion.div
            role="dialog"
            aria-label="Navigation"
            initial={reduceMotion ? false : { x: "-100%" }}
            animate={{ x: 0 }}
            exit={reduceMotion ? undefined : { x: "-100%" }}
            transition={{ type: "tween", duration: reduceMotion ? 0 : 0.22 }}
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-surface"
          >
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <span className="t-h3 text-primary">Menu</span>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-md border border-line text-secondary hover:bg-hover"
                aria-label="Close navigation menu"
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            <div className="flex flex-col px-3 pt-4">
              <NavList onNavigate={onClose} />
            </div>

            <div className="mt-auto px-3 pb-4">
              <UserRow onNavigate={onClose} />
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export default function MobileNavigation({ open, onClose, tabsEnabled = true }) {
  return (
    <>
      <MobileDrawer open={open} onClose={onClose} />
      <BottomTabBar enabled={tabsEnabled} />
    </>
  );
}
