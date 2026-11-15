export const REPORT_SECTIONS = [
  {
    key: "includeReaction",
    label: "Reaction check-ins",
    description: "Your reaction results and normal zone",
    icon: "touch_app",
  },
  {
    key: "includeSleep",
    label: "Sleep duration",
    description: "Hours of sleep you logged",
    icon: "bedtime",
  },
  {
    key: "includeBp",
    label: "Blood pressure",
    description: "Your readings and symptom answers",
    icon: "monitor_heart",
  },
  {
    key: "includeCards",
    label: "Action cards",
    description: "What the app told you to do, with sources",
    icon: "assignment",
  },
];

export function sectionLabels(selection = {}) {
  return REPORT_SECTIONS.filter((s) => selection[s.key]).map((s) => s.label);
}
