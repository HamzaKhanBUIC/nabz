import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/api/app";
import { ConsentResponse, CrewOverview } from "../../src/schemas";

const NOW = "2026-11-15T08:00:00+00:00";
// Demo codes for the synthetic crew, as listed in README.md ("Demo crew codes").
const CODES: Record<string, string> = { sara: "4120", mateo: "7316", elena: "2468", kenji: "9053" };

function setup() {
  const app = createApp({ runtimeDir: mkdtempSync(path.join(tmpdir(), "nabz-officer-")), pinnedNow: NOW });
  const as = async (crewId: string) => {
    const res = await request(app).post("/api/session").send({ crewId, code: CODES[crewId] });
    expect(res.status).toBe(201);
    return { Authorization: `Bearer ${res.body.token as string}` };
  };
  return { app, as };
}

/** Field names that would mean raw personal data leaked into the overview. */
const RAW_KEYS = ["trials", "readings", "average", "symptoms", "note", "question", "rtMs", "whatChanged", "facts"];
function keysDeep(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => keysDeep(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      out.add(k);
      keysDeep(v, out);
    }
  }
  return out;
}

describe("E05 consent and Medical Officer view", () => {
  it("sharing is off by default and each person sets only their own", async () => {
    const { app, as } = setup();
    const sara = await as("sara");
    const initial = ConsentResponse.parse((await request(app).get("/api/consent").set(sara)).body);
    expect(initial).toEqual({ shareWithMedicalOfficer: false, accessLog: [] });
    const on = await request(app).put("/api/consent").set(sara).send({ shareWithMedicalOfficer: true });
    expect(on.status).toBe(200);
    expect(on.body.shareWithMedicalOfficer).toBe(true);
    const mateo = await as("mateo");
    expect((await request(app).get("/api/consent").set(mateo)).body.shareWithMedicalOfficer).toBe(false);
    expect((await request(app).put("/api/consent").set(sara).send({ share: true })).status).toBe(400);
  });

  it("only the Medical Officer can read the overview", async () => {
    const { app, as } = setup();
    for (const id of ["sara", "mateo", "kenji"]) {
      const res = await request(app).get("/api/crew/overview").set(await as(id));
      expect(res.status, id).toBe(403);
      expect(res.body.error.code).toBe("forbidden");
    }
    expect((await request(app).get("/api/crew/overview").set(await as("elena"))).status).toBe(200);
  });

  it("shows a summary only for crewmates who shared, with no raw data, and logs each read", async () => {
    const { app, as } = setup();
    const sara = await as("sara");
    await request(app).put("/api/consent").set(sara).send({ shareWithMedicalOfficer: true });
    const elena = await as("elena");

    const res = await request(app).get("/api/crew/overview").set(elena);
    const overview = CrewOverview.parse(res.body);
    expect(overview.crew.map((c) => c.id)).toEqual(["sara", "mateo", "kenji"]);

    const saraRow = overview.crew.find((c) => c.id === "sara")!;
    expect(saraRow.shared).toBe(true);
    expect(saraRow.summary?.missionDay).toBe(120);
    expect(saraRow.summary?.lastCheckinDay).toBe(119);
    expect(saraRow.summary?.reaction?.label).toBeTruthy();

    for (const id of ["mateo", "kenji"]) {
      const row = overview.crew.find((c) => c.id === id)!;
      expect(row.shared).toBe(false);
      expect(row.summary).toBeNull();
    }

    const keys = keysDeep(res.body);
    for (const k of RAW_KEYS) expect(keys.has(k), k).toBe(false);

    const log = ConsentResponse.parse((await request(app).get("/api/consent").set(sara)).body).accessLog;
    expect(log).toEqual([{ viewerId: "elena", viewerName: "Elena", at: NOW }]);
    const mateoLog = (await request(app).get("/api/consent").set(await as("mateo"))).body.accessLog;
    expect(mateoLog).toEqual([]);
  });
});
