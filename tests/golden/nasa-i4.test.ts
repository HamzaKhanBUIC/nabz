import { describe, expect, it } from "vitest";
import { Trend } from "../../src/schemas";
import { buildNasaBloodTrend, loadNasaOsd569Samples } from "../../src/store";

describe("F10 real NASA Inspiration4 OSD-569 blood counts (D1)", () => {
  it("parses all 4 subjects x 7 chronological timepoints from the unmodified CSV", () => {
    const samples = loadNasaOsd569Samples();
    expect(samples.length).toBe(28);

    const bySubject = new Map<string, string[]>();
    for (const sample of samples) {
      const list = bySubject.get(sample.subjectId) ?? [];
      list.push(sample.timepoint);
      bySubject.set(sample.subjectId, list);
    }

    expect([...bySubject.keys()].sort()).toEqual(["C001", "C002", "C003", "C004"]);
    for (const timepoints of bySubject.values()) {
      expect(timepoints).toEqual(["L-92", "L-44", "L-3", "R+1", "R+45", "R+82", "R+194"]);
    }
  });

  it("calibrates baseline from 3 pre-launch samples and flags C002 R+82 hematocrit below reference range", () => {
    const samples = loadNasaOsd569Samples();
    const trend = Trend.parse(buildNasaBloodTrend(samples, "C002", "hematocrit"));

    expect(trend.subjectId).toBe("C002");
    expect(trend.code).toBe("hematocrit");
    expect(trend.unit).toBe("%");
    expect(trend.source).toBe("nasa-osd-569");
    expect(trend.referenceRange).toEqual({ low: 35, high: 45 });
    expect(trend.points.length).toBe(7);

    // Pre-launch points L-92, L-44, L-3 build the 3-session baseline
    expect(trend.points.slice(0, 3).map((p) => p.zone)).toEqual([
      "building",
      "building",
      "building",
    ]);
    // Post-return R+1 onward is calibrated against the personal baseline
    expect(trend.points[3]!.missionDay).toBe(1);
    expect(trend.points[3]!.baselineMean).not.toBeNull();
    expect(trend.band.ready).toBe(true);

    // Known out-of-range value: C002 hematocrit at R+82 is 34.7 (below 35..45)
    const r82 = trend.points.find((p) => p.missionDay === 82);
    expect(r82).toBeDefined();
    expect(r82!.value).toBe(34.7);
    expect(r82!.value).toBeLessThan(trend.referenceRange!.low);
  });
});
