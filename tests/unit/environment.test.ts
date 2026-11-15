import { describe, expect, it } from "vitest";
import { pickEscalation, withEscalation } from "../../src/core";
import type { Card } from "../../src/schemas";

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
