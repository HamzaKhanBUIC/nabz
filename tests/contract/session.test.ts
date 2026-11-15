import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/api/app";
import { LOCKOUT_MS, SESSION_TTL_MS, createSessionStore } from "../../src/api/session";
import { ENDPOINTS, SessionResponse } from "../../src/schemas";

const NOW = "2026-11-15T08:00:00+00:00";
// Demo codes for the synthetic crew, as listed in README.md ("Demo crew codes").
const CODES = { sara: "4120", mateo: "7316" } as const;

function setup() {
  let clock = Date.parse(NOW);
  const sessions = createSessionStore({ now: () => clock });
  const app = createApp({ runtimeDir: mkdtempSync(path.join(tmpdir(), "crewpulse-session-")), pinnedNow: NOW, sessions });
  return { app, advance: (ms: number) => (clock += ms) };
}

async function signIn(app: ReturnType<typeof createApp>, crewId: string, code: string) {
  const res = await request(app).post("/api/session").send({ crewId, code });
  expect(res.status).toBe(201);
  return `Bearer ${SessionResponse.parse(res.body).token}`;
}

const example = (name: string): object =>
  JSON.parse(readFileSync(new URL(`../../contract/examples/${name}`, import.meta.url), "utf8"));

describe("E01 crew sign-in", () => {
  it("lists the crew publicly and signs in with the right code", async () => {
    const { app } = setup();
    const crew = await request(app).get("/api/crew");
    expect(crew.status).toBe(200);
    expect(crew.body.crew.map((c: { id: string }) => c.id)).toEqual(["sara", "mateo", "elena", "kenji"]);

    const auth = await signIn(app, "sara", CODES.sara);
    const me = await request(app).get("/api/session").set("Authorization", auth);
    expect(me.status).toBe(200);
    expect(me.body.crew).toEqual({ id: "sara", name: "Sara", role: "Commander" });
  });

  it("rejects a wrong code, an unknown crew id and a malformed body", async () => {
    const { app } = setup();
    const wrong = await request(app).post("/api/session").send({ crewId: "sara", code: "0000" });
    expect(wrong.status).toBe(401);
    expect(wrong.body.error.code).toBe("invalid_code");
    const unknown = await request(app).post("/api/session").send({ crewId: "nobody", code: "1234" });
    expect(unknown.status).toBe(401);
    expect(unknown.body.error.code).toBe("invalid_code");
    const bad = await request(app).post("/api/session").send({ crewId: "sara", code: "12" });
    expect(bad.status).toBe(400);
  });

  it("locks a crew id after 5 wrong codes, for 60 s, even for the right code", async () => {
    const { app, advance } = setup();
    for (let i = 0; i < 5; i++) {
      await request(app).post("/api/session").send({ crewId: "sara", code: "0000" });
    }
    const locked = await request(app).post("/api/session").send({ crewId: "sara", code: CODES.sara });
    expect(locked.status).toBe(429);
    expect(locked.body.error.code).toBe("locked");
    expect(locked.body.error.retryAfterSeconds).toBe(60);
    // Other crew are not locked.
    await signIn(app, "mateo", CODES.mateo);
    advance(LOCKOUT_MS + 1);
    await signIn(app, "sara", CODES.sara);
  });

  it("answers 401 no_session on every personal endpoint without a token", async () => {
    const { app } = setup();
    const personal = ENDPOINTS.filter((e) => e.access === "session" || e.access === "officer");
    expect(personal.length).toBeGreaterThanOrEqual(9);
    for (const e of personal) {
      const method = e.method.toLowerCase() as "get" | "post" | "put";
      const res = await request(app)[method](e.path).send({});
      expect(res.status, `${e.method} ${e.path}`).toBe(401);
      expect(res.body.error.code).toBe("no_session");
    }
  });

  it("keeps emergency, guides, protocol and mission public", async () => {
    const { app } = setup();
    for (const p of ["/api/emergency/procedures", "/api/emergency/procedures?for=crewmate", "/api/measurements/bp/guide", "/api/checkin/protocol", "/api/mission", "/api/routines", "/api/health"]) {
      const res = await request(app).get(p);
      expect(res.status, p).toBe(200);
    }
  });

  it("gives each person their own data", async () => {
    const { app } = setup();
    const sara = await signIn(app, "sara", CODES.sara);
    const mateo = await signIn(app, "mateo", CODES.mateo);

    const saraTrend = await request(app).get("/api/trends?code=reaction-speed&days=14").set("Authorization", sara);
    const mateoTrend = await request(app).get("/api/trends?code=reaction-speed&days=14").set("Authorization", mateo);
    expect(saraTrend.body.subjectId).toBe("sara");
    expect(mateoTrend.body.subjectId).toBe("mateo");
    expect(mateoTrend.body.points).not.toEqual(saraTrend.body.points);

    const created = await request(app).post("/api/checkins").set("Authorization", mateo).send(example("checkins.request.json"));
    expect(created.status).toBe(201);
    expect(created.body.subjectId).toBe("mateo");
    const saraToday = await request(app).get("/api/today").set("Authorization", sara);
    expect(saraToday.body.checkin).toBeNull();
    const mateoToday = await request(app).get("/api/today").set("Authorization", mateo);
    expect(mateoToday.body.checkin.id).toBe(created.body.id);
  });

  it("ends a session on sign-out and after 12 h", async () => {
    const { app, advance } = setup();
    const a = await signIn(app, "sara", CODES.sara);
    expect((await request(app).delete("/api/session").set("Authorization", a)).status).toBe(204);
    expect((await request(app).get("/api/session").set("Authorization", a)).status).toBe(401);

    const b = await signIn(app, "sara", CODES.sara);
    advance(SESSION_TTL_MS + 1);
    expect((await request(app).get("/api/session").set("Authorization", b)).status).toBe(401);
  });
});
