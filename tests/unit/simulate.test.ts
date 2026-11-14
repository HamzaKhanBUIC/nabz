import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MissionFile, SubjectFixture, type Trial } from "../../src/schemas";
import { SIM_CONFIG } from "../../tools/simulate/config";
import { checkFixtures, generateAllFixtures } from "../../tools/simulate/index";

const FIXTURES_DIR = resolve(process.cwd(), "data/fixtures");

function scoreTrialsLocal(trials: readonly Trial[]): { meanSpeed: number; lapses: number } {
  const stim = trials.filter((t) => !t.early && (t.rtMs === null || t.rtMs >= 100));
  const sumSpeed = stim.reduce((acc, t) => acc + 1000 / (t.rtMs ?? 30_000), 0);
  const lapses = stim.filter((t) => t.rtMs === null || t.rtMs >= 355).length;
  return {
    meanSpeed: stim.length === 0 ? 0 : sumSpeed / stim.length,
    lapses,
  };
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function mean(values: readonly number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sampleSd(values: readonly number[]): number {
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

describe("F02 seeded data simulator", () => {
  it("writes schema-valid mission.json and 4 subject fixture files under 3 MB", () => {
    const missionPath = resolve(FIXTURES_DIR, "mission.json");
    expect(existsSync(missionPath)).toBe(true);
    const mission = MissionFile.parse(JSON.parse(readFileSync(missionPath, "utf8")));
    expect(mission.crew).toHaveLength(4);
    expect(mission.crew[0]?.id).toBe("sara");

    let totalBytes = statSync(missionPath).size;
    for (const member of mission.crew) {
      const subjectPath = resolve(FIXTURES_DIR, `${member.id}.json`);
      expect(existsSync(subjectPath)).toBe(true);
      totalBytes += statSync(subjectPath).size;
      const parsed = SubjectFixture.parse(JSON.parse(readFileSync(subjectPath, "utf8")));
      expect(parsed.days).toHaveLength(120);
      expect(parsed.subject.id).toBe(member.id);
    }

    expect(totalBytes).toBeLessThan(3 * 1024 * 1024);
  });

  it("is deterministic for the same seed, matches disk byte-for-byte, and varies with a different seed", () => {
    const run1 = generateAllFixtures(SIM_CONFIG);
    const run2 = generateAllFixtures(SIM_CONFIG);
    expect(run1).toEqual(run2);
    expect(checkFixtures(FIXTURES_DIR, SIM_CONFIG)).toEqual([]);

    const other = generateAllFixtures({ ...SIM_CONFIG, seed: SIM_CONFIG.seed + 1 });
    expect(other[1]?.content).not.toBe(run1[1]?.content);
  });

  it("keeps rested-period means inside CHECKS.md anchor ranges and respects cadences", () => {
    for (const member of SIM_CONFIG.subjects) {
      const fixture = SubjectFixture.parse(
        JSON.parse(readFileSync(resolve(FIXTURES_DIR, `${member.id}.json`), "utf8")),
      );

      // Sleep mean anchored around Barger 2014 (6.09 +- 0.67 h)
      const allSleep = fixture.days.map((d) => d.sleepHours);
      const sleepMean = mean(allSleep);
      expect(sleepMean).toBeGreaterThanOrEqual(5.4);
      expect(sleepMean).toBeLessThanOrEqual(6.8);

      // Rested reaction speed (first 30 days, before events) ~ 4.1-4.3 1/s, median 1 lapse (R2 #11)
      const earlyCheckins = fixture.days
        .filter((d) => d.missionDay <= 30 && d.checkin !== null)
        .map((d) => scoreTrialsLocal(d.checkin!.trials));
      const restedSpeed = mean(earlyCheckins.map((c) => c.meanSpeed));
      expect(restedSpeed).toBeGreaterThanOrEqual(4.05);
      expect(restedSpeed).toBeLessThanOrEqual(4.35);
      expect(median(earlyCheckins.map((c) => c.lapses))).toBeLessThanOrEqual(2);

      // Every check-in respects PVT-B ISI 1000-4000 ms and total duration ~150-210 s
      const missedCount = fixture.days.filter((d) => d.checkin === null).length;
      expect(missedCount).toBeGreaterThanOrEqual(1);
      expect(missedCount).toBeLessThanOrEqual(12);

      for (const day of fixture.days) {
        if (!day.checkin) continue;
        let totalMs = 0;
        for (const t of day.checkin.trials) {
          expect(t.isiMs).toBeGreaterThanOrEqual(1000);
          expect(t.isiMs).toBeLessThanOrEqual(4000);
          totalMs += t.isiMs + (t.early ? 0 : (t.rtMs ?? 30_000));
        }
        expect(totalMs).toBeGreaterThanOrEqual(150_000);
        expect(totalMs).toBeLessThanOrEqual(210_000);
      }

      // BP every 3rd day with 2 readings, drifting down over first 30 days (Norsk 2015 #7)
      const bpDays = fixture.days.filter((d) => d.bp !== null);
      expect(bpDays).toHaveLength(40);
      for (const d of bpDays) {
        expect(d.bp!.readings).toHaveLength(2);
      }
      const earlySbp = mean(bpDays.slice(0, 2).flatMap((d) => d.bp!.readings.map((r) => r.systolic)));
      const lateSbp = mean(bpDays.filter((d) => d.missionDay >= 40).flatMap((d) => d.bp!.readings.map((r) => r.systolic)));
      expect(earlySbp - lateSbp).toBeGreaterThan(3);

      // Resting HR anchored to Quer 2020 (65.5 +- 7.7 bpm)
      const restedHr = mean(fixture.days.filter((d) => d.missionDay <= 30).map((d) => d.restingHr));
      expect(restedHr).toBeGreaterThanOrEqual(55);
      expect(restedHr).toBeLessThanOrEqual(76);
    }
  });

  it("records all injected events as ground truth and produces Sara's hero day 120 and events", () => {
    const sara = SubjectFixture.parse(
      JSON.parse(readFileSync(resolve(FIXTURES_DIR, "sara.json"), "utf8")),
    );
    const eventIds = sara.meta.events.map((e) => e.id);
    expect(eventIds).toEqual(["short-sleep-week", "illness", "high-workload", "short-sleep-before-120"]);

    // Verify illness raises Sara's resting HR around peak day 66
    const baselineHr = mean(sara.days.filter((d) => d.missionDay >= 45 && d.missionDay <= 58).map((d) => d.restingHr));
    const peakHr = sara.days.find((d) => d.missionDay === 66)!.restingHr;
    expect(peakHr - baselineHr).toBeGreaterThanOrEqual(4);

    // Fold Sara's reaction speed with M2 rules to confirm short-sleep-week peak is act,
    // day 119 is watch, and day 120 is act (not 3rd consecutive act).
    const window: number[] = [];
    const results = new Map<number, { zone: string; z: number | null; sleepHours: number }>();

    for (const day of sara.days) {
      if (!day.checkin) continue;
      const { meanSpeed } = scoreTrialsLocal(day.checkin.trials);
      let zone = "building";
      let z: number | null = null;
      if (window.length >= 5) {
        const m = mean(window);
        const sd = sampleSd(window);
        if (sd > 0) {
          z = (meanSpeed - m) / sd;
          zone = z <= -1.5 ? "act" : z <= -1.0 ? "watch" : "in_zone";
        }
      }
      results.set(day.missionDay, { zone, z, sleepHours: day.sleepHours });
      if (zone !== "act") {
        window.push(meanSpeed);
        if (window.length > 14) window.shift();
      }
    }

    // Peak of short-sleep-week (days 39-41) hits act
    const shortSleepZones = [39, 40, 41].map((d) => results.get(d)?.zone);
    expect(shortSleepZones).toContain("act");

    // Day 119: sleep < 6 h and watch (so day 120 is not RT-PERSISTENT)
    const day119 = results.get(119)!;
    expect(day119.sleepHours).toBeLessThan(6);
    expect(day119.zone).toBe("watch");

    // Day 120: sleep < 6 h and act (z <= -1.5)
    const day120 = results.get(120)!;
    expect(day120.sleepHours).toBeLessThan(6);
    expect(day120.zone).toBe("act");
    expect(day120.z!).toBeLessThanOrEqual(-1.5);
  });
});
