import type {
  BpCategory,
  BpInput,
  BpMeasurement,
  BpReading,
  BpSymptom,
  LowSymptom,
  NextAction,
  SevereSymptom,
} from "../schemas";
import { foldHistory, type BaselineEntryInput } from "./baseline";
import { selectBpCard, type CardCatalog } from "./cards";
import {
  BP_ELEVATED_SYS_MIN,
  BP_LOW_DIA_UNDER,
  BP_LOW_SYS_UNDER,
  BP_RETEST_SECONDS,
  BP_SEVERE_DIA_OVER,
  BP_SEVERE_SYS_OVER,
  BP_STAGE1_DIA_MIN,
  BP_STAGE1_SYS_MIN,
  BP_STAGE2_DIA_MIN,
  BP_STAGE2_SYS_MIN,
  BP_SUSTAINED_DAYS,
  LOW_BP_SYMPTOM_IDS,
  SEVERE_BP_SYMPTOM_IDS,
} from "./constants";
import { buildZoneResult } from "./zone";

const SEVERE_SYMPTOM_SET: ReadonlySet<string> = new Set(SEVERE_BP_SYMPTOM_IDS);
const LOW_SYMPTOM_SET: ReadonlySet<string> = new Set(LOW_BP_SYMPTOM_IDS);

export interface BpHistoryEntry {
  missionDay: number;
  effectiveDateTime: string;
  average: BpReading;
}

export interface EvaluateBpOptions {
  catalog: CardCatalog;
  missionDay?: number;
  id?: string;
  subjectId?: string;
  source?: "simulated" | "live";
}

function isSevereSymptom(symptom: BpSymptom): symptom is SevereSymptom {
  return SEVERE_SYMPTOM_SET.has(symptom);
}

function isLowSymptom(symptom: BpSymptom): symptom is LowSymptom {
  return LOW_SYMPTOM_SET.has(symptom);
}

function isStage2OrHigher(reading: Pick<BpReading, "systolic" | "diastolic">): boolean {
  return reading.systolic >= BP_STAGE2_SYS_MIN || reading.diastolic >= BP_STAGE2_DIA_MIN;
}

/**
 * Averages 1-3 blood pressure readings, rounding systolic, diastolic,
 * and optional pulse values half-up to the nearest integer.
 */
export function averageBpReadings(readings: readonly BpReading[]): BpReading {
  if (readings.length === 0) {
    throw new Error("At least one blood pressure reading is required.");
  }

  let systolicSum = 0;
  let diastolicSum = 0;
  let pulseSum = 0;
  let pulseCount = 0;

  for (const reading of readings) {
    systolicSum += reading.systolic;
    diastolicSum += reading.diastolic;
    if (reading.pulse !== undefined) {
      pulseSum += reading.pulse;
      pulseCount += 1;
    }
  }

  const average: BpReading = {
    systolic: Math.round(systolicSum / readings.length),
    diastolic: Math.round(diastolicSum / readings.length),
  };

  if (pulseCount > 0) {
    average.pulse = Math.round(pulseSum / pulseCount);
  }

  return average;
}

/**
 * Classifies an averaged blood pressure reading using AHA/ACC and NHLBI thresholds.
 * Checks severe (>180 or >120), stage2 (>=140 or >=90), low (<90 or <60),
 * stage1 (130-139 or 80-89), elevated (120-129 and <80), then normal (<120 and <80).
 */
export function categorizeBp(reading: Pick<BpReading, "systolic" | "diastolic">): BpCategory {
  const { systolic, diastolic } = reading;

  if (systolic > BP_SEVERE_SYS_OVER || diastolic > BP_SEVERE_DIA_OVER) {
    return "severe";
  }
  if (systolic >= BP_STAGE2_SYS_MIN || diastolic >= BP_STAGE2_DIA_MIN) {
    return "stage2";
  }
  if (systolic < BP_LOW_SYS_UNDER || diastolic < BP_LOW_DIA_UNDER) {
    return "low";
  }
  if (systolic >= BP_STAGE1_SYS_MIN || diastolic >= BP_STAGE1_DIA_MIN) {
    return "stage1";
  }
  if (systolic >= BP_ELEVATED_SYS_MIN) {
    return "elevated";
  }
  return "normal";
}

/**
 * True when a reading is abnormal by an absolute threshold (severe or low category).
 * Such readings are scored but never become part of the personal baseline.
 */
export function isOutsideBpBaselineRange(reading: Pick<BpReading, "systolic" | "diastolic">): boolean {
  const category = categorizeBp(reading);
  return category === "severe" || category === "low";
}

