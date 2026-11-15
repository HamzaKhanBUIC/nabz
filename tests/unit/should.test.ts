import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { SARA_AUTH, createApp } from "../helpers/app";
import { createStore } from "../../src/store";
import {
  COACH_NO_SOURCE_REPLY,
  COACH_URGENT_BANNER_LABEL,
  computeReminders,
  nextDue,
} from "../../src/core";
import { OllamaCoachProvider } from "../../src/slots/coach";
import {
  CoachAskResponse,
  DISCLAIMER,
  ErrorBody,
  ProcedureBundle,
  RemindersResponse,
  RoutineBundle,
  SharePackagePreview,
  ShareQueuedPackage,
  SubjectFixture,
  Today,
} from "../../src/schemas";

const NOW = "2026-11-15T08:00:00+00:00";
const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "nabz-should-"));
  tempDirs.push(dir);
  return dir;
}

function day120Fixture() {
  const raw = JSON.parse(
    readFileSync(path.join(process.cwd(), "data/fixtures/sara.json"), "utf8"),
  );
  const sara = SubjectFixture.parse(raw);
  return sara.days.find((d) => d.missionDay === 120)!;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe("S01 crewmate emergency procedures (?for=crewmate)", () => {
  it("serves all 4 crewmate procedures with CHECKS.md R8 wording and metronome", async () => {
    const app = createApp({ runtimeDir: makeTempDir(), pinnedNow: NOW });

    const selfRes = await request(app).get("/api/emergency/procedures?for=self").set(SARA_AUTH);
    expect(selfRes.status).toBe(200);
    expect(ProcedureBundle.parse(selfRes.body).procedures).toHaveLength(5);

    const crewRes = await request(app).get("/api/emergency/procedures?for=crewmate").set(SARA_AUTH);
    expect(crewRes.status).toBe(200);
    const bundle = ProcedureBundle.parse(crewRes.body);
    expect(bundle.procedures.map((p) => p.id)).toEqual([
      "crewmate-collapse",
      "crewmate-cpr",
      "crewmate-seizure",
      "crewmate-low-blood-sugar",
    ]);

    for (const proc of bundle.procedures) {
      expect(proc.for).toBe("crewmate");
      expect(proc.disclaimer).toBe(DISCLAIMER);
      expect(proc.sources.length).toBeGreaterThanOrEqual(1);
      for (const step of proc.steps) {
        expect(step.text.trim().split(/\s+/).length).toBeLessThanOrEqual(20);
      }
    }

    const byId = Object.fromEntries(bundle.procedures.map((p) => [p.id, p]));
    const cprText = JSON.stringify(byId["crewmate-cpr"]);
    expect(cprText).toContain("Wrap your legs around their chest. Lock your ankles behind their back.");
    expect(cprText).not.toMatch(/hook and cross ankles/i);
    expect(cprText).toContain("100 to 120");
    expect(cprText).toContain("electrically isolated");
    expect(cprText).toContain("without a defibrillator");
    expect(
      byId["crewmate-cpr"]!.steps.find((s) => s.id === "compressions")?.metronomeBpm,
    ).toBe(110);

    const seizureText = JSON.stringify(byId["crewmate-seizure"]);
    expect(seizureText).toContain("5 minutes");
    expect(seizureText).toContain("5 to 10 minutes");
    expect(seizureText.toLowerCase()).toContain("do not restrain");

    const sugarText = JSON.stringify(byId["crewmate-low-blood-sugar"]);
    expect(sugarText.toLowerCase()).toContain("awake and able to swallow");

    const collapseText = JSON.stringify(byId["crewmate-collapse"]);
    expect(collapseText.toLowerCase()).toContain("follow your spacecraft's emergency procedure");
    expect(collapseText).not.toContain("Warn, Gather, Work");
  });
});

describe("S02 deterministic offline-first AI coach", () => {
  it("explains today's card using card facts + verified content, abstains out-of-scope, and adds urgent red-flag banner", async () => {
    const app = createApp({ runtimeDir: makeTempDir(), pinnedNow: NOW });
    const d120 = day120Fixture();

    const chkRes = await request(app).post("/api/checkins").set(SARA_AUTH).send({
      protocolId: "pvt-b-3min",
      startedAt: d120.checkin!.startedAt,
      sleepHours: d120.sleepHours,
      trials: d120.checkin!.trials,
    });
    expect(chkRes.status).toBe(201);

    const todayBefore = Today.parse((await request(app).get("/api/today").set(SARA_AUTH)).body);

    // 1. Grounded follow-up questions on active card
    const whyRes = await request(app).post("/api/coach/ask").set(SARA_AUTH).send({
      question: "Why is my reaction slower?",
    });
    expect(whyRes.status).toBe(200);
    const whyReply = CoachAskResponse.parse(whyRes.body);
    expect(whyReply.provider).toBe("deterministic");
    expect(whyReply.grounded).toBe(true);
    expect(whyReply.cardId).toBe("reaction-slow-short-sleep");
    expect(whyReply.ruleId).toBe("RT-SHORT-SLEEP");
    expect(whyReply.banner).toBeUndefined();
    expect(whyReply.citations.map((c) => c.id)).toContain("jones-2022-iss-sleep");
    expect(whyReply.answer).toContain(String(d120.sleepHours));
    expect(whyReply.disclaimer).toBe(DISCLAIMER);

    const worseRes = await request(app).post("/api/coach/ask").set(SARA_AUTH).send({
      question: "What if it gets worse?",
    });
    const worseReply = CoachAskResponse.parse(worseRes.body);
    expect(worseReply.grounded).toBe(true);
    expect(worseReply.answer).toContain("3 consecutive days");

    const earthRes = await request(app).post("/api/coach/ask").set(SARA_AUTH).send({
      question: "Should I tell Earth?",
    });
    const earthReply = CoachAskResponse.parse(earthRes.body);
    expect(earthReply.grounded).toBe(true);
    expect(earthReply.answer).toContain("3 to 22 minutes");

    // 2. Out-of-scope medical/trivia queries MUST abstain cleanly with zero citations
    for (const outOfScope of [
      "Can I take ibuprofen for tooth pain?",
      "What antibiotics treat pneumonia?",
      "How do I bake sourdough bread?",
    ]) {
      const oosRes = await request(app).post("/api/coach/ask").set(SARA_AUTH).send({ question: outOfScope });
      expect(oosRes.status).toBe(200);
      const oosReply = CoachAskResponse.parse(oosRes.body);
      expect(oosReply.grounded).toBe(false);
      expect(oosReply.citations).toEqual([]);
      expect(oosReply.answer).toBe(COACH_NO_SOURCE_REPLY);
      expect(oosReply.banner).toBeUndefined();
    }

    // 3. Red-flag words trigger deterministic urgent banner
    for (const redFlagQ of [
      "I have chest pain and shortness of breath",
      "What if I am fainting?",
    ]) {
      const rfRes = await request(app).post("/api/coach/ask").set(SARA_AUTH).send({ question: redFlagQ });
      expect(rfRes.status).toBe(200);
      const rfReply = CoachAskResponse.parse(rfRes.body);
      expect(rfReply.banner).toEqual({
        level: "urgent",
        label: COACH_URGENT_BANNER_LABEL,
        iconKey: "alert",
      });
    }

    // 4. Explicit missing cardId returns 404; coach never alters today's card state
    const missingCard = await request(app).post("/api/coach/ask").set(SARA_AUTH).send({
      question: "Why is my reaction slower?",
      cardId: "nonexistent-card",
    });
    expect(missingCard.status).toBe(404);
    expect(ErrorBody.parse(missingCard.body).error.code).toBe("not_found");

    const todayAfter = Today.parse((await request(app).get("/api/today").set(SARA_AUTH)).body);
    expect(todayAfter).toEqual(todayBefore);

    // 5. Optional Ollama provider safely abstains offline and falls back deterministically when unreachable
    const ollamaApp = createApp({
      store: createStore({
        runtimeDir: makeTempDir(),
        pinnedNow: NOW,
        coachProvider: new OllamaCoachProvider({
          baseUrl: "http://127.0.0.1:1",
          timeoutMs: 100,
        }),
      }),
    });
    const offlineOos = CoachAskResponse.parse(
      (
        await request(ollamaApp)
          .post("/api/coach/ask").set(SARA_AUTH)
          .send({ question: "Can I take ibuprofen?" })
      ).body,
    );
    expect(offlineOos.grounded).toBe(false);
    expect(offlineOos.provider).toBe("deterministic");
    expect(offlineOos.answer).toBe(COACH_NO_SOURCE_REPLY);

    const offlineFallback = CoachAskResponse.parse(
      (
        await request(ollamaApp)
          .post("/api/coach/ask").set(SARA_AUTH)
          .send({ question: "What should I do today?" })
      ).body,
    );
    expect(offlineFallback.grounded).toBe(true);
    expect(offlineFallback.provider).toBe("deterministic");
  });
});

describe("S03 health routines", () => {
  it("serves hands, tension and blood-pressure routines and resolves card routineId links", async () => {
    const app = createApp({ runtimeDir: makeTempDir(), pinnedNow: NOW });
    const res = await request(app).get("/api/routines").set(SARA_AUTH);
    expect(res.status).toBe(200);
    const bundle = RoutineBundle.parse(res.body);

    expect(bundle.routines.map((r) => r.category).sort()).toEqual([
      "blood-pressure",
      "hands",
      "tension",
    ]);

    const routineIds = new Set(bundle.routines.map((r) => r.id));
    expect(routineIds).toEqual(new Set(["hands-microbreak", "tension-winddown", "bp-quiet-rest"]));

    // Day-120 short sleep card links directly to tension-winddown
    const d120 = day120Fixture();
    const chkRes = await request(app).post("/api/checkins").set(SARA_AUTH).send({
      protocolId: "pvt-b-3min",
      startedAt: d120.checkin!.startedAt,
      sleepHours: d120.sleepHours,
      trials: d120.checkin!.trials,
    });
    expect(chkRes.body.card.links.routineId).toBe("tension-winddown");
    expect(routineIds.has(chkRes.body.card.links.routineId)).toBe(true);
  });
});

describe("S04 send to Earth (preview + confirmed outbox)", () => {
  it("filters selected items in preview without mutating outbox and requires confirm:true to queue", async () => {
    const runtimeDir = makeTempDir();
    const app = createApp({ runtimeDir, pinnedNow: NOW });
    const d120 = day120Fixture();

    await request(app).post("/api/checkins").set(SARA_AUTH).send({
      protocolId: "pvt-b-3min",
      startedAt: d120.checkin!.startedAt,
      sleepHours: d120.sleepHours,
      trials: d120.checkin!.trials,
    });

    // Preview with only reaction + note (sleep, bp, cards unchecked)
    const previewRes = await request(app).post("/api/share/preview").set(SARA_AUTH).send({
      includeReaction: true,
      includeSleep: false,
      includeBp: false,
      includeCards: false,
      days: 3,
      note: "Requesting flight surgeon review after short sleep.",
    });
    expect(previewRes.status).toBe(200);
    const preview = SharePackagePreview.parse(previewRes.body);
    expect(preview.entries.length).toBeGreaterThanOrEqual(1);
    expect(preview.entries.every((e) => e.kind === "reaction")).toBe(true);
    expect(preview.commsDelay.oneWayMinMinutes).toBe(3);
    expect(preview.commsDelay.oneWayMaxMinutes).toBe(22);
    expect(preview.summaryText).toContain("Requesting flight surgeon review after short sleep.");
    expect(preview.disclaimer).toBe(DISCLAIMER);

    // Confirm: false must fail strict schema check
    const unconfirmed = await request(app).post("/api/share").set(SARA_AUTH).send({
      includeReaction: true,
      confirm: false,
    });
    expect(unconfirmed.status).toBe(400);

    // Confirm: true queues packet in local runtime file
    const sendRes = await request(app).post("/api/share").set(SARA_AUTH).send({
      includeReaction: true,
      includeSleep: true,
      includeBp: false,
      includeCards: true,
      days: 2,
      confirm: true,
    });
    expect(sendRes.status).toBe(201);
    const queued = ShareQueuedPackage.parse(sendRes.body);
    expect(queued.status).toBe("queued");
    expect(queued.confirmedByUser).toBe(true);

    const savedRuntime = JSON.parse(readFileSync(path.join(runtimeDir, "sara.json"), "utf8"));
    expect(savedRuntime.outbox).toHaveLength(1);
    expect(savedRuntime.outbox[0].id).toBe(queued.id);
  });
});

describe("S05 check-up reminders", () => {
  it("computes nextDue cleanly and supports GET/PUT /api/reminders + today.nextDue sync", async () => {
    const beforeCheckin = computeReminders({
      launchDate: "2026-07-19",
      missionDay: 120,
      nowIso: "2026-11-15T08:00:00+00:00",
      hasTodayCheckin: false,
      lastBpMissionDay: 118,
    });
    expect(beforeCheckin.nextDue).toBe("2026-11-15T08:00:00+00:00");
    expect(beforeCheckin.items[0]!.overdue).toBe(false);

    const afterCheckin = nextDue({
      launchDate: "2026-07-19",
      missionDay: 120,
      nowIso: "2026-11-15T08:05:00+00:00",
      hasTodayCheckin: true,
      lastBpMissionDay: 118,
    });
    // Day 120 check-in is complete -> next due rolls to Day 121 check-in / Day 121 BP (08:00 < 08:30)
    expect(afterCheckin).toBe("2026-11-16T08:00:00+00:00");

    const app = createApp({ runtimeDir: makeTempDir(), pinnedNow: NOW });
    const remRes = await request(app).get("/api/reminders").set(SARA_AUTH);
    expect(remRes.status).toBe(200);
    const initial = RemindersResponse.parse(remRes.body);
    expect(initial.nextDue).not.toBeNull();

    const todayBefore = Today.parse((await request(app).get("/api/today").set(SARA_AUTH)).body);
    expect(todayBefore.nextDue).toBe(initial.nextDue);

    // Disable reminders -> nextDue becomes null everywhere
    const putRes = await request(app).put("/api/reminders").set(SARA_AUTH).send({
      enabled: false,
      checkinTimeUtc: "09:00",
      bpIntervalDays: 5,
      bpTimeUtc: "10:00",
    });
    expect(putRes.status).toBe(200);
    const updated = RemindersResponse.parse(putRes.body);
    expect(updated.nextDue).toBeNull();

    const todayAfter = Today.parse((await request(app).get("/api/today").set(SARA_AUTH)).body);
    expect(todayAfter.nextDue).toBeNull();

    // Reject bad time format
    const badPut = await request(app).put("/api/reminders").set(SARA_AUTH).send({
      enabled: true,
      checkinTimeUtc: "25:99",
      bpIntervalDays: 3,
      bpTimeUtc: "08:30",
    });
    expect(badPut.status).toBe(400);
  });
});
