import { z } from "zod";
import { IsoDateTime } from "./common";
import { CrewMember } from "./mission";

/** E01. Demo crew codes are 4 to 8 digits. They are demo access control, not production security. */
export const CrewCode = z.string().regex(/^\d{4,8}$/);

export const SessionInput = z.strictObject({
  crewId: z.string().min(1).max(32),
  code: CrewCode,
});
export type SessionInput = z.infer<typeof SessionInput>;

/** Response of POST /api/session. Send the token as `Authorization: Bearer <token>`. */
export const SessionResponse = z.object({
  token: z.string().min(32),
  crew: CrewMember,
  expiresAt: IsoDateTime,
});
export type SessionResponse = z.infer<typeof SessionResponse>;

/** Response of GET /api/session. */
export const SessionInfo = z.object({
  crew: CrewMember,
  expiresAt: IsoDateTime,
});
export type SessionInfo = z.infer<typeof SessionInfo>;

/** Response of GET /api/crew: who can sign in. Public. */
export const CrewList = z.object({ crew: z.array(CrewMember).min(1) });
export type CrewList = z.infer<typeof CrewList>;
