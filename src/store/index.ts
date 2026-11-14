import path from "node:path";
import {
  buildTrend,
  buildZoneResult,
  checkSession,
  evaluateBp,
  foldHistory,
  getProtocol,
  pickMostSevereCard,
  PROTOCOL_ID,
  scorePvt,
  selectReactionCard,
  type BaselineEntryInput,
  type BpHistoryEntry,
} from "../core";
import type {
  BpGuide,
  BpInput,
  BpMeasurement,
  CheckinInput,
  CheckinResponse,
  Mission,
  Procedure,
  ProcedureBundle,
  ProcedureFor,
  Protocol,
  Today,
  Trend,
  TrendQuery,
} from "../schemas";
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

  const missionFile = loadMissionFixture(fixturesDir);
  const subjectFixture = loadSubjectFixture(fixturesDir, subjectId);
  const content = loadContentBundle(contentDir);

  let cachedDay = -1;
  let cachedSimCheckins: CheckinResponse[] = [];
  let cachedSimBp: BpMeasurement[] = [];

  const getCurrentMissionDay = (): number =>
    missionDayFromIso(missionFile.launchDate, getNowIso(options.pinnedNow));

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
      const todayCheckins = runtime.checkins.filter((c) => c.missionDay === todayDay);
      const todayBps = runtime.bp.filter((b) => b.missionDay === todayDay);

      const checkin = todayCheckins.length > 0 ? todayCheckins[todayCheckins.length - 1]! : null;
      const bp = todayBps.length > 0 ? todayBps[todayBps.length - 1]! : null;
      const cards = [...(checkin ? [checkin.card] : []), ...(bp ? [bp.card] : [])];

      return {
        missionDay: todayDay,
        checkin,
        bp,
        card: pickMostSevereCard(cards),
        cards,
        nextDue: null,
      };
    },

    getProtocol(): Protocol {
      return getProtocol();
    },

    createCheckin(input: CheckinInput): CheckinResponse {
      const missionDay = missionDayFromIso(missionFile.launchDate, input.startedAt);
      const runtime = loadRuntime();
      const sim = getHistoricalCheckins(getCurrentMissionDay());
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

      const entries: BaselineEntryInput[] = [
        ...existing.map((c) => ({
          missionDay: c.missionDay,
          effectiveDateTime: c.effectiveDateTime,
          value: c.metrics.meanSpeed,
          qcFlags: c.qcFlags,
        })),
        {
          missionDay,
          effectiveDateTime: input.startedAt,
          value: metrics.meanSpeed,
          qcFlags,
        },
      ];

      const folded = foldHistory(entries, { direction: "lower_is_worse" });
      const last = folded[folded.length - 1]!;

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
          })),
          { direction: isSys ? "two_sided" : "none" },
        );
        return buildTrend(query.code, folded, query.days, {
          subjectId,
          source: resolveTrendSource(all.map((b) => b.source)),
        });
      }

      const runtime = loadRuntime();
      const liveSleepByDay = new Map<number, { value: number; effectiveDateTime: string }>();
      for (const c of runtime.checkins) {
        if (c.sleepHours !== null) {
          liveSleepByDay.set(c.missionDay, {
            value: c.sleepHours,
            effectiveDateTime: c.effectiveDateTime,
          });
        }
      }

      const sleepPoints: Array<BaselineEntryInput & { src: "simulated" | "live" }> = [];
      for (const day of subjectFixture.days) {
        if (day.missionDay >= todayDay) continue;
        const liveOverride = liveSleepByDay.get(day.missionDay);
        if (liveOverride) {
          liveSleepByDay.delete(day.missionDay);
          sleepPoints.push({
            missionDay: day.missionDay,
            effectiveDateTime: liveOverride.effectiveDateTime,
            value: liveOverride.value,
            src: "live",
          });
        } else {
          sleepPoints.push({
            missionDay: day.missionDay,
            effectiveDateTime:
              day.checkin?.startedAt ??
              day.bp?.takenAt ??
              `${missionDateForDay(missionFile.launchDate, day.missionDay)}T08:00:00+00:00`,
            value: day.sleepHours,
            src: "simulated",
          });
        }
      }

      for (const [dayNum, live] of liveSleepByDay.entries()) {
        sleepPoints.push({
          missionDay: dayNum,
          effectiveDateTime: live.effectiveDateTime,
          value: live.value,
          src: "live",
        });
      }

      const folded = foldHistory(sleepPoints, { direction: "none" });
      return buildTrend("sleep-hours", folded, query.days, {
        subjectId,
        source: resolveTrendSource(sleepPoints.map((p) => p.src)),
      });
    },

    getBpGuide(): BpGuide {
      return content.bpGuide;
    },

    createBpMeasurement(input: BpInput): BpMeasurement {
      const missionDay = missionDayFromIso(missionFile.launchDate, input.takenAt);
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
        procedures: forWho === "self" ? content.procedures : [],
      };
    },

    getEmergencyProcedureById(id: string): Procedure | null {
      return content.procedures.find((p) => p.id === id) ?? null;
    },
  };
}

export * from "./clock";
export * from "./runtime";
export * from "./content";
export * from "./fixtures";
