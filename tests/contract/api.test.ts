import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { SARA_AUTH, createApp } from "../helpers/app";
import {
  BpGuide,
  BpMeasurement,
  CheckinResponse,
  ErrorBody,
  HealthResponse,
  Mission,
  Procedure,
  ProcedureBundle,
  Protocol,
  SubjectFixture,
  Today,
  Trend,
} from "../../src/schemas";

const tempDirs: string[] = [];

function makeTempRuntimeDir(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "crewpulse-api-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()!;
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("F08 API contract and JSON store", () => {
  it("serves all Must GET endpoints with schema-valid responses and empty today initially", async () => {
    const runtimeDir = makeTempRuntimeDir();
    const app = createApp({ runtimeDir, pinnedNow: "2026-11-15T08:00:00+00:00" });

    const healthRes = await request(app).get("/api/health").set(SARA_AUTH);
    expect(healthRes.status).toBe(200);
    expect(HealthResponse.parse(healthRes.body)).toEqual({ ok: true });

    const missionRes = await request(app).get("/api/mission").set(SARA_AUTH);
    expect(missionRes.status).toBe(200);
    const mission = Mission.parse(missionRes.body);
    expect(mission.missionDay).toBe(120);
    expect(mission.crew.length).toBe(4);

    const todayRes = await request(app).get("/api/today").set(SARA_AUTH);
    expect(todayRes.status).toBe(200);
    const today = Today.parse(todayRes.body);
    expect(today.missionDay).toBe(120);
    expect(today.checkin).toBeNull();
    expect(today.bp).toBeNull();
    expect(today.card).toBeNull();
    expect(today.cards).toEqual([]);
    expect(today.nextDue).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    const protocolRes = await request(app).get("/api/checkin/protocol").set(SARA_AUTH);
    expect(protocolRes.status).toBe(200);
    expect(Protocol.parse(protocolRes.body).durationMs).toBe(180_000);

    const guideRes = await request(app).get("/api/measurements/bp/guide").set(SARA_AUTH);
    expect(guideRes.status).toBe(200);
    expect(BpGuide.parse(guideRes.body).steps.length).toBe(8);

    const selfProcRes = await request(app).get("/api/emergency/procedures").set(SARA_AUTH);
    expect(selfProcRes.status).toBe(200);
    const selfBundle = ProcedureBundle.parse(selfProcRes.body);
    expect(selfBundle.procedures.map((p) => p.id)).toEqual([
      "bleeding",
      "burn",
      "eye",
      "allergic-reaction",
      "near-fainting",
    ]);

    const crewmateRes = await request(app).get("/api/emergency/procedures?for=crewmate").set(SARA_AUTH);
    expect(crewmateRes.status).toBe(200);
    expect(ProcedureBundle.parse(crewmateRes.body).procedures.map((p) => p.id)).toEqual([
      "crewmate-collapse",
      "crewmate-cpr",
      "crewmate-seizure",
      "crewmate-low-blood-sugar",
    ]);

    const oneProcRes = await request(app).get("/api/emergency/procedures/eye").set(SARA_AUTH);
    expect(oneProcRes.status).toBe(200);
    expect(Procedure.parse(oneProcRes.body).id).toBe("eye");

    const trendCodes = ["reaction-speed", "bp-systolic", "bp-diastolic", "sleep-hours"] as const;
    for (const code of trendCodes) {
      const trendRes = await request(app).get(`/api/trends?code=${code}&days=30`).set(SARA_AUTH);
      expect(trendRes.status).toBe(200);
      const parsed = Trend.parse(trendRes.body);
      expect(parsed.code).toBe(code);
      expect(parsed.source).toBe("simulated");
    }
  });

  it("persists POST /api/checkins and POST /api/measurements/bp across store reloads", async () => {
    const runtimeDir = makeTempRuntimeDir();
    const saraRaw = JSON.parse(
      readFileSync(path.join(process.cwd(), "data/fixtures/sara.json"), "utf8"),
    );
    const sara = SubjectFixture.parse(saraRaw);
    const day120 = sara.days.find((d) => d.missionDay === 120)!;

    const app1 = createApp({ runtimeDir, pinnedNow: "2026-11-15T08:00:00+00:00" });

    const chkRes = await request(app1).post("/api/checkins").set(SARA_AUTH).send({
      protocolId: "pvt-b-3min",
      startedAt: day120.checkin!.startedAt,
      sleepHours: day120.sleepHours,
      trials: day120.checkin!.trials,
    });
    expect(chkRes.status).toBe(201);
    const createdCheckin = CheckinResponse.parse(chkRes.body);
    expect(createdCheckin.source).toBe("live");
    expect(createdCheckin.missionDay).toBe(120);

    const bpRes = await request(app1).post("/api/measurements/bp").set(SARA_AUTH).send({
      takenAt: "2026-11-15T08:20:00+00:00",
      readings: [
        { systolic: 184, diastolic: 118 },
        { systolic: 186, diastolic: 122 },
      ],
      symptoms: [],
    });
    expect(bpRes.status).toBe(201);
    const createdBp = BpMeasurement.parse(bpRes.body);
    expect(createdBp.category).toBe("severe");
    expect(createdBp.nextAction).toEqual({ type: "retest", afterSeconds: 300 });
    expect(createdBp.card.ruleId).toBe("BP-SEVERE-RETEST");

    // New app instance reading the same runtimeDir preserves today's entries and mixed trends
    const app2 = createApp({ runtimeDir, pinnedNow: "2026-11-15T08:00:00+00:00" });
    const todayRes = await request(app2).get("/api/today").set(SARA_AUTH);
    expect(todayRes.status).toBe(200);
    const today = Today.parse(todayRes.body);
    expect(today.checkin?.id).toBe(createdCheckin.id);
    expect(today.bp?.id).toBe(createdBp.id);
    expect(today.cards.length).toBe(2);
    expect(today.card?.ruleId).toBe(createdCheckin.card.ruleId);

    const mixedTrend = await request(app2).get("/api/trends?code=reaction-speed&days=7").set(SARA_AUTH);
    expect(mixedTrend.status).toBe(200);
    expect(Trend.parse(mixedTrend.body).source).toBe("mixed");
  });

  it("recovers from a corrupt runtime file by renaming it to *.corrupt", async () => {
    const runtimeDir = makeTempRuntimeDir();
    const corruptSource = path.join(runtimeDir, "sara.json");
    writeFileSync(corruptSource, "{not valid json", "utf8");

    const app = createApp({ runtimeDir, pinnedNow: "2026-11-15T08:00:00+00:00" });
    const todayRes = await request(app).get("/api/today").set(SARA_AUTH);
    expect(todayRes.status).toBe(200);
    expect(Today.parse(todayRes.body).checkin).toBeNull();
    expect(existsSync(`${corruptSource}.corrupt`)).toBe(true);
  });

  it("rejects malformed inputs with 400 and missing procedures with 404", async () => {
    const runtimeDir = makeTempRuntimeDir();
    const app = createApp({ runtimeDir, pinnedNow: "2026-11-15T08:00:00+00:00" });

    // Unknown field / mood or client-sent scores rejected by strict schema
    const badCheckin = await request(app).post("/api/checkins").set(SARA_AUTH).send({
      protocolId: "pvt-b-3min",
      startedAt: "2026-11-15T08:02:11+00:00",
      trials: [{ i: 0, isiMs: 2000, rtMs: 250, early: false }],
      metrics: { lapses: 0 },
    });
    expect(badCheckin.status).toBe(400);
    expect(ErrorBody.parse(badCheckin.body).error.code).toBe("invalid_input");

    // Early tap with rtMs rejected
    const badTrial = await request(app).post("/api/checkins").set(SARA_AUTH).send({
      protocolId: "pvt-b-3min",
      startedAt: "2026-11-15T08:02:11+00:00",
      trials: [{ i: 0, isiMs: 2000, rtMs: 250, early: true }],
    });
    expect(badTrial.status).toBe(400);
    expect(ErrorBody.parse(badTrial.body).error.code).toBe("invalid_input");

    // Unknown symptom rejected
    const badBp = await request(app).post("/api/measurements/bp").set(SARA_AUTH).send({
      takenAt: "2026-11-15T08:20:00+00:00",
      readings: [{ systolic: 120, diastolic: 80 }],
      symptoms: ["headache"],
    });
    expect(badBp.status).toBe(400);
    expect(ErrorBody.parse(badBp.body).error.code).toBe("invalid_input");

    // Invalid trend query rejected
    const badTrend = await request(app).get("/api/trends?code=mood&days=30").set(SARA_AUTH);
    expect(badTrend.status).toBe(400);
    expect(ErrorBody.parse(badTrend.body).error.code).toBe("invalid_input");

    const badProcQuery = await request(app).get("/api/emergency/procedures?for=invalid").set(SARA_AUTH);
    expect(badProcQuery.status).toBe(400);
    expect(ErrorBody.parse(badProcQuery.body).error.code).toBe("invalid_input");

    const missingProc = await request(app).get("/api/emergency/procedures/nonexistent").set(SARA_AUTH);
    expect(missingProc.status).toBe(404);
    expect(ErrorBody.parse(missingProc.body).error.code).toBe("not_found");
  });

  it("serves all 6 live Should endpoints and rejects invalid payloads with 400", async () => {
    const runtimeDir = makeTempRuntimeDir();
    const app = createApp({ runtimeDir, pinnedNow: "2026-11-15T08:00:00+00:00" });

    expect((await request(app).get("/api/routines").set(SARA_AUTH)).status).toBe(200);
    expect((await request(app).get("/api/reminders").set(SARA_AUTH)).status).toBe(200);
    expect((await request(app).post("/api/share/preview").set(SARA_AUTH).send({})).status).toBe(200);
    expect((await request(app).post("/api/coach/ask").set(SARA_AUTH).send({ question: "What should I do today?" })).status).toBe(200);

    const badShare = await request(app).post("/api/share").set(SARA_AUTH).send({ confirm: false });
    expect(badShare.status).toBe(400);
    expect(ErrorBody.parse(badShare.body).error.code).toBe("invalid_input");

    const goodShare = await request(app).post("/api/share").set(SARA_AUTH).send({ confirm: true, days: 2 });
    expect(goodShare.status).toBe(201);

    const badReminder = await request(app).put("/api/reminders").set(SARA_AUTH).send({ enabled: true });
    expect(badReminder.status).toBe(400);
    expect(ErrorBody.parse(badReminder.body).error.code).toBe("invalid_input");

    const badCoach = await request(app).post("/api/coach/ask").set(SARA_AUTH).send({ question: "a" });
    expect(badCoach.status).toBe(400);
    expect(ErrorBody.parse(badCoach.body).error.code).toBe("invalid_input");
  });

  it("serves the offline /dev test console outside production", async () => {
    const runtimeDir = makeTempRuntimeDir();
    const app = createApp({ runtimeDir });

    const htmlRes = await request(app).get("/dev/").set(SARA_AUTH);
    expect(htmlRes.status).toBe(200);
    expect(htmlRes.text).toContain("crewpulse dev console");
    expect(htmlRes.text).toContain("/dev/console.js");

    const jsRes = await request(app).get("/dev/console.js").set(SARA_AUTH);
    expect(jsRes.status).toBe(200);
    expect(jsRes.text).toContain("/api/checkins");
  });
});
