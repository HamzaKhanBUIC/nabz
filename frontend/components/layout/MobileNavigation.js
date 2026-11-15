"use client";

/**
 * Mobile & tablet navigation (< lg):
 *   - Bottom tab bar with concise labels and >=44px touch targets
 *   - Slide-in drawer triggered from the TopBar menu button
 */

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Icon from "@/components/ui/Icon";
import BrandLogo from "@/components/ui/BrandLogo";
import { NAV_ITEMS, SECTION_FOR_PATH, sectionForPath } from "@/lib/data/nav";
import { NavList, UserRow } from "@/components/layout/Sidebar";

const DRAWER_EASE = [0.22, 1, 0.36, 1];

export function BottomTabBar({ enabled = true }) {
  const pathname = usePathname();
  const section = sectionForPath(pathname);

  if (!enabled || pathname === "/emergency") return null;

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface lg:hidden"
      style={{
        paddingBottom: "max(0.25rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <ul className="mx-auto flex max-w-2xl items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = section === SECTION_FOR_PATH[item.href];
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group flex min-h-13 min-w-[44px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-center transition-[transform,color] duration-150 ease-[var(--ease-smooth)] active:scale-95 ${
                  active
                    ? "text-primary"
                    : "text-muted hover:text-primary"
                }`}
              >
                <span
                  className={`flex h-7 w-10 items-center justify-center rounded-pill transition-colors duration-150 ${
                    active ? "bg-raised" : "bg-transparent group-hover:bg-hover"
                  }`}
                >
                  <Icon name={item.icon} filled={active} size={20} />
                </span>
                <span className="w-full truncate text-xs font-medium leading-4">
                  {item.mobileLabel || item.label}
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
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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
            transition={{ duration: 0.2, ease: DRAWER_EASE }}
            className="absolute inset-0 bg-black/70"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            initial={reduceMotion ? false : { x: "-100%" }}
            animate={{ x: 0 }}
            exit={reduceMotion ? undefined : { x: "-100%" }}
            transition={{
              duration: reduceMotion ? 0 : 0.26,
              ease: DRAWER_EASE,
            }}
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85dvw] flex-col overscroll-contain border-r border-line bg-surface shadow-2xl"
          >
            <div className="flex min-h-16 items-center justify-between border-b border-line px-4 py-2">
              <span className="flex items-center">
                <BrandLogo />
              </span>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-md border border-line text-secondary transition-[transform,background-color,color] duration-150 hover:bg-hover hover:text-primary active:scale-95"
                aria-label="Close navigation menu"
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto px-3 pt-4">
              <NavList onNavigate={onClose} />
            </div>

            <div
              className="mt-auto px-3 pb-4 pt-3"
              style={{
                paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
              }}
            >
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
