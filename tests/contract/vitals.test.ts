import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { SARA_AUTH, createApp } from "../helpers/app";
import { BpMeasurement } from "../../src/schemas";

const dirs: string[] = [];
function app() {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), "nabz-vitals-"));
  dirs.push(runtimeDir);
  return createApp({ runtimeDir, pinnedNow: "2026-11-15T08:00:00+00:00" });
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

const body = {
  takenAt: "2026-11-15T08:20:00+00:00",
  readings: [{ systolic: 118, diastolic: 76, pulse: 104 }],
  symptoms: [],
};

describe("E07: heart rate and SpO2 with blood pressure", () => {
  it("scores the cuff pulse and the SpO2 next to the BP card", async () => {
    const res = await request(app()).post("/api/measurements/bp").set(SARA_AUTH).send({ ...body, spo2: 91 });
    expect(res.status).toBe(201);
    const m = BpMeasurement.parse(res.body);
    expect(m.spo2).toBe(91);
    expect(m.vitals?.map((v) => [v.code, v.value, v.status.level])).toEqual([
      ["heart-rate", 104, "watch"],
      ["spo2", 91, "act"],
    ]);
  });

  it("leaves the BP category and card unchanged", async () => {
    const withVitals = BpMeasurement.parse(
      (await request(app()).post("/api/measurements/bp").set(SARA_AUTH).send({ ...body, spo2: 85 })).body,
    );
    const without = BpMeasurement.parse(
      (
        await request(app())
          .post("/api/measurements/bp")
          .set(SARA_AUTH)
          .send({ ...body, readings: [{ systolic: 118, diastolic: 76 }] })
      ).body,
    );
    expect(withVitals.category).toBe(without.category);
    expect(withVitals.card.ruleId).toBe(without.card.ruleId);
    expect(without.vitals).toEqual([]);
  });

  it.each([101, 49, 95.5])("rejects SpO2 %s", async (spo2) => {
    const res = await request(app()).post("/api/measurements/bp").set(SARA_AUTH).send({ ...body, spo2 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_input");
  });
});
