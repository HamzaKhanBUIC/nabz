import { z } from "zod";
import { Disclaimer, Level, SourceRef, Status } from "./common";
import { HazardId, HazardRef } from "./environment";

/** The numbers a rule used. The AI coach (a later feature) reads these and nothing else about the user. */
export const Facts = z.record(z.string(), z.union([z.number(), z.string(), z.boolean()]));
export type Facts = z.infer<typeof Facts>;

export const CardLinks = z.object({
  emergencyProcedureId: z.string().optional(),
  measurement: z.literal("bp").optional(),
  routineId: z.string().optional(),
});

export const Card = z.object({
  id: z.string().min(1),
  ruleId: z.string().min(1),
  severity: Level,
  status: Status,
  title: z.string().min(1),
  whatChanged: z.string().min(1),
  whyItMatters: z.string().min(1),
  whatToDo: z.array(z.string().min(1)).min(1),
  facts: Facts,
  sources: z.array(SourceRef).min(1),
  disclaimer: Disclaimer,
  links: CardLinks.optional(),
  /** E03: NASA hazards this card relates to (at least one). */
  hazards: z.array(HazardRef).min(1),
  /** E03: HRP risk IDs this card relates to. */
  hrpRiskIds: z.array(z.number().int().positive()).min(1),
  /** E06: who to contact in the active environment; set on act and urgent cards in API responses, never stored. */
  escalation: z.string().min(1).optional(),
});
export type Card = z.infer<typeof Card>;

/** content/cards.json: wording with {placeholders} that are filled from facts. */
export const CardTemplate = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  whatChanged: z.string().min(1),
  whyItMatters: z.string().min(1),
  whatToDo: z.array(z.string().min(1)).min(1),
  sourceIds: z.array(z.string().min(1)).min(1),
  links: CardLinks.optional(),
  hazardIds: z.array(HazardId).min(1),
  hrpRiskIds: z.array(z.number().int().positive()).min(1),
});
export type CardTemplate = z.infer<typeof CardTemplate>;

export const CardTemplateFile = z.strictObject({
  version: z.number().int().positive(),
  templates: z.array(CardTemplate).min(1),
});

/** The only placeholders a template may use. */
export const CARD_PLACEHOLDERS = ["zAbs", "sleepHours", "lapses", "days", "systolic", "diastolic", "retestMinutes"] as const;

/** content/sources.json */
export const SourceFile = z.strictObject({
  version: z.number().int().positive(),
  sources: z.array(SourceRef).min(1),
});
