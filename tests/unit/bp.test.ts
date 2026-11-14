import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  BpInput,
  BpMeasurement,
  Card,
  CardTemplateFile,
  SourceFile,
} from "../../src/schemas";
import {
  averageBpReadings,
  categorizeBp,
  evaluateBp,
  isSustainedHighBp,
  type BpHistoryEntry,
  type CardCatalog,
} from "../../src/core";

function loadCatalog(): CardCatalog {
  const root = process.cwd();
  const cardsRaw = JSON.parse(readFileSync(path.join(root, "content/cards.json"), "utf8"));
  const sourcesRaw = JSON.parse(readFileSync(path.join(root, "content/sources.json"), "utf8"));
  const { templates } = CardTemplateFile.parse(cardsRaw);
  const { sources } = SourceFile.parse(sourcesRaw);
  return { templates, sources };
}

function historyFromSystolics(
  pairs: Array<{ day: number; systolic: number; diastolic: number }>,
): BpHistoryEntry[] {
  return pairs.map(({ day, systolic, diastolic }) => ({
    missionDay: day,
    effectiveDateTime: `2026-08-${String(day).padStart(2, "0")}T08:00:00+00:00`,
    average: { systolic, diastolic },
  }));
}

describe("F06 guided blood pressure measurement, classification, and actions (M4)", () => {
  const catalog = loadCatalog();

  it("averages 1-3 readings half-up and handles optional pulse", () => {
    expect(
      averageBpReadings([
        { systolic: 121, diastolic: 79 },
        { systolic: 118, diastolic: 78 },
      ]),
    ).toEqual({ systolic: 120, diastolic: 79 });

    expect(
      averageBpReadings([
        { systolic: 114, diastolic: 74, pulse: 64 },
        { systolic: 115, diastolic: 75, pulse: 67 },
      ]),
    ).toEqual({ systolic: 115, diastolic: 75, pulse: 66 });
  });

  it("enforces all 13 blood pressure category boundaries", () => {
    expect(categorizeBp({ systolic: 181, diastolic: 80 })).toBe("severe");
    expect(categorizeBp({ systolic: 150, diastolic: 121 })).toBe("severe");

    expect(categorizeBp({ systolic: 180, diastolic: 120 })).toBe("stage2");
    expect(categorizeBp({ systolic: 140, diastolic: 75 })).toBe("stage2");
    expect(categorizeBp({ systolic: 135, diastolic: 90 })).toBe("stage2");

    expect(categorizeBp({ systolic: 89, diastolic: 75 })).toBe("low");
    expect(categorizeBp({ systolic: 100, diastolic: 59 })).toBe("low");

    expect(categorizeBp({ systolic: 139, diastolic: 89 })).toBe("stage1");
    expect(categorizeBp({ systolic: 130, diastolic: 75 })).toBe("stage1");
    expect(categorizeBp({ systolic: 125, diastolic: 80 })).toBe("stage1");

    expect(categorizeBp({ systolic: 129, diastolic: 79 })).toBe("elevated");
    expect(categorizeBp({ systolic: 120, diastolic: 79 })).toBe("elevated");

    expect(categorizeBp({ systolic: 119, diastolic: 79 })).toBe("normal");
    expect(categorizeBp({ systolic: 90, diastolic: 60 })).toBe("normal");
  });

  it("handles severe first reading (5-min retest), retest confirmation, and severe with symptoms", () => {
    const history = historyFromSystolics([
      { day: 1, systolic: 112, diastolic: 72 },
      { day: 4, systolic: 114, diastolic: 74 },
      { day: 7, systolic: 116, diastolic: 75 },
      { day: 10, systolic: 113, diastolic: 73 },
      { day: 13, systolic: 115, diastolic: 74 },
    ]);

    const firstSevere = BpMeasurement.parse(
      evaluateBp(
        {
          takenAt: "2026-08-16T08:00:00+00:00",
          readings: [
            { systolic: 184, diastolic: 118 },
            { systolic: 186, diastolic: 122 },
          ],
          symptoms: [],
        },
        history,
        { catalog, missionDay: 16 },
      ),
    );
    expect(firstSevere.average).toEqual({ systolic: 185, diastolic: 120 });
    expect(firstSevere.category).toBe("severe");
    expect(firstSevere.nextAction).toEqual({ type: "retest", afterSeconds: 300 });
    expect(firstSevere.card.ruleId).toBe("BP-SEVERE-RETEST");
    expect(firstSevere.zone.status.label).toBe("Different from your normal");

    const confirmedSevere = BpMeasurement.parse(
      evaluateBp(
        {
          takenAt: "2026-08-16T08:06:00+00:00",
          readings: [{ systolic: 183, diastolic: 118 }],
          symptoms: [],
          retestOf: firstSevere.id,
        },
        history,
        { catalog, missionDay: 16 },
      ),
    );
    expect(confirmedSevere.nextAction).toEqual({ type: "alert_crew" });
    expect(confirmedSevere.card.ruleId).toBe("BP-SEVERE-CONFIRMED");

    const symptomaticSevere = BpMeasurement.parse(
      evaluateBp(
        {
          takenAt: "2026-08-16T08:00:00+00:00",
          readings: [{ systolic: 185, diastolic: 122 }],
          symptoms: ["chest-pain"],
        },
        history,
        { catalog, missionDay: 16 },
      ),
    );
    expect(symptomaticSevere.nextAction).toEqual({ type: "alert_crew" });
    expect(symptomaticSevere.card.ruleId).toBe("BP-SEVERE-SYMPTOMS");
    expect(symptomaticSevere.card.severity).toBe("urgent");
    Card.parse(symptomaticSevere.card);
  });

  it("handles low BP with and without low symptoms", () => {
    const symptomaticLow = BpMeasurement.parse(
      evaluateBp(
        {
          takenAt: "2026-08-10T08:00:00+00:00",
          readings: [{ systolic: 86, diastolic: 56 }],
          symptoms: ["dizziness-or-lightheadedness"],
        },
        [],
        { catalog, missionDay: 10 },
      ),
    );
    expect(symptomaticLow.category).toBe("low");
    expect(symptomaticLow.nextAction).toEqual({ type: "alert_crew" });
    expect(symptomaticLow.card.ruleId).toBe("BP-LOW-SYMPTOMS");
    expect(symptomaticLow.zone.zone).toBe("building");

    const silentLow = BpMeasurement.parse(
      evaluateBp(
        {
          takenAt: "2026-08-10T08:00:00+00:00",
          readings: [{ systolic: 88, diastolic: 58 }],
          symptoms: [],
        },
        [],
        { catalog, missionDay: 10 },
      ),
    );
    expect(silentLow.nextAction).toEqual({ type: "none" });
    expect(silentLow.card.ruleId).toBe("BP-LOW");
  });

  it("requires 3 distinct mission days >= 140/90 for sustained high BP", () => {
    const threeDaysHistory = historyFromSystolics([
      { day: 1, systolic: 112, diastolic: 72 },
      { day: 4, systolic: 142, diastolic: 86 },
      { day: 7, systolic: 144, diastolic: 88 },
    ]);

    const thirdDay = BpMeasurement.parse(
      evaluateBp(
        {
          takenAt: "2026-08-10T08:00:00+00:00",
          readings: [{ systolic: 146, diastolic: 92 }],
          symptoms: [],
        },
        threeDaysHistory,
        { catalog, missionDay: 10 },
      ),
    );
    expect(thirdDay.card.ruleId).toBe("BP-SUSTAINED-HIGH");
    expect(thirdDay.card.severity).toBe("act");
    expect(thirdDay.nextAction).toEqual({ type: "none" });

    // Three measurements across only two distinct days do NOT trigger sustained high
    const sameDayHistory: BpHistoryEntry[] = [
      { missionDay: 7, effectiveDateTime: "2026-08-07T08:00:00+00:00", average: { systolic: 144, diastolic: 88 } },
      { missionDay: 10, effectiveDateTime: "2026-08-10T07:00:00+00:00", average: { systolic: 145, diastolic: 89 } },
    ];
    expect(
      isSustainedHighBp(
        { missionDay: 10, effectiveDateTime: "2026-08-10T09:00:00+00:00", average: { systolic: 146, diastolic: 91 } },
        sameDayHistory,
      ),
    ).toBe(false);

    const sameDayThird = BpMeasurement.parse(
      evaluateBp(
        {
          takenAt: "2026-08-10T09:00:00+00:00",
          readings: [{ systolic: 146, diastolic: 91 }],
          symptoms: [],
        },
        sameDayHistory,
        { catalog, missionDay: 10 },
      ),
    );
    expect(sameDayThird.card.ruleId).toBe("BP-STAGE2");
  });

  it("flags normal-category BP as off-normal when systolic |z| >= 1.5, and schema rejects bad symptoms", () => {
    // Baseline mean = 112, SD = 2 -> at 115 mmHg, z = +1.5 (normal category, but |z| >= 1.5 -> watch)
    const history = historyFromSystolics([
      { day: 1, systolic: 110, diastolic: 72 },
      { day: 4, systolic: 110, diastolic: 72 },
      { day: 7, systolic: 112, diastolic: 73 },
      { day: 10, systolic: 114, diastolic: 74 },
      { day: 13, systolic: 114, diastolic: 74 },
    ]);

    const shifted = BpMeasurement.parse(
      evaluateBp(
        {
          takenAt: "2026-08-16T08:00:00+00:00",
          readings: [{ systolic: 115, diastolic: 75 }],
          symptoms: [],
        },
        history,
        { catalog, missionDay: 16 },
      ),
    );
    expect(shifted.category).toBe("normal");
    expect(shifted.zone.zone).toBe("watch");
    expect(shifted.zone.status).toEqual({
      level: "watch",
      label: "Different from your normal",
      iconKey: "eye",
    });
    expect(shifted.card.ruleId).toBe("BP-OFF-NORMAL");
    expect(shifted.nextAction).toEqual({ type: "none" });

    // Unknown symptom strings are rejected at schema validation
    const invalidInput = BpInput.safeParse({
      takenAt: "2026-08-16T08:00:00+00:00",
      readings: [{ systolic: 120, diastolic: 80 }],
      symptoms: ["headache"],
    });
    expect(invalidInput.success).toBe(false);
  });
});
