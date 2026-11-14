import { z } from "zod";
import { Disclaimer, SourceRef } from "./common";

/** Who the procedure is for. Must ships "self" only; "crewmate" is reserved for a later feature. */
export const ProcedureFor = z.enum(["self", "crewmate"]);
export type ProcedureFor = z.infer<typeof ProcedureFor>;

export const ProcedureStep = z.strictObject({
  id: z.string().min(1),
  /** One action, short enough to read at a glance. */
  text: z.string().min(1),
  detail: z.string().optional(),
  timerSeconds: z.number().int().positive().optional(),
  caution: z.string().optional(),
});
export type ProcedureStep = z.infer<typeof ProcedureStep>;

const base = {
  id: z.string().min(1),
  version: z.number().int().positive(),
  for: ProcedureFor,
  title: z.string().min(1),
  whenToUse: z.string().min(1),
  steps: z.array(ProcedureStep).min(1),
  redFlags: z.array(z.string().min(1)).min(1),
  escalation: z.strictObject({ text: z.string().min(1), action: z.literal("alert_crew") }),
  disclaimer: Disclaimer,
};

/** What the API serves. */
export const Procedure = z.object({ ...base, sources: z.array(SourceRef).min(1) });
export type Procedure = z.infer<typeof Procedure>;

/** content/emergency/<id>.json */
export const ProcedureFile = z.strictObject({ ...base, sourceIds: z.array(z.string().min(1)).min(1) });
export type ProcedureFile = z.infer<typeof ProcedureFile>;

/** Response of GET /api/emergency/procedures. One bundle so the frontend can keep a copy. */
export const ProcedureBundle = z.object({
  version: z.number().int().positive(),
  procedures: z.array(Procedure),
});
export type ProcedureBundle = z.infer<typeof ProcedureBundle>;

export const ProcedureQuery = z.strictObject({ for: ProcedureFor.default("self") });
