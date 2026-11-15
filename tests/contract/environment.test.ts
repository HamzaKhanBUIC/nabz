import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/api/app";
import { EnvironmentFile, EnvironmentState, HazardList, RadiationEstimate, Today } from "../../src/schemas";

const NOW = "2026-11-15T08:00:00+00:00";
// Demo codes for the synthetic crew, as listed in README.md ("Demo crew codes").
const CODES: Record<string, string> = { sara: "4120", mateo: "7316" };
const environments = EnvironmentFile.parse(
  JSON.parse(readFileSync(path.join(process.cwd(), "content/environments.json"), "utf8")),
).environments;
const example = (name: string): object =>
  JSON.parse(readFileSync(new URL(`../../contract/examples/${name}`, import.meta.url), "utf8"));

function setup() {
  const app = createApp({ runtimeDir: mkdtempSync(path.join(tmpdir(), "crewpulse-env-")), pinnedNow: NOW });
  const as = async (crewId: string) => {
    const res = await request(app).post("/api/session").send({ crewId, code: CODES[crewId] });
    expect(res.status).toBe(201);
    return { Authorization: `Bearer ${res.body.token as string}` };
  };
  return { app, as };
}

describe("E03 hazards", () => {
  it("lists NASA's five hazards and tags every card", async () => {
    const { app, as } = setup();
    const hz = HazardList.parse((await request(app).get("/api/hazards")).body);
    expect(hz.hazards.map((h) => h.id)).toEqual([
      "space-radiation",
      "isolation-confinement",
      "distance-from-earth",
      "gravity-fields",
      "hostile-closed-environments",
    ]);
    const sara = await as("sara");
    await request(app).post("/api/checkins").set(sara).send(example("checkins.request.json"));
    const today = Today.parse((await request(app).get("/api/today").set(sara)).body);
    expect(today.cards.length).toBeGreaterThan(0);
    for (const c of today.cards) expect(c.hazards.length).toBeGreaterThan(0);
  });
});

describe("E06 environment profiles", () => {
  it("starts in Mars transit; only the Commander can switch", async () => {
    const { app, as } = setup();
    const initial = EnvironmentState.parse((await request(app).get("/api/environment")).body);
    expect(initial.active.id).toBe("mars-transit");
    expect((await request(app).get("/api/mission")).body.environment).toEqual({ id: "mars-transit", name: "Mars transit" });

    const mateo = await request(app).put("/api/environment").set(await as("mateo")).send({ id: "iss" });
    expect(mateo.status).toBe(403);
    expect(mateo.body.error.code).toBe("forbidden");

    const sara = await as("sara");
    expect((await request(app).put("/api/environment").set(sara).send({ id: "mars" })).status).toBe(400);
    const ok = await request(app).put("/api/environment").set(sara).send({ id: "iss" });
    expect(ok.status).toBe(200);
    expect(ok.body.active.id).toBe("iss");
    expect((await request(app).get("/api/mission")).body.environment.id).toBe("iss");
  });

  it("gives the same card, severity and status in every environment; only the escalation line differs", async () => {
    const { app, as } = setup();
    const sara = await as("sara");
    expect((await request(app).post("/api/checkins").set(sara).send(example("checkins.request.json"))).status).toBe(201);

    const seen: Array<{ id: string; ruleId: string; severity: string; status: unknown; escalation?: string }> = [];
    for (const env of environments) {
      expect((await request(app).put("/api/environment").set(sara).send({ id: env.id })).status).toBe(200);
      const today = Today.parse((await request(app).get("/api/today").set(sara)).body);
      const card = today.card!;
      seen.push({ id: card.id, ruleId: card.ruleId, severity: card.severity, status: card.status, escalation: card.escalation });
      const expected = card.severity === "act" || card.severity === "urgent" ? env.escalation : undefined;
      expect(card.escalation, env.id).toBe(expected);
      expect(today.checkin!.card.escalation).toBe(expected);
    }
    const decision = seen.map((d) => ({ id: d.id, ruleId: d.ruleId, severity: d.severity, status: d.status }));
    for (const d of decision) expect(d).toEqual(decision[0]);
  });
});

describe("E04 radiation estimate", () => {
  it("follows the active environment and stays honest where no rate is verified", async () => {
    const { app, as } = setup();
    const transit = RadiationEstimate.parse((await request(app).get("/api/radiation")).body);
    expect(transit).toMatchObject({ missionDay: 120, dailyRateMsv: 1.58, doseToDateMsv: 189.6, percentOfCareerLimit: 31.6 });
    expect(transit.sources.map((s) => s.id)).toContain("zeitlin-2013-msl");

    const sara = await as("sara");
    await request(app).put("/api/environment").set(sara).send({ id: "moon" });
    // 0.81 x 120 = 97.2 mSv
    expect((await request(app).get("/api/radiation")).body.doseToDateMsv).toBe(97.2);

    await request(app).put("/api/environment").set(sara).send({ id: "remote-earth" });
    const earth = RadiationEstimate.parse((await request(app).get("/api/radiation")).body);
    expect(earth.doseToDateMsv).toBeNull();
    expect(earth.status.label).toBe("Not tracked here");
  });
});
