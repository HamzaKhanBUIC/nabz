import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { MissionFile, SubjectFixture } from "../../src/schemas";
import { SIM_CONFIG, type SimConfig } from "./config";
import { generateSubjectFixture } from "./signals";

export type GeneratedFile = {
  filename: string;
  content: string;
};

/**
 * Formats a SubjectFixture deterministically with compact single-line trial objects
 * so the committed fixture bundle stays readable and well below 3 MB, with LF endings.
 */
export function formatSubjectFixture(fixture: SubjectFixture): string {
  const lines: string[] = [];
  lines.push("{");
  lines.push(`  "meta": ${JSON.stringify(fixture.meta, null, 2).replace(/\n/g, "\n  ")},`);
  lines.push(`  "subject": ${JSON.stringify(fixture.subject)},`);
  lines.push(`  "days": [`);
  fixture.days.forEach((day, idx) => {
    const comma = idx < fixture.days.length - 1 ? "," : "";
    lines.push("    {");
    lines.push(`      "missionDay": ${day.missionDay},`);
    lines.push(`      "sleepHours": ${day.sleepHours},`);
    lines.push(`      "restingHr": ${day.restingHr},`);
    if (day.checkin === null) {
      lines.push(`      "checkin": null,`);
    } else {
      lines.push(`      "checkin": {`);
      lines.push(`        "startedAt": ${JSON.stringify(day.checkin.startedAt)},`);
      lines.push(`        "trials": [`);
      day.checkin.trials.forEach((t, tIdx) => {
        const tComma = tIdx < day.checkin!.trials.length - 1 ? "," : "";
        lines.push(`          ${JSON.stringify(t)}${tComma}`);
      });
      lines.push(`        ]`);
      lines.push(`      },`);
    }
    if (day.bp === null) {
      lines.push(`      "bp": null`);
    } else {
      lines.push(`      "bp": ${JSON.stringify(day.bp)}`);
    }
    lines.push(`    }${comma}`);
  });
  lines.push("  ]");
  lines.push("}");
  return lines.join("\n") + "\n";
}

export function generateAllFixtures(config: SimConfig = SIM_CONFIG): GeneratedFile[] {
  const mission = MissionFile.parse(config.mission);
  const files: GeneratedFile[] = [
    {
      filename: "mission.json",
      content: JSON.stringify(mission, null, 2).replace(/\r\n/g, "\n") + "\n",
    },
  ];

  for (const subject of config.subjects) {
    const fixture = SubjectFixture.parse(generateSubjectFixture(subject, config));
    files.push({
      filename: `${subject.id}.json`,
      content: formatSubjectFixture(fixture),
    });
  }

  return files;
}

export function checkFixtures(outDir: string, config: SimConfig = SIM_CONFIG): string[] {
  const expected = generateAllFixtures(config);
  const diffs: string[] = [];
  for (const file of expected) {
    const fullPath = resolve(outDir, file.filename);
    if (!existsSync(fullPath)) {
      diffs.push(`missing: ${file.filename}`);
      continue;
    }
    const onDisk = readFileSync(fullPath, "utf8").replace(/\r\n/g, "\n");
    if (onDisk !== file.content) {
      diffs.push(`differs: ${file.filename}`);
    }
  }
  return diffs;
}

export function writeFixtures(outDir: string, config: SimConfig = SIM_CONFIG): GeneratedFile[] {
  mkdirSync(outDir, { recursive: true });
  const files = generateAllFixtures(config);
  for (const file of files) {
    writeFileSync(resolve(outDir, file.filename), file.content, "utf8");
  }
  return files;
}

function main(): void {
  const outDir = resolve(process.cwd(), "data/fixtures");
  const isCheck = process.argv.includes("--check");

  if (isCheck) {
    const diffs = checkFixtures(outDir);
    if (diffs.length > 0) {
      console.error(`Fixture check FAILED:\n${diffs.join("\n")}`);
      process.exit(1);
    }
    console.log("Fixture check PASS: generated output matches data/fixtures/ byte-for-byte.");
    return;
  }

  const written = writeFixtures(outDir);
  const totalBytes = written.reduce((sum, f) => sum + Buffer.byteLength(f.content, "utf8"), 0);
  console.log(
    `Generated ${written.length} fixture files in data/fixtures/ (${(totalBytes / 1024).toFixed(1)} KB total).`,
  );
}

// Run CLI only when invoked as the main entry script.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("tools/simulate/index.ts")) {
  main();
}
