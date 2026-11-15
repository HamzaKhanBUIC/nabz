import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/api/app";
import { ErrorBody, NasaCatalog, Trend } from "../../src/schemas";

const tempDirs: string[] = [];

function makeTempRuntimeDir(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "nabz-nasa-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()!;
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("E02 real NASA Inspiration4 OSD-569 endpoints (public)", () => {
  it("GET /api/nasa/osd-569 returns schema-valid catalog with 4 crew, 7 ordered timepoints, and units without auth", async () => {
    const app = createApp({ runtimeDir: makeTempRuntimeDir() });
    const res = await request(app).get("/api/nasa/osd-569");

    expect(res.status).toBe(200);
    const catalog = NasaCatalog.parse(res.body);

    expect(catalog.study).toBe("OSD-569");
    expect(catalog.crew).toEqual(["C001", "C002", "C003", "C004"]);
    expect(catalog.timepoints).toEqual([
      { label: "L-92", relativeDay: -92 },
      { label: "L-44", relativeDay: -44 },
      { label: "L-3", relativeDay: -3 },
      { label: "R+1", relativeDay: 1 },
      { label: "R+45", relativeDay: 45 },
      { label: "R+82", relativeDay: 82 },
      { label: "R+194", relativeDay: 194 },
    ]);
    expect(catalog.analytes.length).toBe(20);
    for (const analyte of catalog.analytes) {
      expect(analyte.unit.length).toBeGreaterThan(0);
    }
  });

  it("GET /api/nasa/osd-569/trend serves C001 hemoglobin matching raw CSV rows and pre-launch baseline mean", async () => {
    const app = createApp({ runtimeDir: makeTempRuntimeDir() });
    const res = await request(app).get("/api/nasa/osd-569/trend?crew=C001&analyte=hemoglobin");

    expect(res.status).toBe(200);
    const trend = Trend.parse(res.body);

    expect(trend.subjectId).toBe("C001");
    expect(trend.code).toBe("hemoglobin");
    expect(trend.source).toBe("nasa-osd-569");
    expect(trend.referenceRange).toEqual({ low: 13.2, high: 17.1 });

    // Raw C001 hemoglobin values read from data/nasa/LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv:
    //   C001_whole-blood_L-92_cbc (line 4): 14.1
    //   C001_whole-blood_L-44_cbc (line 3): 14.9
    //   C001_whole-blood_L-3_cbc  (line 2): 14.7
    //   C001_whole-blood_R+1_cbc  (line 5): 14.7
    //   C001_whole-blood_R+45_cbc (line 7): 14.3
    //   C001_whole-blood_R+82_cbc (line 8): 15.7
    //   C001_whole-blood_R+194_cbc (line 6): 14.1
    expect(trend.points.map((p) => p.missionDay)).toEqual([-92, -44, -3, 1, 45, 82, 194]);
    expect(trend.points.map((p) => p.value)).toEqual([14.1, 14.9, 14.7, 14.7, 14.3, 15.7, 14.1]);

    // Pre-launch mean: (14.1 + 14.9 + 14.7) / 3 = 43.7 / 3 = 14.566666... (API rounds to 4 decimals: 14.5667)
    const firstPostReturn = trend.points[3]!;
    expect(firstPostReturn.missionDay).toBe(1);
    expect(firstPostReturn.baselineMean).not.toBeNull();
    expect(firstPostReturn.baselineMean!).toBeCloseTo((14.1 + 14.9 + 14.7) / 3, 3);
  });

  it("returns 400 invalid_input for unknown crew, unknown analyte, and missing query", async () => {
    const app = createApp({ runtimeDir: makeTempRuntimeDir() });

    const badCrew = await request(app).get("/api/nasa/osd-569/trend?crew=C009&analyte=hemoglobin");
    expect(badCrew.status).toBe(400);
    expect(ErrorBody.parse(badCrew.body).error.code).toBe("invalid_input");

    const badAnalyte = await request(app).get("/api/nasa/osd-569/trend?crew=C001&analyte=not_a_real_analyte");
    expect(badAnalyte.status).toBe(400);
    expect(ErrorBody.parse(badAnalyte.body).error.code).toBe("invalid_input");

    const missingQuery = await request(app).get("/api/nasa/osd-569/trend");
    expect(missingQuery.status).toBe(400);
    expect(ErrorBody.parse(missingQuery.body).error.code).toBe("invalid_input");
  });
});
