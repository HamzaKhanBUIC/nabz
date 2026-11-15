import type { Card, Environment, RadiationRateKey, Status } from "../schemas";
import { CAREER_LIMIT_MSV, ESCALATION_LEVELS, RADIATION_RATE_MSV_PER_DAY } from "./constants";

/**
 * E06: the "who to contact" line for a card in an environment, or null.
 * Rules decide: the line depends only on the card's severity. It never changes severity, zone or rule.
 */
export function pickEscalation(card: Pick<Card, "severity">, environment: Pick<Environment, "escalation">): string | null {
  return (ESCALATION_LEVELS as readonly string[]).includes(card.severity) ? environment.escalation : null;
}

/** Returns a copy of the card with the environment's escalation line set (or removed). Nothing else changes. */
export function withEscalation(card: Card, environment: Pick<Environment, "escalation">): Card {
  const { escalation: _old, ...rest } = card;
  void _old;
  const line = pickEscalation(card, environment);
  return line === null ? rest : { ...rest, escalation: line };
}

export interface DoseEstimate {
  dailyRateMsv: number | null;
  doseToDateMsv: number | null;
  percentOfCareerLimit: number | null;
  daysUntilLimit: number | null;
  status: Status;
}

const round1 = (v: number): number => Math.round(v * 10) / 10;

/**
 * E04: estimated dose so far, as if the whole mission so far were spent in this environment.
 * Pure: the rate comes from the key, the day from the caller.
 */
export function estimateDose(rateKey: RadiationRateKey | null, missionDay: number): DoseEstimate {
  if (rateKey === null) {
    return {
      dailyRateMsv: null,
      doseToDateMsv: null,
      percentOfCareerLimit: null,
      daysUntilLimit: null,
      status: { level: "info", label: "Not tracked here", iconKey: "info" },
    };
  }
  const rate = RADIATION_RATE_MSV_PER_DAY[rateKey];
  const dose = rate * missionDay;
  const reached = dose >= CAREER_LIMIT_MSV;
  return {
    dailyRateMsv: rate,
    doseToDateMsv: round1(dose),
    percentOfCareerLimit: round1((dose / CAREER_LIMIT_MSV) * 100),
    daysUntilLimit: reached ? 0 : Math.floor((CAREER_LIMIT_MSV - dose) / rate),
    status: reached
      ? { level: "act", label: "At or over the career limit", iconKey: "alert" }
      : { level: "info", label: "Under the career limit", iconKey: "info" },
  };
}
