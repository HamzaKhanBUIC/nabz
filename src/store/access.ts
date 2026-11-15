import { readFileSync } from "node:fs";
import path from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/**
 * E01 crew codes. Only scrypt hashes are stored (`data/crew/access.json`); the demo codes
 * for the synthetic crew are listed in the README. This is demo access control for an
 * offline hackathon build, not production authentication.
 */
const ScryptParams = z.strictObject({
  N: z.number().int().positive(),
  r: z.number().int().positive(),
  p: z.number().int().positive(),
  keyLength: z.number().int().positive(),
});

const AccessEntry = z.strictObject({
  crewId: z.string().min(1),
  salt: z.string().regex(/^[0-9a-f]{32}$/),
  hash: z.string().regex(/^[0-9a-f]+$/),
  params: ScryptParams,
});
export type AccessEntry = z.infer<typeof AccessEntry>;

const AccessFile = z.strictObject({ version: z.literal(1), entries: z.array(AccessEntry) });

export const DEFAULT_SCRYPT = { N: 16384, r: 8, p: 1, keyLength: 32 } as const;

export function hashCode(code: string, salt = randomBytes(16).toString("hex")): Omit<AccessEntry, "crewId"> {
  const key = scryptSync(code, salt, DEFAULT_SCRYPT.keyLength, {
    N: DEFAULT_SCRYPT.N,
    r: DEFAULT_SCRYPT.r,
    p: DEFAULT_SCRYPT.p,
  });
  return { salt, hash: key.toString("hex"), params: { ...DEFAULT_SCRYPT } };
}

export function verifyCode(entry: AccessEntry, code: string): boolean {
  const expected = Buffer.from(entry.hash, "hex");
  const actual = scryptSync(code, entry.salt, entry.params.keyLength, {
    N: entry.params.N,
    r: entry.params.r,
    p: entry.params.p,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Loads and validates the access file. One entry per crew id. */
export function loadCrewAccess(
  filePath: string = path.join(process.cwd(), "data", "crew", "access.json"),
): Map<string, AccessEntry> {
  const parsed = AccessFile.parse(JSON.parse(readFileSync(filePath, "utf8")));
  const byId = new Map<string, AccessEntry>();
  for (const entry of parsed.entries) {
    if (byId.has(entry.crewId)) throw new Error(`Duplicate crew id in access file: ${entry.crewId}`);
    byId.set(entry.crewId, entry);
  }
  return byId;
}
