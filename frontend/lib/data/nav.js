/**
 * Sidebar + mobile navigation definition (single source of truth).
 *
 * Navigation is intentionally strict (handoff "Shared layout"):
 *   Today → 01, Check-in → 02, Measure → 05, user row → 14 Profile.
 * Normal Zone, Coach and Send to Earth remain reachable by URL but are not
 * navigation items.
 *
 * `icon` holds a Google Material Symbols ligature name (see icons.md).
 */
export const NAV_ITEMS = [
  {
    href: "/",
    label: "Today",
    icon: "home",
    description: "Daily overview and quick actions",
  },
  {
    href: "/check-in",
    label: "Check-in",
    icon: "touch_app",
    description: "Reaction, sleep and mood check-in",
  },
  {
    href: "/measure",
    label: "Measure",
    icon: "monitor_heart",
    description: "Blood pressure measurement workflow",
  },
];

/**
 * Section → sidebar item, so sub-screens (results, profile, blood pressure)
 * highlight their parent section exactly like the handoff's `active` prop.
 */
export const SECTION_FOR_PATH = {
  "/": "today",
  "/check-in": "check-in",
  "/measure": "measure",
  "/profile": "profile",
};

/** Resolve the active section for an arbitrary pathname. */
export function sectionForPath(pathname) {
  if (!pathname) return "today";
  if (pathname.startsWith("/check-in")) return "check-in";
  if (pathname.startsWith("/measure")) return "measure";
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname === "/normal-zone") return "today";
  if (pathname === "/coach") return "check-in";
  if (pathname === "/send-to-earth" || pathname === "/sent") return "measure";
  return "today";
}
