export const REPORT_SECTIONS = [
  {
    key: "includeReaction",
    label: "Reaction check-ins",
    description: "PVT-B speed, lapses & normal-zone status",
    icon: "touch_app",
  },
  {
    key: "includeSleep",
    label: "Sleep duration",
    description: "Reported hours slept before check-in",
    icon: "bedtime",
  },
  {
    key: "includeBp",
    label: "Blood pressure",
    description: "Resting readings, category & symptom screen",
    icon: "monitor_heart",
  },
  {
    key: "includeCards",
    label: "Action cards",
    description: "Server-triggered guidance cards & sources",
    icon: "assignment",
  },
];

export function sectionLabels(selection = {}) {
  return REPORT_SECTIONS.filter((s) => selection[s.key]).map((s) => s.label);
}
