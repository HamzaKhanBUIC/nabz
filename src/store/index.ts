import path from "node:path";
import {
  buildEmptyDayFallbackCard,
  buildSharePreview,
  buildTrend,
  buildZoneResult,
  checkSession,
  computeReminders,
  DEFAULT_REMINDER_SCHEDULE,
  evaluateBp,
  foldHistory,
  isOutsideBpBaselineRange,
  getProtocol,
  nextDue,
  pickMostSevereCard,
  PROTOCOL_ID,
  scorePvt,
  selectCoachSnippets,
  selectReactionCard,
  type BaselineEntryInput,
  type BpHistoryEntry,
  type ReminderHistoryContext,
  type ShareSleepRecord,
} from "../core";
import type {
  BpGuide,
  BpInput,
  BpMeasurement,
  CheckinInput,
  CheckinResponse,
  CoachAskInput,
  CoachAskResponse,
  Mission,
  Procedure,
  ProcedureBundle,
  ProcedureFor,
  Protocol,
  ReminderSchedule,
  RemindersResponse,
  RoutineBundle,
  SharePackagePreview,
  SharePreviewInput,
  ShareQueuedPackage,
  ShareSendInput,
  Today,
  Trend,
  TrendQuery,
} from "../schemas";
import { createCoachProvider, type CoachProvider } from "../slots/coach";
import { getNowIso, missionDayFromIso } from "./clock";
import { loadContentBundle } from "./content";
import {
  fixtureToRawCheckins,
  loadMissionFixture,
  loadSubjectFixture,
  scoreCheckinRecords,
  scoreFixtureBp,
} from "./fixtures";
import { loadRuntimeFile, saveRuntimeFile, type RuntimeData } from "./runtime";

export interface CreateStoreOptions {
  dataDir?: string;
  contentDir?: string;
  runtimeDir?: string;
  subjectId?: string;
  pinnedNow?: string;
  coachProvider?: CoachProvider;
}

export interface CrewPulseStore {
  getMission(): Mission;
  getToday(): Today;
  getProtocol(): Protocol;
  createCheckin(input: CheckinInput): CheckinResponse;
  getTrend(query: TrendQuery): Trend;
  getBpGuide(): BpGuide;
  createBpMeasurement(input: BpInput): BpMeasurement;
  getEmergencyProcedures(forWho: ProcedureFor): ProcedureBundle;
  getEmergencyProcedureById(id: string): Procedure | null;
  getRoutines(): RoutineBundle;
  getReminders(): RemindersResponse;
  updateReminders(schedule: ReminderSchedule): RemindersResponse;
  previewShare(input: SharePreviewInput): SharePackagePreview;
  createSharePackage(input: ShareSendInput): ShareQueuedPackage;
  askCoach(input: CoachAskInput): Promise<CoachAskResponse | null>;
}

function resolveTrendSource(sources: readonly ("simulated" | "live")[]): Trend["source"] {
  let hasSim = false;
  let hasLive = false;
  for (const s of sources) {
    if (s === "simulated") hasSim = true;
    if (s === "live") hasLive = true;
  }
  if (hasSim && hasLive) return "mixed";
  if (hasLive) return "live";
  return "simulated";
}

function missionDateForDay(launchDate: string, missionDay: number): string {
  const [yStr, mStr, dStr] = launchDate.split("-");
  const dt = new Date(Date.UTC(Number(yStr), Number(mStr) - 1, Number(dStr) + missionDay - 1));
  return dt.toISOString().slice(0, 10);
}

