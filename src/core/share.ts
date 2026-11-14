import type {
  BpMeasurement,
  Card,
  CheckinResponse,
  ShareEntrySummary,
  SharePackagePreview,
  SharePreviewInput,
} from "../schemas";
import { CARD_DISCLAIMER } from "./constants";

export interface ShareSleepRecord {
  id: string;
  missionDay: number;
  effectiveDateTime: string;
  sleepHours: number;
}

export interface ShareBuildInput {
  subjectId: string;
  missionDay: number;
  nowIso: string;
  commsDelay: { oneWayMinMinutes: number; oneWayMaxMinutes: number };
  checkins: readonly CheckinResponse[];
  sleepRecords: readonly ShareSleepRecord[];
  bpMeasurements: readonly BpMeasurement[];
  selection: SharePreviewInput;
}

function inWindowOrSelected(
  id: string,
  missionDay: number,
  minDay: number,
  entryIdSet: ReadonlySet<string> | null,
): boolean {
  if (entryIdSet) {
    return entryIdSet.has(id);
  }
  return missionDay >= minDay;
}

/**
 * Assembles an inspectable Send-to-Earth telemetry packet from the crewmember's
 * explicit category toggles and optional entry selection. Pure function, zero I/O.
 */
export function buildSharePreview(input: ShareBuildInput): SharePackagePreview {
  const includeReaction = input.selection.includeReaction ?? true;
  const includeSleep = input.selection.includeSleep ?? true;
  const includeBp = input.selection.includeBp ?? true;
  const includeCards = input.selection.includeCards ?? true;
  const days = input.selection.days ?? 3;
  const minDay = Math.max(1, input.missionDay - days + 1);
  const entryIdSet = input.selection.entryIds ? new Set(input.selection.entryIds) : null;

  const entries: ShareEntrySummary[] = [];
  const cards: Card[] = [];
  const seenCardKeys = new Set<string>();

  const pushCardIfNew = (sourceId: string, missionDay: number, effectiveDateTime: string, card: Card) => {
    const cardEntryId = `card-${sourceId}`;
    if (entryIdSet && !entryIdSet.has(cardEntryId) && !entryIdSet.has(sourceId)) {
      return;
    }
    const dedupKey = `${missionDay}:${card.ruleId}:${card.id}`;
    if (seenCardKeys.has(dedupKey)) return;
    seenCardKeys.add(dedupKey);
    cards.push(card);
    entries.push({
      id: cardEntryId,
      kind: "card",
      missionDay,
      effectiveDateTime,
      summary: `Day ${missionDay}: ${card.ruleId} — ${card.title} (${card.status.label})`,
    });
  };

  if (includeReaction) {
    for (const chk of input.checkins) {
      if (!inWindowOrSelected(chk.id, chk.missionDay, minDay, entryIdSet)) continue;
      const zPart = chk.zone.z !== null ? `, z=${chk.zone.z}` : "";
      entries.push({
        id: chk.id,
        kind: "reaction",
        missionDay: chk.missionDay,
        effectiveDateTime: chk.effectiveDateTime,
        summary: `Day ${chk.missionDay}: PVT-B ${chk.metrics.meanSpeed} 1/s, ${chk.metrics.lapses} lapses (${chk.zone.status.label}${zPart})`,
      });
    }
  }

  if (includeSleep) {
    for (const slp of input.sleepRecords) {
      if (!inWindowOrSelected(slp.id, slp.missionDay, minDay, entryIdSet)) continue;
      entries.push({
        id: slp.id,
        kind: "sleep",
        missionDay: slp.missionDay,
        effectiveDateTime: slp.effectiveDateTime,
        summary: `Day ${slp.missionDay}: Sleep ${slp.sleepHours} h`,
      });
    }
  }

  if (includeBp) {
    for (const bp of input.bpMeasurements) {
      if (!inWindowOrSelected(bp.id, bp.missionDay, minDay, entryIdSet)) continue;
      const symptomText =
        bp.symptoms.length > 0 ? `symptoms: ${bp.symptoms.join(", ")}` : "no symptoms";
      entries.push({
        id: bp.id,
        kind: "bp",
        missionDay: bp.missionDay,
        effectiveDateTime: bp.effectiveDateTime,
        summary: `Day ${bp.missionDay}: BP ${bp.average.systolic}/${bp.average.diastolic} mmHg (${bp.category}, ${symptomText})`,
      });
    }
  }

  if (includeCards) {
    for (const chk of input.checkins) {
      if (!inWindowOrSelected(chk.id, chk.missionDay, minDay, entryIdSet)) continue;
      pushCardIfNew(chk.id, chk.missionDay, chk.effectiveDateTime, chk.card);
    }
    for (const bp of input.bpMeasurements) {
      if (!inWindowOrSelected(bp.id, bp.missionDay, minDay, entryIdSet)) continue;
      pushCardIfNew(bp.id, bp.missionDay, bp.effectiveDateTime, bp.card);
    }
  }

  entries.sort(
    (a, b) =>
      b.missionDay - a.missionDay ||
      b.effectiveDateTime.localeCompare(a.effectiveDateTime) ||
      a.id.localeCompare(b.id),
  );

  const { oneWayMinMinutes, oneWayMaxMinutes } = input.commsDelay;
  const nominalMinutes = Math.round((oneWayMinMinutes + oneWayMaxMinutes) / 2);
  const delayNotice = `Earth one-way light-time delay is ${oneWayMinMinutes} to ${oneWayMaxMinutes} minutes. Urgent symptoms must alert a crewmate or medical officer immediately rather than waiting for Earth.`;

  const lines: string[] = [
    "CREWPULSE FLIGHT SURGEON SUMMARY",
    `Crewmember: ${input.subjectId} | Mission Day: ${input.missionDay} | Generated: ${input.nowIso}`,
    `Transmission window: ${oneWayMinMinutes}-${oneWayMaxMinutes} min one-way (~${oneWayMaxMinutes * 2} min max round-trip)`,
    "",
  ];

  if (entries.length === 0) {
    lines.push("Selected entries (0): No entries matched the current selection.");
  } else {
    lines.push(`Selected entries (${entries.length}):`);
    for (const entry of entries) {
      lines.push(`- ${entry.summary}`);
    }
  }

  const trimmedNote = input.selection.note?.trim();
  if (trimmedNote) {
    lines.push("", `Crewmember note: ${trimmedNote}`);
  }

  lines.push("", CARD_DISCLAIMER);

  return {
    generatedAt: input.nowIso,
    missionDay: input.missionDay,
    subjectId: input.subjectId,
    commsDelay: {
      oneWayMinMinutes,
      oneWayMaxMinutes,
      nominalMinutes,
      delayNotice,
    },
    selection: {
      includeReaction,
      includeSleep,
      includeBp,
      includeCards,
      days,
    },
    entries,
    cards,
    summaryText: lines.join("\n"),
    disclaimer: CARD_DISCLAIMER,
  };
}
