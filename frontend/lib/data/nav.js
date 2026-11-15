export const APP_NAME = "CrewPulse";

export const NAV_ITEMS = [
  {
    href: "/",
    label: "Today",
    mobileLabel: "Today",
    icon: "home",
    description: "Daily status, reminders, and checks",
  },
  {
    href: "/check-in",
    label: "Check-in",
    mobileLabel: "Check-in",
    icon: "touch_app",
    description: "3-minute reaction and sleep check-in",
  },
  {
    href: "/normal-zone",
    label: "Normal zone",
    mobileLabel: "Baseline",
    icon: "monitoring",
    description: "Personal baseline trends across mission days",
  },
  {
    href: "/measure",
    label: "Measure",
    mobileLabel: "Measure",
    icon: "monitor_heart",
    description: "Guided resting blood pressure check",
  },
  {
    href: "/coach",
    label: "Coach",
    mobileLabel: "Coach",
    icon: "smart_toy",
    description: "Offline handbook Q&A",
  },
  {
    href: "/send-to-earth",
    label: "Send to Earth",
    mobileLabel: "Earth",
    icon: "send",
    description: "Preview and queue flight-surgeon summary",
  },
];

export const EMERGENCY_NAV = {
  href: "/emergency",
  label: "Emergency",
  icon: "warning",
  description: "Offline self & crewmate emergency protocols",
};

export const SECTION_FOR_PATH = {
  "/": "today",
  "/check-in": "check-in",
  "/normal-zone": "normal-zone",
  "/measure": "measure",
  "/measure/blood-pressure": "measure",
  "/coach": "coach",
  "/send-to-earth": "send-to-earth",
  "/sent": "send-to-earth",
  "/emergency": "emergency",
};

export function sectionForPath(pathname) {
  if (!pathname) return "today";
  if (SECTION_FOR_PATH[pathname]) return SECTION_FOR_PATH[pathname];
  if (pathname.startsWith("/check-in")) return "check-in";
  if (pathname.startsWith("/normal-zone")) return "normal-zone";
  if (pathname.startsWith("/measure")) return "measure";
  if (pathname.startsWith("/coach")) return "coach";
  if (pathname.startsWith("/send-to-earth") || pathname.startsWith("/sent")) {
    return "send-to-earth";
  }
  if (pathname.startsWith("/emergency")) return "emergency";
  return "today";
}
