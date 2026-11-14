import { readFileSync } from "node:fs";
import path from "node:path";
import {
  buildZoneResult,
  checkSession,
  evaluateBp,
  foldHistory,
  scorePvt,
  selectReactionCard,
  type BaselineEntryInput,
  type BpHistoryEntry,
  type CardCatalog,
  type ScoredEntry,
} from "../core";
import {
  MissionFile,
  PROTOCOL_ID,
  SubjectFixture,
  type BpMeasurement,
  type CheckinResponse,
  type Trial,
} from "../schemas";

export interface RawCheckinRecord {
  id: string;
  subjectId: string;
  missionDay: number;
  effectiveDateTime: string;
  trials: readonly Trial[];
  sleepHours: number | null;
  source: "simulated" | "live";
  /** Pre-computed response if loaded from runtime store (re-scored at merge if needed). */
  precomputed?: CheckinResponse;
}

export interface CheckinFoldEntry extends BaselineEntryInput {
  id: string;
  subjectId: string;
  effectiveDateTime: string;
  sleepHours: number | null;
  source: "simulated" | "live";
  metrics: ReturnType<typeof scorePvt>;
}

/** Loads and validates `data/fixtures/mission.json`. */
export function loadMissionFixture(fixturesDir: string): MissionFile {
  const raw: unknown = JSON.parse(
    readFileSync(path.join(fixturesDir, "mission.json"), "utf8"),
  );
  return MissionFile.parse(raw);
}

/** Loads and validates `data/fixtures/<subjectId>.json`. */
export function loadSubjectFixture(
  fixturesDir: string,
  subjectId: string,
): SubjectFixture {
  const raw: unknown = JSON.parse(
    readFileSync(path.join(fixturesDir, `${subjectId}.json`), "utf8"),
  );
  return SubjectFixture.parse(raw);
}

function countConsecutiveActDays(
  scored: readonly ScoredEntry<CheckinFoldEntry>[],
  upToIndex: number,
): number {
  const target = scored[upToIndex]!;
  if (target.zone !== "act") {
    return 0;
  }

  // Collapse scored non-flagged entries by distinct missionDay (latest wins).
  const dayZone = new Map<number, ScoredEntry["zone"]>();
  for (let i = 0; i <= upToIndex; i += 1) {
    const item = scored[i]!;
    if ((item.entry.qcFlags?.length ?? 0) === 0) {
      dayZone.set(item.entry.missionDay, item.zone);
    }
  }

  let streak = 0;
  let day = target.entry.missionDay;
  while (dayZone.get(day) === "act") {
    streak += 1;
    day -= 1;
  }
  return streak;
}

/**
 * Runs a chronological list of check-in records (simulated and/or live)
 * through `scorePvt`, `checkSession`, `foldHistory`, and `selectReactionCard`.
 */
export function scoreCheckinRecords(
  records: readonly RawCheckinRecord[],
  catalog: CardCatalog,
): CheckinResponse[] {
  const foldInputs: CheckinFoldEntry[] = records.map((rec) => {
    const metrics = scorePvt(rec.trials);
    const qcFlags = checkSession(rec.trials);
    return {
      id: rec.id,
      subjectId: rec.subjectId,
      missionDay: rec.missionDay,
      effectiveDateTime: rec.effectiveDateTime,
      value: metrics.meanSpeed,
      qcFlags,
      sleepHours: rec.sleepHours,
      source: rec.source,
      metrics,
    };
  });

  const folded = foldHistory(foldInputs, { direction: "lower_is_worse" });

  return folded.map((item, idx) => {
    const consecutiveActDays = countConsecutiveActDays(folded, idx);
    const zone = buildZoneResult({
      code: "reaction-speed",
      value: item.entry.value,
      unit: "1/s",
      z: item.z,
      zone: item.zone,
      baseline: item.baseline,
      status: item.status,
    });
    const card = selectReactionCard(
      {
        kind: "reaction",
        qcFlags: item.entry.qcFlags ?? [],
        zone: item.zone,
        z: item.z,
        lapses: item.entry.metrics.lapses,
        sleepHours: item.entry.sleepHours,
        consecutiveActDays,
      },
      catalog,
    );

    return {
      id: item.entry.id,
      subjectId: item.entry.subjectId,
      missionDay: item.entry.missionDay,
      effectiveDateTime: item.entry.effectiveDateTime,
      protocolId: PROTOCOL_ID,
      metrics: item.entry.metrics,
      sleepHours: item.entry.sleepHours,
      qcFlags: [...(item.entry.qcFlags ?? [])],
      zone,
      source: item.entry.source,
      card,
    };
  });
}

/** Extracts raw simulated check-in records for days before `beforeDay` (or all if omitted). */
export function fixtureToRawCheckins(
  fixture: SubjectFixture,
  beforeDay?: number,
): RawCheckinRecord[] {
  const out: RawCheckinRecord[] = [];
  for (const day of fixture.days) {
    if (beforeDay !== undefined && day.missionDay >= beforeDay) continue;
    if (!day.checkin) continue;
    out.push({
      id: `sim-${fixture.subject.id}-chk-${day.missionDay}`,
      subjectId: fixture.subject.id,
      missionDay: day.missionDay,
      effectiveDateTime: day.checkin.startedAt,
      trials: day.checkin.trials,
      sleepHours: day.sleepHours,
      source: "simulated",
    });
  }
  return out;
}

/** Scores all BP days in a fixture (or `< beforeDay`) sequentially through `evaluateBp`. */
export function scoreFixtureBp(
  fixture: SubjectFixture,
  catalog: CardCatalog,
  beforeDay?: number,
): BpMeasurement[] {
  const history: BpHistoryEntry[] = [];
  const results: BpMeasurement[] = [];

  for (const day of fixture.days) {
    if (beforeDay !== undefined && day.missionDay >= beforeDay) continue;
    if (!day.bp) continue;
    const measured = evaluateBp(
      {
        takenAt: day.bp.takenAt,
        readings: day.bp.readings,
        symptoms: [],
      },
      history,
      {
        catalog,
        missionDay: day.missionDay,
        id: `sim-${fixture.subject.id}-bp-${day.missionDay}`,
        subjectId: fixture.subject.id,
        source: "simulated",
      },
    );
    results.push(measured);
    history.push({
      missionDay: measured.missionDay,
      effectiveDateTime: measured.effectiveDateTime,
      average: measured.average,
    });
  }

  return results;
}

/**
 * Scores an entire `SubjectFixture` (all days, including day 120) through the
 * `src/core` engine without modifying or saving any runtime state.
 */
export function scoreSubjectFixture(
  fixture: SubjectFixture,
  catalog: CardCatalog,
): {
  checkins: CheckinResponse[];
  bp: BpMeasurement[];
} {
  return {
    checkins: scoreCheckinRecords(fixtureToRawCheckins(fixture), catalog),
    bp: scoreFixtureBp(fixture, catalog),
  };
}
