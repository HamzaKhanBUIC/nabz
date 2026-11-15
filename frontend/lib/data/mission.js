import { formatDelayRange } from "@/lib/api";

export const DISCLAIMER_TEXT = "Decision support, not a diagnosis.";

export const coachDisclaimer =
  "Offline rule-based explanation. " + DISCLAIMER_TEXT;

export function getEarthDelayLabel(mission) {
  const range = formatDelayRange(mission?.commsDelay);
  return `${range} one-way delay`;
}

export function getCommander(mission) {
  const crew = mission?.crew || [];
  return (
    crew.find((member) => member.id === "sara") ||
    crew[0] || { id: "sara", name: "Sara", role: "Commander" }
  );
}
