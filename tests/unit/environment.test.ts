import { describe, expect, it } from "vitest";
import { estimateDose, pickEscalation, withEscalation } from "../../src/core";
import type { Card } from "../../src/schemas";

describe("E04 estimateDose", () => {
  it("matches hand-computed doses for Mars transit and ISS on day 120", () => {
    // 1.58 mSv/day x 120 = 189.6 mSv; 189.6 / 600 = 31.6 %; (600 - 189.6) / 1.58 = 259.7 -> 259 days
    expect(estimateDose("mars-transit", 120)).toEqual({
      dailyRateMsv: 1.58,
      doseToDateMsv: 189.6,
      percentOfCareerLimit: 31.6,
      daysUntilLimit: 259,
      status: { level: "info", label: "Under the career limit", iconKey: "info" },
    });
    // 0.68 x 120 = 81.6 mSv; 81.6 / 600 = 13.6 %; (600 - 81.6) / 0.68 = 762.4 -> 762 days
    const iss = estimateDose("iss", 120);
    expect(iss.doseToDateMsv).toBe(81.6);
    expect(iss.percentOfCareerLimit).toBe(13.6);
    expect(iss.daysUntilLimit).toBe(762);
  });

  it("flags the career limit once the dose reaches 600 mSv", () => {
    // 1.58 x 379 = 598.82 (under); 1.58 x 380 = 600.4 (over)
    const under = estimateDose("mars-transit", 379);
    expect(under.status.level).toBe("info");
    expect(under.daysUntilLimit).toBe(0); // (600 - 598.82) / 1.58 = 0.75 -> 0 whole days
    const over = estimateDose("mars-transit", 380);
    expect(over.doseToDateMsv).toBe(600.4);
    expect(over.status).toEqual({ level: "act", label: "At or over the career limit", iconKey: "alert" });
    expect(over.daysUntilLimit).toBe(0);
  });

  it("says 'not tracked' when the environment has no verified rate", () => {
    const none = estimateDose(null, 120);
    expect(none.doseToDateMsv).toBeNull();
    expect(none.dailyRateMsv).toBeNull();
    expect(none.status.label).toBe("Not tracked here");
  });
});

describe("E06 escalation never changes the decision", () => {
  const env = { escalation: "Alert the station doctor now." };
  const card = (severity: Card["severity"]) =>
    ({ id: "x", ruleId: "R", severity, status: { level: severity, label: "L", iconKey: "info" } }) as unknown as Card;

  it("shows the line only on act and urgent cards", () => {
    expect(pickEscalation(card("act"), env)).toBe(env.escalation);
    expect(pickEscalation(card("urgent"), env)).toBe(env.escalation);
    for (const s of ["info", "in_zone", "watch"] as const) expect(pickEscalation(card(s), env)).toBeNull();
  });

  it("keeps every other field and drops a stale line", () => {
    const before = { ...card("watch"), escalation: "old" };
    const after = withEscalation(before, env);
    expect(after).toEqual(card("watch"));
    const act = withEscalation(card("act"), env);
    expect({ ...act, escalation: undefined }).toEqual({ ...card("act"), escalation: undefined });
  });
});
