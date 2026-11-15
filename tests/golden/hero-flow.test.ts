import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { SARA_AUTH, createApp } from "../helpers/app";
import {
  CheckinResponse,
  BpMeasurement,
  Procedure,
  ProcedureBundle,
  Today,
  Trend,
} from "../../src/schemas";
import {
  loadContentBundle,
  loadSubjectFixture,
  scoreSubjectFixture,
} from "../../src/store";

const tempDirs: string[] = [];

function makeTempRuntimeDir(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "nabz-hero-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe("F09 offline hero flow golden suite", () => {
  it("scores Sara's 120-day fixture so day 120 and short-sleep-week peak land in act", () => {
    const root = process.cwd();
    const content = loadContentBundle(path.join(root, "content"));
    const sara = loadSubjectFixture(path.join(root, "data", "fixtures"), "sara");

    const { checkins } = scoreSubjectFixture(sara, content.catalog);
    const day120 = checkins.find((c) => c.missionDay === 120);
    expect(day120).toBeDefined();
    expect(day120!.zone.zone).toBe("act");
    expect(day120!.card.ruleId).toBe("RT-SHORT-SLEEP");
    expect(day120!.card.id).toBe("reaction-slow-short-sleep");

    const shortSleepWeekEvent = sara.meta.events.find((e) => e.id === "short-sleep-week")!;
    const weekCheckins = checkins.filter(
      (c) => c.missionDay >= shortSleepWeekEvent.startDay && c.missionDay <= shortSleepWeekEvent.endDay,
    );
    expect(weekCheckins.some((c) => c.zone.zone === "act")).toBe(true);
  });

  it("executes the full offline day-120 hero flow over HTTP from /today to /emergency", async () => {
    const root = process.cwd();
    const runtimeDir = makeTempRuntimeDir();
    const sara = loadSubjectFixture(path.join(root, "data", "fixtures"), "sara");
    const day120Fixture = sara.days.find((d) => d.missionDay === 120)!;
    expect(day120Fixture.checkin).not.toBeNull();

    const app = createApp({ runtimeDir, pinnedNow: "2026-11-15T08:00:00+00:00" });

    // 1. Before check-in, today has no card
    const beforeTodayRes = await request(app).get("/api/today").set(SARA_AUTH);
    expect(beforeTodayRes.status).toBe(200);
    const beforeToday = Today.parse(beforeTodayRes.body);
    expect(beforeToday.missionDay).toBe(120);
    expect(beforeToday.card).toBeNull();
    expect(beforeToday.checkin).toBeNull();

    // 2. Sara submits day-120 PVT-B check-in after short sleep
    const checkinRes = await request(app).post("/api/checkins").set(SARA_AUTH).send({
      protocolId: "pvt-b-3min",
      startedAt: day120Fixture.checkin!.startedAt,
      sleepHours: day120Fixture.sleepHours,
      trials: day120Fixture.checkin!.trials,
    });
    expect(checkinRes.status).toBe(201);
    const postedCheckin = CheckinResponse.parse(checkinRes.body);
    expect(postedCheckin.zone.zone).toBe("act");
    expect(postedCheckin.card.ruleId).toBe("RT-SHORT-SLEEP");
    expect(postedCheckin.card.id).toBe("reaction-slow-short-sleep");
    expect(postedCheckin.card.disclaimer).toBe("Decision support, not a diagnosis.");
    expect(postedCheckin.card.sources.length).toBeGreaterThanOrEqual(1);

    // 3. Trend chart shows day 120 dropping below her personal act band
    const trendRes = await request(app).get("/api/trends?code=reaction-speed&days=30").set(SARA_AUTH);
    expect(trendRes.status).toBe(200);
    const trend = Trend.parse(trendRes.body);
    const lastPoint = trend.points[trend.points.length - 1]!;
    expect(lastPoint.missionDay).toBe(120);
    expect(lastPoint.zone).toBe("act");
    expect(trend.band.ready).toBe(true);
    expect(lastPoint.value).toBeLessThanOrEqual(trend.band.actAt!);

    // 4. Sara logs a severe BP reading -> 5-minute retest action
    const bpRes = await request(app).post("/api/measurements/bp").set(SARA_AUTH).send({
      takenAt: "2026-11-15T08:20:00+00:00",
      readings: [
        { systolic: 184, diastolic: 118 },
        { systolic: 186, diastolic: 122 },
      ],
      symptoms: [],
    });
    expect(bpRes.status).toBe(201);
    const postedBp = BpMeasurement.parse(bpRes.body);
    expect(postedBp.category).toBe("severe");
    expect(postedBp.nextAction).toEqual({ type: "retest", afterSeconds: 300 });
    expect(postedBp.card.id).toBe("bp-severe-retest");
    expect(postedBp.card.facts.retestMinutes).toBe(5);

    // 5. Today reflects both cards; emergency bundle and single procedure are served offline
    const afterTodayRes = await request(app).get("/api/today").set(SARA_AUTH);
    expect(afterTodayRes.status).toBe(200);
    const afterToday = Today.parse(afterTodayRes.body);
    expect(afterToday.checkin?.id).toBe(postedCheckin.id);
    expect(afterToday.bp?.id).toBe(postedBp.id);
    expect(afterToday.cards.length).toBe(2);

    const bundleRes = await request(app).get("/api/emergency/procedures").set(SARA_AUTH);
    expect(bundleRes.status).toBe(200);
    expect(ProcedureBundle.parse(bundleRes.body).procedures.length).toBe(5);

    const eyeRes = await request(app).get("/api/emergency/procedures/eye").set(SARA_AUTH);
    expect(eyeRes.status).toBe(200);
    const eyeProc = Procedure.parse(eyeRes.body);
    expect(eyeProc.steps.map((s) => s.text).join(" ")).toContain("15 minutes");
  });
});
