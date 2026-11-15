import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { SARA_AUTH, createApp } from "../helpers/app";
import { BpMeasurement, CheckinResponse, Today } from "../../src/schemas";
import { loadSubjectFixture } from "../../src/store";

// Bugs found in the orchestrator's review of the first API build (Nov 14). Each test failed before its fix.

const NOW = "2026-11-15T08:00:00+00:00"; // mission day 120
const tempDirs: string[] = [];

function makeApp() {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), "crewpulse-regress-"));
  tempDirs.push(runtimeDir);
  return createApp({ runtimeDir, pinnedNow: NOW });
}

function day120Trials() {
  const sara = loadSubjectFixture(path.join(process.cwd(), "data", "fixtures"), "sara");
  return sara.days.find((d) => d.missionDay === 120)!.checkin!.trials;
}

afterEach(() => {
  while (tempDirs.length > 0) rmSync(tempDirs.pop()!, { recursive: true, force: true });
});

describe("the server's mission clock decides the day, not the browser's", () => {
  for (const startedAt of ["2026-11-14T21:40:00+05:00", "2026-11-16T09:00:00+00:00", "2031-01-01T00:00:00+00:00"]) {
    it(`a check-in stamped ${startedAt} lands on mission day 120 and shows in /api/today`, async () => {
      const app = makeApp();
      const res = await request(app)
        .post("/api/checkins").set(SARA_AUTH)
        .send({ protocolId: "pvt-b-3min", startedAt, sleepHours: 5.2, trials: day120Trials() });
      expect(res.status).toBe(201);
      const checkin = CheckinResponse.parse(res.body);
      expect(checkin.missionDay).toBe(120);
      expect(checkin.effectiveDateTime).toBe(startedAt);

      const today = Today.parse((await request(app).get("/api/today").set(SARA_AUTH)).body);
      expect(today.checkin?.id).toBe(checkin.id);
      expect(today.card?.id).toBe(checkin.card.id);
    });
  }

  it("a blood pressure reading stamped on another date still lands on mission day 120", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/measurements/bp").set(SARA_AUTH)
      .send({ takenAt: "2026-11-13T23:00:00+00:00", readings: [{ systolic: 118, diastolic: 76 }], symptoms: [] });
    expect(res.status).toBe(201);
    const bp = BpMeasurement.parse(res.body);
    expect(bp.missionDay).toBe(120);
    const today = Today.parse((await request(app).get("/api/today").set(SARA_AUTH)).body);
    expect(today.bp?.id).toBe(bp.id);
  });
});

describe("a new check-in is scored as itself, whatever its timestamp", () => {
  it("a too-short session sent with an earlier timestamp than an existing entry is not scored", async () => {
    const app = makeApp();
    const full = await request(app)
      .post("/api/checkins").set(SARA_AUTH)
      .send({ protocolId: "pvt-b-3min", startedAt: "2026-11-15T10:00:00+00:00", sleepHours: 5.2, trials: day120Trials() });
    expect(CheckinResponse.parse(full.body).zone.zone).toBe("act");

    const short = await request(app)
      .post("/api/checkins").set(SARA_AUTH)
      .send({ protocolId: "pvt-b-3min", startedAt: "2026-11-15T09:00:00+00:00", trials: day120Trials().slice(0, 5) });
    expect(short.status).toBe(201);
    const flagged = CheckinResponse.parse(short.body);
    expect(flagged.qcFlags).toContain("too_few_stimuli");
    expect(flagged.zone.zone).toBe("not_scored");
    expect(flagged.zone.z).toBeNull();
    expect(flagged.card.ruleId).toBe("RT-RETAKE");
  });
});

describe("an abnormal blood pressure reading does not become part of the normal", () => {
  it("the baseline is unchanged after a severe reading", async () => {
    const app = makeApp();
    const severe = BpMeasurement.parse(
      (
        await request(app)
          .post("/api/measurements/bp").set(SARA_AUTH)
          .send({ takenAt: "2026-11-15T08:20:00+00:00", readings: [{ systolic: 186, diastolic: 121 }], symptoms: [] })
      ).body,
    );
    expect(severe.category).toBe("severe");
    expect(severe.zone.baseline.ready).toBe(true);

    const next = BpMeasurement.parse(
      (
        await request(app)
          .post("/api/measurements/bp").set(SARA_AUTH)
          .send({ takenAt: "2026-11-15T09:00:00+00:00", readings: [{ systolic: 116, diastolic: 74 }], symptoms: [] })
      ).body,
    );
    expect(next.zone.baseline.mean).toBe(severe.zone.baseline.mean);
    expect(next.zone.baseline.sd).toBe(severe.zone.baseline.sd);
    expect(next.zone.baseline.sd!).toBeLessThan(10);
  });
});
