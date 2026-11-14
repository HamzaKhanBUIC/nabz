import { z } from "zod";
import { Card } from "./card";
import { EntrySource, ZoneResult } from "./checkin";
import { Disclaimer, IsoDateTime, SourceRef } from "./common";

/** Symptoms that turn a severe reading into "act now" (research/CHECKS.md, R3). */
export const SevereSymptom = z.enum([
  "chest-pain",
  "shortness-of-breath",
  "back-pain",
  "numbness-or-weakness",
  "vision-change",
  "trouble-speaking",
]);
export type SevereSymptom = z.infer<typeof SevereSymptom>;

/** Symptoms that turn a low reading into "act now" (research/CHECKS.md, R3 addendum). */
export const LowSymptom = z.enum([
  "confusion",
  "dizziness-or-lightheadedness",
  "fainting",
  "cold-sweaty-skin",
  "rapid-breathing",
  "weak-rapid-pulse",
]);
export type LowSymptom = z.infer<typeof LowSymptom>;

export const BpSymptom = z.union([SevereSymptom, LowSymptom]);
export type BpSymptom = z.infer<typeof BpSymptom>;

/** mmHg; pulse in beats per minute. Bounds only reject impossible numbers. */
export const BpReading = z.strictObject({
  systolic: z.number().int().min(40).max(300),
  diastolic: z.number().int().min(20).max(200),
  pulse: z.number().int().min(20).max(250).optional(),
});
export type BpReading = z.infer<typeof BpReading>;

/** Request body of POST /api/measurements/bp. */
export const BpInput = z.strictObject({
  takenAt: IsoDateTime,
  readings: z.array(BpReading).min(1).max(3),
  symptoms: z.array(BpSymptom).max(12),
  /** Set on a retest: the id of the measurement that asked for it. */
  retestOf: z.string().min(1).optional(),
});
export type BpInput = z.infer<typeof BpInput>;

export const BpCategory = z.enum(["low", "normal", "elevated", "stage1", "stage2", "severe"]);
export type BpCategory = z.infer<typeof BpCategory>;

export const NextAction = z.object({
  type: z.enum(["none", "retest", "alert_crew"]),
  afterSeconds: z.number().int().positive().optional(),
});
export type NextAction = z.infer<typeof NextAction>;

/** Response of POST /api/measurements/bp. */
export const BpMeasurement = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1),
  missionDay: z.number().int().positive(),
  effectiveDateTime: IsoDateTime,
  readings: z.array(BpReading).min(1),
  average: BpReading,
  category: BpCategory,
  symptoms: z.array(BpSymptom),
  retestOf: z.string().optional(),
  zone: ZoneResult,
  nextAction: NextAction,
  card: Card,
  source: EntrySource,
});
export type BpMeasurement = z.infer<typeof BpMeasurement>;

export const GuideStep = z.strictObject({
  id: z.string().min(1),
  text: z.string().min(1),
  detail: z.string().optional(),
  timerSeconds: z.number().int().positive().optional(),
  /** true when the step is our microgravity adaptation, not a sourced step. */
  adaptation: z.boolean().optional(),
});

const SymptomOption = (id: z.ZodType<string>) => z.strictObject({ id, label: z.string().min(1) });

/** Response of GET /api/measurements/bp/guide, and the shape of content/bp-guide.json minus sourceIds. */
export const BpGuide = z.object({
  version: z.number().int().positive(),
  steps: z.array(GuideStep).min(1),
  severeSymptoms: z.array(SymptomOption(SevereSymptom)).min(1),
  lowSymptoms: z.array(SymptomOption(LowSymptom)).min(1),
  disclaimer: Disclaimer,
  sources: z.array(SourceRef).min(1),
});
export type BpGuide = z.infer<typeof BpGuide>;

/** content/bp-guide.json */
export const BpGuideFile = z.strictObject({
  version: z.number().int().positive(),
  steps: z.array(GuideStep).min(1),
  severeSymptoms: z.array(SymptomOption(SevereSymptom)).min(1),
  lowSymptoms: z.array(SymptomOption(LowSymptom)).min(1),
  disclaimer: Disclaimer,
  sourceIds: z.array(z.string().min(1)).min(1),
});
