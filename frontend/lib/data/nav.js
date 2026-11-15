export const APP_NAME = "Nabz";

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

export const HAZARDS_NAV = {
  href: "/hazards",
  label: "5 hazards",
  icon: "health_and_safety",
  description: "NASA's five hazards and mission radiation estimate",
};

export const REAL_DATA_NAV = {
  href: "/real-data",
  label: "Real astronaut data",
  icon: "biotech",
  description: "NASA OSDR OSD-569 Inspiration4 blood trends",
};

export const ENVIRONMENT_NAV = {
  href: "/environment",
  label: "Mission environment",
  icon: "satellite_alt",
  description: "Active mission environment, delay, and escalation guidance",
};

export const PRIVACY_NAV = {
  href: "/privacy",
  label: "Privacy",
  icon: "lock",
  description: "Medical Officer sharing control and access log",
};

export const CREW_HEALTH_NAV = {
  href: "/crew-health",
  label: "Crew health",
  icon: "groups",
  description: "Medical Officer crew overview",
};

export const SIGN_IN_NAV = {
  href: "/sign-in",
  label: "Sign in",
  icon: "login",
  description: "Sign in with your crew name and code",
};

export function getSecondaryNavItems({ isAuthenticated, isMedicalOfficer }) {
  if (!isAuthenticated) {
    return [HAZARDS_NAV, REAL_DATA_NAV, SIGN_IN_NAV];
  }
  return [
    HAZARDS_NAV,
    REAL_DATA_NAV,
    ENVIRONMENT_NAV,
    PRIVACY_NAV,
    ...(isMedicalOfficer ? [CREW_HEALTH_NAV] : []),
  ];
}

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
  "/hazards": "hazards",
  "/real-data": "real-data",
  "/environment": "environment",
  "/privacy": "privacy",
  "/crew-health": "crew-health",
  "/sign-in": "sign-in",
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
  if (pathname.startsWith("/hazards")) return "hazards";
  if (pathname.startsWith("/real-data")) return "real-data";
  if (pathname.startsWith("/environment")) return "environment";
  if (pathname.startsWith("/privacy")) return "privacy";
  if (pathname.startsWith("/crew-health")) return "crew-health";
  if (pathname.startsWith("/sign-in")) return "sign-in";
  return "today";
}
