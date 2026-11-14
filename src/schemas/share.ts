import { z } from "zod";
import { Card } from "./card";
import { Disclaimer, IsoDateTime } from "./common";

export const SharePreviewInput = z.strictObject({
  includeReaction: z.boolean().optional(),
  includeSleep: z.boolean().optional(),
  includeBp: z.boolean().optional(),
  includeCards: z.boolean().optional(),
  days: z.number().int().min(1).max(30).optional(),
  entryIds: z.array(z.string().min(1)).max(50).optional(),
  note: z.string().max(500).optional(),
});
export type SharePreviewInput = z.infer<typeof SharePreviewInput>;

export const ShareSendInput = z.strictObject({
  includeReaction: z.boolean().optional(),
  includeSleep: z.boolean().optional(),
  includeBp: z.boolean().optional(),
  includeCards: z.boolean().optional(),
  days: z.number().int().min(1).max(30).optional(),
  entryIds: z.array(z.string().min(1)).max(50).optional(),
  note: z.string().max(500).optional(),
  confirm: z.literal(true),
});
export type ShareSendInput = z.infer<typeof ShareSendInput>;

export const ShareEntryKind = z.enum(["reaction", "sleep", "bp", "card"]);
export type ShareEntryKind = z.infer<typeof ShareEntryKind>;

export const ShareEntrySummary = z.object({
  id: z.string().min(1),
  kind: ShareEntryKind,
  missionDay: z.number().int().positive(),
  effectiveDateTime: IsoDateTime,
  summary: z.string().min(1),
});
export type ShareEntrySummary = z.infer<typeof ShareEntrySummary>;

export const SharePackagePreview = z.object({
  generatedAt: IsoDateTime,
  missionDay: z.number().int().positive(),
  subjectId: z.string().min(1),
  commsDelay: z.object({
    oneWayMinMinutes: z.number().positive(),
    oneWayMaxMinutes: z.number().positive(),
    nominalMinutes: z.number().positive(),
    delayNotice: z.string().min(1),
  }),
  selection: z.object({
    includeReaction: z.boolean(),
    includeSleep: z.boolean(),
    includeBp: z.boolean(),
    includeCards: z.boolean(),
    days: z.number().int().min(1).max(30),
  }),
  entries: z.array(ShareEntrySummary),
  cards: z.array(Card),
  summaryText: z.string().min(1),
  disclaimer: Disclaimer,
});
export type SharePackagePreview = z.infer<typeof SharePackagePreview>;

export const ShareQueuedPackage = z.object({
  id: z.string().min(1),
  status: z.literal("queued"),
  queuedAt: IsoDateTime,
  confirmedByUser: z.literal(true),
  package: SharePackagePreview,
});
export type ShareQueuedPackage = z.infer<typeof ShareQueuedPackage>;
