import { z } from "zod";

/** ISO 8601 date-time with an offset, e.g. 2026-11-15T08:02:11+00:00. */
export const IsoDateTime = z.iso.datetime({ offset: true });

/**
 * not_scored: the session failed quality checks, or the series has no zone.
 * building:   too few valid sessions for a personal baseline.
 */
export const Zone = z.enum(["not_scored", "building", "in_zone", "watch", "act"]);
export type Zone = z.infer<typeof Zone>;

export const Level = z.enum(["info", "in_zone", "watch", "act", "urgent"]);
export type Level = z.infer<typeof Level>;

export const IconKey = z.enum(["info", "hourglass", "check", "eye", "alert", "siren"]);
export type IconKey = z.infer<typeof IconKey>;

/** A status is never colour alone: it always has a text label and an icon key. */
export const Status = z.object({
  level: Level,
  label: z.string().min(1),
  iconKey: IconKey,
});
export type Status = z.infer<typeof Status>;

export const SourceRef = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.url(),
});
export type SourceRef = z.infer<typeof SourceRef>;

export const DISCLAIMER = "Decision support, not a diagnosis.";
export const Disclaimer = z.literal(DISCLAIMER);

export const ErrorBody = z.object({
  error: z.object({
    code: z.enum(["invalid_input", "not_found", "not_built", "internal"]),
    message: z.string().min(1),
    issues: z.array(z.unknown()).optional(),
    feature: z.string().optional(),
  }),
});
export type ErrorBody = z.infer<typeof ErrorBody>;

export const HealthResponse = z.object({ ok: z.literal(true) });
