import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/api/app";
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

    const healthRes = await request(app).get("/api/health");
    expect(healthRes.status).toBe(200);
    expect(HealthResponse.parse(healthRes.body)).toEqual({ ok: true });

    const missionRes = await request(app).get("/api/mission");
    expect(missionRes.status).toBe(200);
    const mission = Mission.parse(missionRes.body);
    expect(mission.missionDay).toBe(120);
    expect(mission.crew.length).toBe(4);

    const todayRes = await request(app).get("/api/today");
    expect(todayRes.status).toBe(200);
    expect(Today.parse(todayRes.body)).toEqual({
      missionDay: 120,
      checkin: null,
      bp: null,
      card: null,
      cards: [],
      nextDue: null,
    });

    const protocolRes = await request(app).get("/api/checkin/protocol");
    expect(protocolRes.status).toBe(200);
    expect(Protocol.parse(protocolRes.body).durationMs).toBe(180_000);

    const guideRes = await request(app).get("/api/measurements/bp/guide");
    expect(guideRes.status).toBe(200);
    expect(BpGuide.parse(guideRes.body).steps.length).toBe(8);

    const selfProcRes = await request(app).get("/api/emergency/procedures");
    expect(selfProcRes.status).toBe(200);
    const selfBundle = ProcedureBundle.parse(selfProcRes.body);
    expect(selfBundle.procedures.map((p) => p.id)).toEqual([
      "bleeding",
      "burn",
      "eye",
      "allergic-reaction",
      "near-fainting",
    ]);

    const crewmateRes = await request(app).get("/api/emergency/procedures?for=crewmate");
    expect(crewmateRes.status).toBe(200);
    expect(ProcedureBundle.parse(crewmateRes.body).procedures).toEqual([]);

    const oneProcRes = await request(app).get("/api/emergency/procedures/eye");
    expect(oneProcRes.status).toBe(200);
    expect(Procedure.parse(oneProcRes.body).id).toBe("eye");

    const trendCodes = ["reaction-speed", "bp-systolic", "bp-diastolic", "sleep-hours"] as const;
    for (const code of trendCodes) {
      const trendRes = await request(app).get(`/api/trends?code=${code}&days=30`);
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

    const chkRes = await request(app1).post("/api/checkins").send({
      protocolId: "pvt-b-3min",
      startedAt: day120.checkin!.startedAt,
      sleepHours: day120.sleepHours,
      trials: day120.checkin!.trials,
    });
    expect(chkRes.status).toBe(201);
    const createdCheckin = CheckinResponse.parse(chkRes.body);
    expect(createdCheckin.source).toBe("live");
    expect(createdCheckin.missionDay).toBe(120);

    const bpRes = await request(app1).post("/api/measurements/bp").send({
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
    const todayRes = await request(app2).get("/api/today");
    expect(todayRes.status).toBe(200);
    const today = Today.parse(todayRes.body);
    expect(today.checkin?.id).toBe(createdCheckin.id);
    expect(today.bp?.id).toBe(createdBp.id);
    expect(today.cards.length).toBe(2);
    expect(today.card?.ruleId).toBe(createdCheckin.card.ruleId);

    const mixedTrend = await request(app2).get("/api/trends?code=reaction-speed&days=7");
    expect(mixedTrend.status).toBe(200);
    expect(Trend.parse(mixedTrend.body).source).toBe("mixed");
  });

  it("recovers from a corrupt runtime file by renaming it to *.corrupt", async () => {
    const runtimeDir = makeTempRuntimeDir();
    const corruptSource = path.join(runtimeDir, "sara.json");
    writeFileSync(corruptSource, "{not valid json", "utf8");

    const app = createApp({ runtimeDir, pinnedNow: "2026-11-15T08:00:00+00:00" });
    const todayRes = await request(app).get("/api/today");
    expect(todayRes.status).toBe(200);
    expect(Today.parse(todayRes.body).checkin).toBeNull();
    expect(existsSync(`${corruptSource}.corrupt`)).toBe(true);
  });

  it("rejects malformed inputs with 400 and missing procedures with 404", async () => {
    const runtimeDir = makeTempRuntimeDir();
    const app = createApp({ runtimeDir, pinnedNow: "2026-11-15T08:00:00+00:00" });

    // Unknown field / mood or client-sent scores rejected by strict schema
    const badCheckin = await request(app).post("/api/checkins").send({
      protocolId: "pvt-b-3min",
      startedAt: "2026-11-15T08:02:11+00:00",
      trials: [{ i: 0, isiMs: 2000, rtMs: 250, early: false }],
      metrics: { lapses: 0 },
    });
    expect(badCheckin.status).toBe(400);
    expect(ErrorBody.parse(badCheckin.body).error.code).toBe("invalid_input");

    // Early tap with rtMs rejected
    const badTrial = await request(app).post("/api/checkins").send({
      protocolId: "pvt-b-3min",
      startedAt: "2026-11-15T08:02:11+00:00",
      trials: [{ i: 0, isiMs: 2000, rtMs: 250, early: true }],
    });
    expect(badTrial.status).toBe(400);
    expect(ErrorBody.parse(badTrial.body).error.code).toBe("invalid_input");

    // Unknown symptom rejected
    const badBp = await request(app).post("/api/measurements/bp").send({
      takenAt: "2026-11-15T08:20:00+00:00",
      readings: [{ systolic: 120, diastolic: 80 }],
      symptoms: ["headache"],
    });
    expect(badBp.status).toBe(400);
    expect(ErrorBody.parse(badBp.body).error.code).toBe("invalid_input");

    // Invalid trend query rejected
    const badTrend = await request(app).get("/api/trends?code=mood&days=30");
    expect(badTrend.status).toBe(400);
    expect(ErrorBody.parse(badTrend.body).error.code).toBe("invalid_input");

    const badProcQuery = await request(app).get("/api/emergency/procedures?for=invalid");
    expect(badProcQuery.status).toBe(400);
    expect(ErrorBody.parse(badProcQuery.body).error.code).toBe("invalid_input");

    const missingProc = await request(app).get("/api/emergency/procedures/nonexistent");
    expect(missingProc.status).toBe(404);
    expect(ErrorBody.parse(missingProc.body).error.code).toBe("not_found");
  });

  it("answers 501 not_built on all 6 reserved Should endpoints", async () => {
    const runtimeDir = makeTempRuntimeDir();
    const app = createApp({ runtimeDir });

    const reserved: Array<{ method: "get" | "post" | "put"; path: string; feature: string }> = [
      { method: "post", path: "/api/coach/ask", feature: "coach" },
      { method: "get", path: "/api/routines", feature: "routines" },
      { method: "post", path: "/api/share/preview", feature: "share" },
      { method: "post", path: "/api/share", feature: "share" },
      { method: "get", path: "/api/reminders", feature: "reminders" },
      { method: "put", path: "/api/reminders", feature: "reminders" },
    ];

    for (const item of reserved) {
      const res = await request(app)[item.method](item.path).send({});
      expect(res.status).toBe(501);
      const body = ErrorBody.parse(res.body);
      expect(body.error.code).toBe("not_built");
      expect(body.error.feature).toBe(item.feature);
    }
  });
});
