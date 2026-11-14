import { z } from "zod";
import { Disclaimer, Level, SourceRef, Status } from "./common";

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
