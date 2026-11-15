import { describe, expect, it } from "vitest";
import { Trend } from "../../src/schemas";
import { classifyZone } from "../../src/core/zone";
import { buildTrend, foldHistory, type BaselineEntryInput } from "../../src/core/baseline";

function entry(day: number, value: number, qcFlags: string[] = []): BaselineEntryInput {
  const padded = String(day).padStart(2, "0");
  return {
    missionDay: day,
    effectiveDateTime: `2026-07-${padded}T08:00:00+00:00`,
    value,
    qcFlags,
  };
}

describe("F04 personal baseline, zone classification, and trend builder (M2)", () => {
  it("stays in building for the first 4 entries and calibrates on the 5th", () => {
    const entries = [
      entry(1, 4.0),
      entry(2, 4.1),
      entry(3, 4.2),
      entry(4, 4.3),
      entry(5, 4.4),
      entry(6, 4.2),
    ];

    const scored = foldHistory(entries);
    expect(scored.slice(0, 5).map((s) => s.zone)).toEqual([
      "building",
      "building",
      "building",
      "building",
      "building",
    ]);
    expect(scored.slice(0, 5).every((s) => s.z === null && !s.baseline.ready)).toBe(true);
    expect(scored.slice(0, 5).every((s) => s.status.label === "Learning your normal" && s.status.iconKey === "hourglass")).toBe(true);

    const sixth = scored[5]!;
    expect(sixth.baseline.ready).toBe(true);
    expect(sixth.baseline.n).toBe(5);
    expect(sixth.baseline.mean).toBe(4.2);
    expect(sixth.baseline.sd).toBeCloseTo(0.1581, 4);
    expect(sixth.z).toBe(0);
    expect(sixth.zone).toBe("in_zone");
    expect(sixth.status).toEqual({ level: "in_zone", label: "Within your normal", iconKey: "check" });
  });

  it("matches all four hand-computed M2 test points from [4.0, 4.1, 4.2, 4.3, 4.4]", () => {
    const base = [entry(1, 4.0), entry(2, 4.1), entry(3, 4.2), entry(4, 4.3), entry(5, 4.4)];

    const testCases: Array<{ value: number; expectedZone: "act" | "watch" | "in_zone"; expectedZ: number }> = [
      { value: 3.9628, expectedZone: "act", expectedZ: -1.5002 },
      { value: 3.97, expectedZone: "watch", expectedZ: -1.4546 },
      { value: 4.0418, expectedZone: "watch", expectedZ: -1.0005 },
      { value: 4.05, expectedZone: "in_zone", expectedZ: -0.9487 },
    ];

    for (const tc of testCases) {
      const scored = foldHistory([...base, entry(6, tc.value)]);
      const last = scored[5]!;
      expect(last.zone).toBe(tc.expectedZone);
      expect(last.z).toBe(tc.expectedZ);
    }
  });

  it("enforces exact z-score boundaries (-1.5 vs -1.49 and -1.0 vs -0.99)", () => {
    expect(classifyZone(-1.5, { direction: "lower_is_worse", ready: true })).toBe("act");
    expect(classifyZone(-1.49, { direction: "lower_is_worse", ready: true })).toBe("watch");
    expect(classifyZone(-1.0, { direction: "lower_is_worse", ready: true })).toBe("watch");
    expect(classifyZone(-0.99, { direction: "lower_is_worse", ready: true })).toBe("in_zone");

    // Exact dyadic rationals in IEEE-754: mean = 4.0, sample SD = 0.5 -> z = -1.5 at 3.25, -1.0 at 3.5
    const seed = [
      entry(1, 3.5),
      entry(2, 3.5),
      entry(3, 4.0),
      entry(4, 4.5),
      entry(5, 4.5),
    ];
    expect(foldHistory([...seed, entry(6, 3.25)])[5]!.zone).toBe("act");
    expect(foldHistory([...seed, entry(6, 3.255)])[5]!.zone).toBe("watch");
    expect(foldHistory([...seed, entry(6, 3.5)])[5]!.zone).toBe("watch");
    expect(foldHistory([...seed, entry(6, 3.505)])[5]!.zone).toBe("in_zone");
  });

  it("excludes flagged and caller-excluded entries, and never excludes an entry for its own zone", () => {
    const seed = [
      entry(1, 3.8),
      entry(2, 3.8),
      entry(3, 4.0),
      entry(4, 4.2),
      entry(5, 4.2),
    ];
    const entries: BaselineEntryInput[] = [
      ...seed,
      entry(6, 3.5, ["duration_out_of_range"]), // flagged: not_scored, excluded from window
      entry(7, 3.5), // act (z = -2.5): valid session stays in one-sided window
      entry(8, 4.0), // sees n = 6, mean = 23.5 / 6 = 3.9167 (no upward ratchet)
    ];

    const scored = foldHistory(entries);
    expect(scored[5]!.zone).toBe("not_scored");
    expect(scored[5]!.z).toBeNull();
    expect(scored[5]!.status).toEqual({ level: "info", label: "Not scored", iconKey: "info" });

    expect(scored[6]!.zone).toBe("act");
    expect(scored[6]!.z).toBe(-2.5);

    expect(scored[7]!.baseline.n).toBe(6);
    expect(scored[7]!.baseline.mean).toBeCloseTo(3.9167, 4);
    expect(scored[7]!.zone).toBe("in_zone");

    // Two-sided (blood pressure). A reading the caller marks as abnormal by an absolute
    // threshold is scored but stays out of later windows.
    const bpSeed = [entry(1, 116), entry(2, 118), entry(3, 120), entry(4, 120), entry(5, 121)];
    const withSevere = foldHistory(
      [...bpSeed, { ...entry(6, 186), excludeFromBaseline: true }, entry(7, 119)],
      { direction: "two_sided" },
    );
    expect(withSevere[5]!.zone).toBe("watch");
    expect(withSevere[6]!.baseline.n).toBe(5);
    expect(withSevere[6]!.baseline.mean).toBe(119);
    expect(withSevere[6]!.baseline.sd).toBe(2);
    expect(withSevere[6]!.zone).toBe("in_zone");

    // An ordinary reading that merely lands in `watch` (123 is z = +2.0) stays in the
    // window. Leaving it out would trim the tails and shrink the SD over time.
    const withWatch = foldHistory([...bpSeed, entry(6, 123), entry(7, 119)], { direction: "two_sided" });
    expect(withWatch[5]!.zone).toBe("watch");
    expect(withWatch[5]!.z).toBe(2);
    expect(withWatch[6]!.baseline.n).toBe(6);
    expect(withWatch[6]!.baseline.mean).toBeCloseTo(119.6667, 4);
  });

  it("stays in building when all baseline values are equal (sd === 0)", () => {
    const equalEntries = [
      entry(1, 4.2),
      entry(2, 4.2),
      entry(3, 4.2),
      entry(4, 4.2),
      entry(5, 4.2),
      entry(6, 3.8),
    ];

    const scored = foldHistory(equalEntries);
    expect(scored[5]!.baseline.ready).toBe(false);
    expect(scored[5]!.baseline.mean).toBeNull();
    expect(scored[5]!.zone).toBe("building");
    expect(scored[5]!.z).toBeNull();
  });

  it("caps rolling window at 14 sessions and skips missing mission days cleanly", () => {
    // 14 baseline entries (mean 4.0) followed by day 20 (skipping days 15..19)
    // Wait: insert day 1 as an outlier 5.0 (will fall off when window > 14), then 14 entries of 3.8/4.2 (mean 4.0)
    const entries: BaselineEntryInput[] = [
      entry(1, 5.0),
      ...Array.from({ length: 14 }, (_, idx) => entry(idx + 2, idx % 2 === 0 ? 3.8 : 4.2)),
      entry(20, 4.0), // gap after day 15
    ];

    const scored = foldHistory(entries);
    const last = scored[scored.length - 1]!;
    expect(last.baseline.n).toBe(14);
    expect(last.baseline.mean).toBe(4.0);
    expect(last.baseline.ready).toBe(true);

    const trend = Trend.parse(buildTrend("reaction-speed", scored, 7));
    // cutoff day = 20 - 7 + 1 = 14 -> days 14, 15, 20
    expect(trend.points.map((p) => p.missionDay)).toEqual([14, 15, 20]);
    expect(trend.band.ready).toBe(true);
    expect(trend.band.mean).toBe(last.baseline.mean);
    expect(trend.band.sd).toBe(last.baseline.sd);
    expect(trend.band.watchAt).toBeCloseTo(last.baseline.mean! - last.baseline.sd!, 4);
    expect(trend.band.actAt).toBeCloseTo(last.baseline.mean! - 1.5 * last.baseline.sd!, 4);
  });
});