/** Creates a file-backed store initialized from seeded fixtures, verified content, and runtime logs. */
export function createStore(options: CreateStoreOptions = {}): CrewPulseStore {
  const root = process.cwd();
  const dataDir = options.dataDir ?? path.join(root, "data");
  const fixturesDir = path.join(dataDir, "fixtures");
  const runtimeDir = options.runtimeDir ?? path.join(dataDir, "runtime");
  const contentDir = options.contentDir ?? path.join(root, "content");
  const subjectId = options.subjectId ?? "sara";
  const coachProvider = options.coachProvider ?? createCoachProvider();

  const missionFile = loadMissionFixture(fixturesDir);
  const subjectFixture = loadSubjectFixture(fixturesDir, subjectId);
  const content = loadContentBundle(contentDir);

  let cachedDay = -1;
  let cachedSimCheckins: CheckinResponse[] = [];
  let cachedSimBp: BpMeasurement[] = [];

  const getActiveNowIso = (): string => getNowIso(options.pinnedNow);

  const getCurrentMissionDay = (): number =>
    missionDayFromIso(missionFile.launchDate, getActiveNowIso());

  const ensureSimCache = (beforeDay: number): void => {
    if (cachedDay === beforeDay) return;
    cachedSimCheckins = scoreCheckinRecords(
      fixtureToRawCheckins(subjectFixture, beforeDay),
      content.catalog,
    );
    cachedSimBp = scoreFixtureBp(subjectFixture, content.catalog, beforeDay);
    cachedDay = beforeDay;
  };

  const getHistoricalCheckins = (beforeDay: number): CheckinResponse[] => {
    ensureSimCache(beforeDay);
    return cachedSimCheckins;
  };

  const getHistoricalBp = (beforeDay: number): BpMeasurement[] => {
    ensureSimCache(beforeDay);
    return cachedSimBp;
  };

  const loadRuntime = (): RuntimeData => loadRuntimeFile(runtimeDir, subjectId);

  const getAllCheckins = (): CheckinResponse[] => {
    const todayDay = getCurrentMissionDay();
    const sim = getHistoricalCheckins(todayDay);
    const runtime = loadRuntime();
    return [...sim, ...runtime.checkins].sort(
      (a, b) =>
        a.missionDay - b.missionDay || a.effectiveDateTime.localeCompare(b.effectiveDateTime),
    );
  };

  const getAllBp = (): BpMeasurement[] => {
    const todayDay = getCurrentMissionDay();
    const sim = getHistoricalBp(todayDay);
    const runtime = loadRuntime();
    return [...sim, ...runtime.bp].sort(
      (a, b) =>
        a.missionDay - b.missionDay || a.effectiveDateTime.localeCompare(b.effectiveDateTime),
    );
  };

  const getSleepRecordsWithSource = (
    todayDay: number,
    runtime: RuntimeData,
  ): Array<ShareSleepRecord & { src: "simulated" | "live" }> => {
    const liveSleepByDay = new Map<
      number,
      { id: string; value: number; effectiveDateTime: string }
    >();
    for (const c of runtime.checkins) {
      if (c.sleepHours !== null) {
        liveSleepByDay.set(c.missionDay, {
          id: `slp-${c.id}`,
          value: c.sleepHours,
          effectiveDateTime: c.effectiveDateTime,
        });
      }
    }

    const out: Array<ShareSleepRecord & { src: "simulated" | "live" }> = [];
    for (const day of subjectFixture.days) {
      if (day.missionDay >= todayDay) continue;
      const liveOverride = liveSleepByDay.get(day.missionDay);
      if (liveOverride) {
        liveSleepByDay.delete(day.missionDay);
        out.push({
          id: liveOverride.id,
          missionDay: day.missionDay,
          effectiveDateTime: liveOverride.effectiveDateTime,
          sleepHours: liveOverride.value,
          src: "live",
        });
      } else {
        out.push({
          id: `slp-${subjectId}-${day.missionDay}`,
          missionDay: day.missionDay,
          effectiveDateTime:
            day.checkin?.startedAt ??
            day.bp?.takenAt ??
            `${missionDateForDay(missionFile.launchDate, day.missionDay)}T08:00:00+00:00`,
          sleepHours: day.sleepHours,
          src: "simulated",
        });
      }
    }

    for (const [dayNum, live] of liveSleepByDay.entries()) {
      out.push({
        id: live.id,
        missionDay: dayNum,
        effectiveDateTime: live.effectiveDateTime,
        sleepHours: live.value,
        src: "live",
      });
    }

    return out.sort(
      (a, b) =>
        a.missionDay - b.missionDay || a.effectiveDateTime.localeCompare(b.effectiveDateTime),
    );
  };

  const buildReminderContext = (runtime: RuntimeData): ReminderHistoryContext => {
    const nowIso = getActiveNowIso();
    const missionDay = missionDayFromIso(missionFile.launchDate, nowIso);
    const hasTodayCheckin = runtime.checkins.some((c) => c.missionDay === missionDay);
    const allBp = getAllBp();
    const lastBpMissionDay =
      allBp.length > 0 ? Math.max(...allBp.map((b) => b.missionDay)) : null;
    return {
      launchDate: missionFile.launchDate,
      missionDay,
      nowIso,
      hasTodayCheckin,
      lastBpMissionDay,
    };
  };

  const getTodayCards = (runtime: RuntimeData, todayDay: number) => {
    const todayCheckins = runtime.checkins.filter((c) => c.missionDay === todayDay);
    const todayBps = runtime.bp.filter((b) => b.missionDay === todayDay);
    const checkin = todayCheckins.length > 0 ? todayCheckins[todayCheckins.length - 1]! : null;
    const bp = todayBps.length > 0 ? todayBps[todayBps.length - 1]! : null;
    const cards = [...(checkin ? [checkin.card] : []), ...(bp ? [bp.card] : [])];
    return { checkin, bp, cards, primaryCard: pickMostSevereCard(cards) };
  };

  return {
    getMission(): Mission {
      return {
        name: missionFile.name,
        profile: missionFile.profile,
        launchDate: missionFile.launchDate,
        missionDay: getCurrentMissionDay(),
        commsDelay: missionFile.commsDelay,
        crew: missionFile.crew,
      };
    },

    getToday(): Today {
      const todayDay = getCurrentMissionDay();
      const runtime = loadRuntime();
      const { checkin, bp, cards, primaryCard } = getTodayCards(runtime, todayDay);
      const schedule = runtime.reminders ?? DEFAULT_REMINDER_SCHEDULE;

      return {
        missionDay: todayDay,
        checkin,
        bp,
        card: primaryCard,
        cards,
        nextDue: nextDue(buildReminderContext(runtime), schedule),
      };
    },

    getProtocol(): Protocol {
      return getProtocol();
    },

    createCheckin(input: CheckinInput): CheckinResponse {
      // The server's mission clock decides the day. `startedAt` comes from the browser
      // and is kept only as the timestamp; a wrong browser clock must not move the entry.
      const missionDay = getCurrentMissionDay();
      const runtime = loadRuntime();
      const sim = getHistoricalCheckins(missionDay);
      const existing = [...sim, ...runtime.checkins].sort(
        (a, b) =>
          a.missionDay - b.missionDay || a.effectiveDateTime.localeCompare(b.effectiveDateTime),
      );

      const metrics = scorePvt(input.trials);
      const qcFlags = checkSession(input.trials);
      const sleepHours = input.sleepHours ?? null;

      const sameDayRuntime = runtime.checkins.filter((c) => c.missionDay === missionDay).length;
      const id =
        sameDayRuntime === 0
          ? `chk-${subjectId}-${missionDay}`
          : `chk-${subjectId}-${missionDay}-${sameDayRuntime + 1}`;

      const newEntry: BaselineEntryInput = {
        missionDay,
        effectiveDateTime: input.startedAt,
        value: metrics.meanSpeed,
        qcFlags,
      };
      const entries: BaselineEntryInput[] = [
        ...existing.map((c) => ({
          missionDay: c.missionDay,
          effectiveDateTime: c.effectiveDateTime,
          value: c.metrics.meanSpeed,
          qcFlags: c.qcFlags,
        })),
        newEntry,
      ];

      // The fold sorts by day and timestamp, so the new entry is not always last.
      const folded = foldHistory(entries, { direction: "lower_is_worse" });
      const last = folded.find((item) => item.entry === newEntry)!;

      let consecutiveActDays = 0;
      if (last.zone === "act") {
        const dayZone = new Map<number, string>();
        for (const item of folded) {
          if ((item.entry.qcFlags?.length ?? 0) === 0) {
            dayZone.set(item.entry.missionDay, item.zone);
          }
        }
        let d = missionDay;
        while (dayZone.get(d) === "act") {
          consecutiveActDays += 1;
          d -= 1;
        }
      }

      const zone = buildZoneResult({
        code: "reaction-speed",
        value: metrics.meanSpeed,
        unit: "1/s",
        z: last.z,
        zone: last.zone,
        baseline: last.baseline,
        status: last.status,
      });

      const card = selectReactionCard(
        {
          kind: "reaction",
          qcFlags,
          zone: last.zone,
          z: last.z,
          lapses: metrics.lapses,
          sleepHours,
          consecutiveActDays,
        },
        content.catalog,
      );

      const record: CheckinResponse = {
        id,
        subjectId,
        missionDay,
        effectiveDateTime: input.startedAt,
        protocolId: PROTOCOL_ID,
        metrics,
        sleepHours,
        qcFlags,
        zone,
        source: "live",
        card,
      };

      runtime.checkins.push(record);
      saveRuntimeFile(runtimeDir, subjectId, runtime);
      return record;
    },

    getTrend(query: TrendQuery): Trend {
      const todayDay = getCurrentMissionDay();
      if (query.code === "reaction-speed") {
        const all = getAllCheckins();
        const folded = foldHistory(
          all.map((c) => ({
            missionDay: c.missionDay,
            effectiveDateTime: c.effectiveDateTime,
            value: c.metrics.meanSpeed,
            qcFlags: c.qcFlags,
          })),
          { direction: "lower_is_worse" },
        );
        return buildTrend("reaction-speed", folded, query.days, {
          subjectId,
          source: resolveTrendSource(all.map((c) => c.source)),
        });
      }

      if (query.code === "bp-systolic" || query.code === "bp-diastolic") {
        const all = getAllBp();
        const isSys = query.code === "bp-systolic";
        const folded = foldHistory(
          all.map((b) => ({
            missionDay: b.missionDay,
            effectiveDateTime: b.effectiveDateTime,
            value: isSys ? b.average.systolic : b.average.diastolic,
            excludeFromBaseline: isOutsideBpBaselineRange(b.average),
          })),
          { direction: isSys ? "two_sided" : "none" },
        );
        return buildTrend(query.code, folded, query.days, {
          subjectId,
          source: resolveTrendSource(all.map((b) => b.source)),
        });
      }

      const runtime = loadRuntime();
      const sleepPoints = getSleepRecordsWithSource(todayDay, runtime);
      const folded = foldHistory(
        sleepPoints.map((p) => ({
          missionDay: p.missionDay,
          effectiveDateTime: p.effectiveDateTime,
          value: p.sleepHours,
        })),
        { direction: "none" },
      );
      return buildTrend("sleep-hours", folded, query.days, {
        subjectId,
        source: resolveTrendSource(sleepPoints.map((p) => p.src)),
      });
    },

    getBpGuide(): BpGuide {
      return content.bpGuide;
    },

    createBpMeasurement(input: BpInput): BpMeasurement {
      // As with check-ins: the server's mission clock decides the day, not `takenAt`.
      const missionDay = getCurrentMissionDay();
      const runtime = loadRuntime();
      const existing = getAllBp();
      const history: BpHistoryEntry[] = existing.map((b) => ({
        missionDay: b.missionDay,
        effectiveDateTime: b.effectiveDateTime,
        average: b.average,
      }));

      const sameDayRuntime = runtime.bp.filter((b) => b.missionDay === missionDay).length;
      const id = `bp-${subjectId}-${missionDay}-${sameDayRuntime + 1}`;

      const measurement = evaluateBp(input, history, {
        catalog: content.catalog,
        missionDay,
        id,
        subjectId,
        source: "live",
      });

      runtime.bp.push(measurement);
      saveRuntimeFile(runtimeDir, subjectId, runtime);
      return measurement;
    },

    getEmergencyProcedures(forWho: ProcedureFor): ProcedureBundle {
      return {
        version: content.proceduresVersion,
        procedures: content.procedures.filter((p) => p.for === forWho),
      };
    },

    getEmergencyProcedureById(id: string): Procedure | null {
      return content.procedures.find((p) => p.id === id) ?? null;
    },

    getRoutines(): RoutineBundle {
      return {
        version: content.routinesVersion,
        routines: content.routines,
      };
    },

    getReminders(): RemindersResponse {
      const runtime = loadRuntime();
      const schedule = runtime.reminders ?? DEFAULT_REMINDER_SCHEDULE;
      return computeReminders(buildReminderContext(runtime), schedule);
    },

    updateReminders(schedule: ReminderSchedule): RemindersResponse {
      const runtime = loadRuntime();
      runtime.reminders = schedule;
      saveRuntimeFile(runtimeDir, subjectId, runtime);
      return computeReminders(buildReminderContext(runtime), schedule);
    },

    previewShare(input: SharePreviewInput): SharePackagePreview {
      const nowIso = getActiveNowIso();
      const missionDay = missionDayFromIso(missionFile.launchDate, nowIso);
      const runtime = loadRuntime();
      const checkins = getAllCheckins();
      const sleepRecords = getSleepRecordsWithSource(missionDay, runtime);
      const bpMeasurements = getAllBp();

      return buildSharePreview({
        subjectId,
        missionDay,
        nowIso,
        commsDelay: missionFile.commsDelay,
        checkins,
        sleepRecords,
        bpMeasurements,
        selection: input,
      });
    },

    createSharePackage(input: ShareSendInput): ShareQueuedPackage {
      const nowIso = getActiveNowIso();
      const missionDay = missionDayFromIso(missionFile.launchDate, nowIso);
      const runtime = loadRuntime();
      const pkg = buildSharePreview({
        subjectId,
        missionDay,
        nowIso,
        commsDelay: missionFile.commsDelay,
        checkins: getAllCheckins(),
        sleepRecords: getSleepRecordsWithSource(missionDay, runtime),
        bpMeasurements: getAllBp(),
        selection: input,
      });

      const outbox = runtime.outbox ?? [];
      const queued: ShareQueuedPackage = {
        id: `out-${subjectId}-${missionDay}-${outbox.length + 1}`,
        status: "queued",
        queuedAt: nowIso,
        confirmedByUser: true,
        package: pkg,
      };

      runtime.outbox = [...outbox, queued];
      saveRuntimeFile(runtimeDir, subjectId, runtime);
      return queued;
    },

    async askCoach(input: CoachAskInput): Promise<CoachAskResponse | null> {
      const todayDay = getCurrentMissionDay();
      const runtime = loadRuntime();
      const { cards, primaryCard } = getTodayCards(runtime, todayDay);

      let targetCard = primaryCard;
      let hasActiveCard = primaryCard !== null;

      if (input.cardId) {
        const matched = cards.find(
          (c) => c.id === input.cardId || c.ruleId === input.cardId,
        );
        if (!matched) {
          return null;
        }
        targetCard = matched;
        hasActiveCard = true;
      }

      const card = targetCard ?? buildEmptyDayFallbackCard(content.catalog.sources);
      const linkedRoutine = card.links?.routineId
        ? content.routines.find((r) => r.id === card.links?.routineId)
        : undefined;
      const snippets = selectCoachSnippets(card, input.question, content.coachSnippets);

      const answer = await coachProvider.explain({
        card,
        question: input.question,
        snippets,
        linkedRoutine,
        sourceMap: content.sourceMap,
      });

      return {
        cardId: hasActiveCard ? card.id : null,
        ruleId: hasActiveCard ? card.ruleId : null,
        answer: answer.answer,
        grounded: answer.grounded,
        citations: answer.citations,
        ...(answer.banner ? { banner: answer.banner } : {}),
        suggestedQuestions: answer.suggestedQuestions,
        disclaimer: "Decision support, not a diagnosis.",
        provider: answer.provider,
      };
    },
  };
}

export * from "./clock";
export * from "./runtime";
export * from "./content";
export * from "./fixtures";
export * from "./nasa";