/**
 * Counts consecutive distinct mission days ending at `current` whose latest
 * measurement met or exceeded stage 2 (>= 140 systolic or >= 90 diastolic).
 */
export function countConsecutiveHighBpDays(
  current: BpHistoryEntry,
  history: readonly BpHistoryEntry[],
): number {
  const combined = [...history, current].sort(
    (a, b) =>
      a.missionDay - b.missionDay || a.effectiveDateTime.localeCompare(b.effectiveDateTime),
  );

  // Keep the latest reading for each distinct missionDay.
  const perDayHigh = new Map<number, boolean>();
  for (const item of combined) {
    perDayHigh.set(item.missionDay, isStage2OrHigher(item.average));
  }

  const orderedDays = [...perDayHigh.entries()].sort((a, b) => a[0] - b[0]);
  let streak = 0;
  for (let idx = orderedDays.length - 1; idx >= 0; idx -= 1) {
    if (!orderedDays[idx]![1]) {
      break;
    }
    streak += 1;
  }
  return streak;
}

/**
 * Returns true when the current measurement completes at least 3 distinct
 * measurement days with BP >= 140/90 mmHg.
 */
export function isSustainedHighBp(
  current: BpHistoryEntry,
  history: readonly BpHistoryEntry[],
): boolean {
  return countConsecutiveHighBpDays(current, history) >= BP_SUSTAINED_DAYS;
}

/**
 * Averages readings, classifies BP, evaluates personal systolic z-score,
 * checks 3-day sustained hypertension, and chooses the next action and card.
 */
export function evaluateBp(
  input: BpInput,
  history: readonly BpHistoryEntry[],
  options: EvaluateBpOptions,
): BpMeasurement {
  const maxHistoryDay = history.reduce((max, item) => Math.max(max, item.missionDay), 0);
  const missionDay = options.missionDay ?? maxHistoryDay + 1;

  const average = averageBpReadings(input.readings);
  const category = categorizeBp(average);

  const severeSymptoms = input.symptoms.filter(isSevereSymptom);
  const lowSymptoms = input.symptoms.filter(isLowSymptom);
  const isRetest = Boolean(input.retestOf);

  const currentEntry: BpHistoryEntry = {
    missionDay,
    effectiveDateTime: input.takenAt,
    average,
  };

  const consecutiveHighDays = countConsecutiveHighBpDays(currentEntry, history);
  const sustainedHigh = consecutiveHighDays >= BP_SUSTAINED_DAYS;

  const newBpEntry: BaselineEntryInput = {
    missionDay,
    effectiveDateTime: input.takenAt,
    value: average.systolic,
    excludeFromBaseline: isOutsideBpBaselineRange(average),
  };
  const folded = foldHistory(
    [
      ...history.map((h) => ({
        missionDay: h.missionDay,
        effectiveDateTime: h.effectiveDateTime,
        value: h.average.systolic,
        excludeFromBaseline: isOutsideBpBaselineRange(h.average),
      })),
      newBpEntry,
    ],
    { direction: "two_sided" },
  );
  // The fold sorts by day and timestamp, so find the current entry by reference.
  const lastScored = folded.find((item) => item.entry === newBpEntry)!;

  const zone = buildZoneResult({
    code: "bp-systolic",
    value: average.systolic,
    unit: "mmHg",
    z: lastScored.z,
    zone: lastScored.zone,
    baseline: lastScored.baseline,
    status: lastScored.status,
  });

  const card = selectBpCard(
    {
      kind: "bp",
      systolic: average.systolic,
      diastolic: average.diastolic,
      category,
      severeSymptoms,
      lowSymptoms,
      isRetest,
      sustainedHigh,
      sustainedDays: consecutiveHighDays,
      z: lastScored.z,
    },
    options.catalog,
  );

  let nextAction: NextAction = { type: "none" };
  if (
    card.ruleId === "BP-SEVERE-SYMPTOMS" ||
    card.ruleId === "BP-LOW-SYMPTOMS" ||
    card.ruleId === "BP-SEVERE-CONFIRMED"
  ) {
    nextAction = { type: "alert_crew" };
  } else if (card.ruleId === "BP-SEVERE-RETEST") {
    nextAction = { type: "retest", afterSeconds: BP_RETEST_SECONDS };
  }

  const subjectId = options.subjectId ?? "sara";
  return {
    id: options.id ?? `bp-${subjectId}-${missionDay}`,
    subjectId,
    missionDay,
    effectiveDateTime: input.takenAt,
    readings: [...input.readings],
    average,
    category,
    symptoms: [...input.symptoms],
    ...(input.retestOf ? { retestOf: input.retestOf } : {}),
    zone,
    nextAction,
    card,
    source: options.source ?? "live",
  };
}
