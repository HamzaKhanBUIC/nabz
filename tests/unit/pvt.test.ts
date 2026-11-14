import { describe, expect, it } from "vitest";
import { Protocol, PvtMetrics, type Trial } from "../../src/schemas";
import { getProtocol, scorePvt } from "../../src/core/pvt";
import { checkSession } from "../../src/core/qc";

function makeValidTrials(
  count: number,
  options: { isiMs?: number; rtMs?: number | null } = {},
): Trial[] {
  const isiMs = options.isiMs ?? 2500;
  const rtMs = options.rtMs === undefined ? 250 : options.rtMs;
  return Array.from({ length: count }, (_, i) => ({
    i,
    isiMs,
    rtMs,
    early: false,
  }));
}

describe("F03 PVT-B scoring (M1)", () => {
  it("exposes the canonical 3-minute PVT-B protocol", () => {
    const protocol = Protocol.parse(getProtocol());
    expect(protocol).toEqual({
      protocolId: "pvt-b-3min",
      durationMs: 180_000,
      isiMinMs: 1_000,
      isiMaxMs: 4_000,
      feedbackMs: 1_000,
      lapseMs: 355,
      falseStartMs: 100,
      noResponseTimeoutMs: 30_000,
    });
  });

  it("matches the hand-computed M1 reference session exactly", () => {
    const trials: Trial[] = [
      { i: 0, isiMs: 1500, rtMs: null, early: true },
      { i: 1, isiMs: 2000, rtMs: 200, early: false },
      { i: 2, isiMs: 2200, rtMs: 250, early: false },
      { i: 3, isiMs: 1800, rtMs: 250, early: false },
      { i: 4, isiMs: 2500, rtMs: 300, early: false },
      { i: 5, isiMs: 3000, rtMs: 400, early: false },
      { i: 6, isiMs: 2000, rtMs: null, early: false },
      { i: 7, isiMs: 1900, rtMs: 90, early: false },
      { i: 8, isiMs: 2100, rtMs: 240, early: false },
    ];

    const metrics = PvtMetrics.parse(scorePvt(trials));
    expect(metrics).toEqual({
      stimuli: 7,
      validResponses: 6,
      lapses: 2,
      falseStarts: 2,
      meanSpeed: 3.2905,
      medianRtMs: 250,
      performanceScore: 55.56,
    });
  });

  it("enforces exact lapse (354 vs 355) and false-start (99 vs 100) boundaries", () => {
    const boundaryTrials: Trial[] = [
      { i: 0, isiMs: 2000, rtMs: 99, early: false }, // false start
      { i: 1, isiMs: 2000, rtMs: 100, early: false }, // valid stimulus, not false start
      { i: 2, isiMs: 2000, rtMs: 354, early: false }, // not a lapse
      { i: 3, isiMs: 2000, rtMs: 355, early: false }, // lapse
    ];

    const metrics = scorePvt(boundaryTrials);
    expect(metrics.falseStarts).toBe(1);
    expect(metrics.stimuli).toBe(3);
    expect(metrics.validResponses).toBe(3);
    expect(metrics.lapses).toBe(1);
    expect(metrics.medianRtMs).toBe(354);
    expect(metrics.performanceScore).toBe(50);
  });

  it("handles empty, all-early, and all-timeout edge cases without dividing by zero", () => {
    expect(PvtMetrics.parse(scorePvt([]))).toEqual({
      stimuli: 0,
      validResponses: 0,
      lapses: 0,
      falseStarts: 0,
      meanSpeed: 0,
      medianRtMs: null,
      performanceScore: 0,
    });

    const allEarly: Trial[] = [
      { i: 0, isiMs: 1500, rtMs: null, early: true },
      { i: 1, isiMs: 1800, rtMs: null, early: true },
    ];
    expect(PvtMetrics.parse(scorePvt(allEarly))).toEqual({
      stimuli: 0,
      validResponses: 0,
      lapses: 0,
      falseStarts: 2,
      meanSpeed: 0,
      medianRtMs: null,
      performanceScore: 0,
    });

    const allTimeout: Trial[] = [
      { i: 0, isiMs: 2000, rtMs: null, early: false },
      { i: 1, isiMs: 2000, rtMs: null, early: false },
    ];
    expect(PvtMetrics.parse(scorePvt(allTimeout))).toEqual({
      stimuli: 2,
      validResponses: 0,
      lapses: 2,
      falseStarts: 0,
      meanSpeed: 0.0333,
      medianRtMs: null,
      performanceScore: 0,
    });
  });

  it("returns no flags for a clean 3-minute session and flags every broken boundary", () => {
    // 65 trials * (2500 + 250) = 178,750 ms (inside 150,000..210,000 ms)
    const clean = makeValidTrials(65, { isiMs: 2500, rtMs: 250 });
    expect(checkSession(clean)).toEqual([]);
    expect(checkSession({ trials: clean })).toEqual([]);

    // Too few stimuli: 19 valid stimuli with long enough total duration (via timeout)
    const nineteenStim = [
      ...makeValidTrials(14, { isiMs: 2500, rtMs: 250 }), // 38,500 ms
      ...makeValidTrials(5, { isiMs: 2500, rtMs: null }), // 5 * 32,500 = 162,500 ms (total 201,000)
    ];
    expect(checkSession(nineteenStim)).toEqual(["too_few_stimuli"]);

    // 20 stimuli passes stimulus count check (5 * 32,500 + 15 * 2,500? Keep sum ~180,000)
    const twentyStim = [
      ...makeValidTrials(16, { isiMs: 2500, rtMs: 250 }), // 44,000 ms
      ...makeValidTrials(4, { isiMs: 2500, rtMs: null }), // 130,000 ms (total 174,000)
    ];
    expect(checkSession(twentyStim)).toEqual([]);

    // Duration below 150,000 and above 210,000
    const tooShort = makeValidTrials(50, { isiMs: 2500, rtMs: 250 }); // 137,500 ms
    expect(checkSession(tooShort)).toEqual(["duration_out_of_range"]);

    const tooLong = makeValidTrials(78, { isiMs: 2500, rtMs: 250 }); // 214,500 ms
    expect(checkSession(tooLong)).toEqual(["duration_out_of_range"]);

    // ISI tolerance: 950..4050 allowed; 949 or 4051 flagged
    const toleranceOk = [
      ...makeValidTrials(60, { isiMs: 2500, rtMs: 250 }),
      { i: 60, isiMs: 950, rtMs: 250, early: false },
      { i: 61, isiMs: 4050, rtMs: 250, early: false },
    ]; // 60*2750 + 1200 + 4300 = 170,500 ms
    expect(checkSession(toleranceOk)).toEqual([]);

    const isiLowBad = [
      ...makeValidTrials(64, { isiMs: 2500, rtMs: 250 }),
      { i: 64, isiMs: 949, rtMs: 250, early: false },
    ];
    expect(checkSession(isiLowBad)).toEqual(["isi_out_of_range"]);

    const isiHighBad = [
      ...makeValidTrials(64, { isiMs: 2500, rtMs: 250 }),
      { i: 64, isiMs: 4051, rtMs: 250, early: false },
    ];
    expect(checkSession(isiHighBad)).toEqual(["isi_out_of_range"]);

    // Implausibly fast: median RT 119 -> flagged; 120 -> accepted
    const fastOk = makeValidTrials(65, { isiMs: 2500, rtMs: 120 }); // 65 * 2620 = 170,300
    expect(checkSession(fastOk)).toEqual([]);

    const fastBad = makeValidTrials(65, { isiMs: 2500, rtMs: 119 }); // 65 * 2619 = 170,235
    expect(checkSession(fastBad)).toEqual(["implausibly_fast"]);
  });
});
