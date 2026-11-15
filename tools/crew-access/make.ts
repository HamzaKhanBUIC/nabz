/**
 * Writes data/crew/access.json: one scrypt hash per crew member. Plain codes are never stored.
 * Usage: npx tsx tools/crew-access/make.ts sara=4120 mateo=7316 elena=2468 kenji=9053
 * The demo codes for the synthetic crew are listed in README.md ("Demo crew codes").
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { hashCode } from "../../src/store/access";
import { CrewCode } from "../../src/schemas";

const pairs = process.argv.slice(2).map((arg) => {
  const [crewId, code] = arg.split("=");
  if (!crewId || !code || !CrewCode.safeParse(code).success) {
    throw new Error(`Expected crewId=code with a 4-8 digit code, got "${arg}".`);
  }
  return { crewId, code };
});
if (pairs.length === 0) throw new Error("Give at least one crewId=code pair.");

const entries = pairs.map(({ crewId, code }) => ({ crewId, ...hashCode(code) }));
const outDir = path.join(process.cwd(), "data", "crew");
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "access.json"), JSON.stringify({ version: 1, entries }, null, 2) + "\n");
console.log(`wrote ${entries.length} entries to data/crew/access.json`);
