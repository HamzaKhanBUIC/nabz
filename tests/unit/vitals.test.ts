import { describe, expect, it } from "vitest";
import { assessHeartRate, assessSpo2, assessVitals } from "../../src/core";
import path from "node:path";
import { loadContentBundle } from "../../src/store/content";

const { catalog } = loadContentBundle(path.join(process.cwd(), "content"));
const sources = catalog.sources;

describe("E07 heart rate (research/CHECKS.md R12)", () => {
  it.each([
    [59, "watch", "Below the usual resting range"],
    [60, "in_zone", "Usual resting range"],
    [100, "in_zone", "Usual resting range"],
    [101, "watch", "Above the usual resting range"],
  ])("%i bpm -> %s", (bpm, level, label) => {
    const r = assessHeartRate(bpm, sources);
    expect(r.status.level).toBe(level);
    expect(r.status.label).toBe(label);
    expect(r.unit).toBe("bpm");
    expect(r.sources.map((s) => s.id)).toEqual(["medlineplus-pulse", "nhlbi-heart-beats"]);
  });

  it("never reaches act or urgent: no source gives an urgent heart rate number", () => {
    for (const bpm of [20, 35, 140, 250]) {
      expect(["act", "urgent"]).not.toContain(assessHeartRate(bpm, sources).status.level);
    }
  });
});

describe("E07 SpO2 (research/CHECKS.md R12)", () => {
  it.each([
    [100, "in_zone", "check"],
    [95, "in_zone", "check"],
    [94, "watch", "eye"],
    [93, "watch", "eye"],
    [92, "act", "alert"],
    [89, "act", "alert"],
    [88, "urgent", "siren"],
    [70, "urgent", "siren"],
  ])("%i%% -> %s", (percent, level, iconKey) => {
    const r = assessSpo2(percent, sources);
    expect(r.status.level).toBe(level);
    expect(r.status.iconKey).toBe(iconKey);
    expect(r.status.label.length).toBeGreaterThan(0);
    expect(r.sources.map((s) => s.id)).toEqual(["medlineplus-pulse-oximetry", "fda-pulse-oximeter-basics"]);
  });
});

describe("assessVitals", () => {
  it("returns only what was measured", () => {
    expect(assessVitals(undefined, undefined, sources)).toEqual([]);
    expect(assessVitals(72, undefined, sources).map((v) => v.code)).toEqual(["heart-rate"]);
    expect(assessVitals(undefined, 97, sources).map((v) => v.code)).toEqual(["spo2"]);
    expect(assessVitals(72, 97, sources).map((v) => v.code)).toEqual(["heart-rate", "spo2"]);
  });

  it("fails loudly when a source is missing from content", () => {
    expect(() => assessSpo2(97, [])).toThrow(/Missing E07 source/);
  });
});
