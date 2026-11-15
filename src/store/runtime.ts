import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  AccessLogEntry,
  BpMeasurement,
  CheckinResponse,
  ReminderSchedule,
  ShareQueuedPackage,
} from "../schemas";

const RuntimeFileSchema = z.strictObject({
  version: z.literal(1),
  checkins: z.array(CheckinResponse),
  bp: z.array(BpMeasurement),
  reminders: ReminderSchedule.optional(),
  outbox: z.array(ShareQueuedPackage).optional(),
  /** E05: sharing with the Medical Officer (off when missing). */
  consent: z.strictObject({ shareWithMedicalOfficer: z.boolean() }).optional(),
  /** E05: who read this person's summary, newest last. */
  accessLog: z.array(AccessLogEntry).optional(),
});

export type RuntimeData = z.infer<typeof RuntimeFileSchema>;

function emptyRuntime(): RuntimeData {
  return { version: 1, checkins: [], bp: [] };
}

function moveCorruptFile(filePath: string): void {
  const baseCorrupt = `${filePath}.corrupt`;
  const target = existsSync(baseCorrupt) ? `${filePath}.${Date.now()}.corrupt` : baseCorrupt;
  renameSync(filePath, target);
}

/**
 * Loads `<runtimeDir>/<subjectId>.json`. Returns an empty store if missing;
 * if corrupt JSON or invalid shape, preserves the bad file as `*.corrupt`
 * and falls back cleanly.
 */
export function loadRuntimeFile(runtimeDir: string, subjectId: string): RuntimeData {
  const filePath = path.join(runtimeDir, `${subjectId}.json`);
  if (!existsSync(filePath)) {
    return emptyRuntime();
  }

  try {
    const rawText = readFileSync(filePath, "utf8");
    const parsedJson: unknown = JSON.parse(rawText);
    const validated = RuntimeFileSchema.safeParse(parsedJson);
    if (!validated.success) {
      moveCorruptFile(filePath);
      return emptyRuntime();
    }
    return validated.data;
  } catch {
    if (existsSync(filePath)) {
      moveCorruptFile(filePath);
    }
    return emptyRuntime();
  }
}

/** Atomically writes runtime data via a `.tmp` sibling and rename. */
export function saveRuntimeFile(runtimeDir: string, subjectId: string, data: RuntimeData): void {
  mkdirSync(runtimeDir, { recursive: true });
  const targetPath = path.join(runtimeDir, `${subjectId}.json`);
  const tempPath = `${targetPath}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  renameSync(tempPath, targetPath);
}
