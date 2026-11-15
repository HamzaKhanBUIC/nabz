export const APP_NAME = "CrewPulse";

export const NAV_ITEMS = [
  {
    href: "/",
    label: "Today",
    icon: "home",
    description: "Daily mission status, reminders and guidance",
  },
  {
    href: "/check-in",
    label: "Check-in",
    icon: "touch_app",
    description: "3-minute PVT-B reaction and sleep check-in",
  },
  {
    href: "/normal-zone",
    label: "Normal zone",
    icon: "monitoring",
    description: "Personal baseline trends across mission days",
  },
  {
    href: "/measure",
    label: "Measure",
    icon: "monitor_heart",
    description: "Guided resting blood pressure workflow",
  },
  {
    href: "/coach",
    label: "Coach",
    icon: "smart_toy",
    description: "Grounded offline health explanations",
  },
  {
    href: "/send-to-earth",
    label: "Send to Earth",
    icon: "send",
    description: "Preview and queue health summary for ground",
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
