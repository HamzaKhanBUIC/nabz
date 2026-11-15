/**
 * Sections a crew member can share with the ground team.
 *
 * Shared by `/send-to-earth` (the picker + preview) and `/sent` (the
 * confirmation), so the labels can never drift apart between the two screens.
 */

export const REPORT_SECTIONS = [
  {
    key: "reaction",
    label: "Reaction trend",
    icon: "trending_up",
    hint: "Response time history from check-ins",
  },
  {
    key: "sleep",
    label: "Sleep hours",
    icon: "bedtime",
    hint: "Recorded sleep duration per check-in",
  },
  {
    key: "mood",
    label: "Mood",
    icon: "sentiment_satisfied",
    hint: "Self-rated mood, 1 to 5",
  },
  {
    key: "bloodPressure",
    label: "Blood pressure reading",
    icon: "bloodtype",
    hint: "Latest systolic and diastolic values",
  },
];

/** Labels for the section keys a report carries, in display order. */
export function sectionLabels(sections = {}) {
  return REPORT_SECTIONS.filter((section) => sections[section.key]).map(
    (section) => section.label
  );
}
