import type { BpReading, FixtureDay, SubjectFixture, Trial } from "../../src/schemas";
import { SIM_CONFIG, type SimConfig, type SubjectConfig, type SubjectEventSpec } from "./config";
import { createRng, deriveSeed, type Rng } from "./rng";

const TARGET_SESSION_MS = 180_000;
const ISI_MIN_MS = 1000;
const ISI_MAX_MS = 4000;
const LAPSE_MS = 355;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** ISO-8601 UTC timestamp for a 1-indexed missionDay and fixed time of day. */
function isoAtDay(launchDate: string, missionDay: number, timeUtc: string): string {
  const [yStr, mStr, dStr] = launchDate.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  const dt = new Date(Date.UTC(y, m - 1, d + missionDay - 1));
  const datePart = dt.toISOString().slice(0, 10);
  return `${datePart}T${timeUtc}+00:00`;
}

function activeEventsForDay(events: readonly SubjectEventSpec[], day: number): SubjectEventSpec[] {
  return events.filter((e) => day >= e.startDay && day <= e.endDay);
}

/**
 * Computes event-driven sleep override or offset for a given day.
 * Returns null if no sleep event is active.
 */
function sleepEventOverride(events: readonly SubjectEventSpec[], day: number, rng: Rng): number | null {
  for (const ev of events) {
    if (day < ev.startDay || day > ev.endDay) continue;
    if (ev.kind === "short-sleep-week") {
      // Sleep in [4.5, 5.5] hours over the 7-day block.
      return round1(clamp(5.0 + rng.normal(0, 0.25), 4.5, 5.5));
    }
    if (ev.kind === "high-workload") {
      // Days 2 and 3 of the 4-day block are under 5 h; days 1 and 4 are ~5.6 h.
      const offset = day - ev.startDay;
      if (offset === 1 || offset === 2) {
        return round1(clamp(4.7 + rng.normal(0, 0.12), 4.4, 4.9));
      }
      return round1(clamp(5.6 + rng.normal(0, 0.15), 5.3, 5.9));
    }
    if (ev.kind === "short-sleep-before-120") {
      // Two bad nights in a row (scenario choice): about 4.2 h, then about 3.2 h.
      if (day === ev.startDay) {
        return round1(clamp(4.2 + rng.normal(0, 0.1), 4.0, 4.4));
      }
      return round1(clamp(3.2 + rng.normal(0, 0.1), 3.0, 3.4));
    }
  }
  return null;
}

/**
 * Illness RHR elevation kernel: +7 bpm at peak (startDay + 4),
 * rising 4 days prior and decaying over 4 days after (Mishra 2020, CHECKS #13).
 */
function illnessHrDelta(events: readonly SubjectEventSpec[], day: number): number {
  const illness = events.find((e) => e.kind === "illness");
  if (!illness || day < illness.startDay || day > illness.endDay) return 0;
  const peakDay = illness.startDay + 4;
  const dist = Math.abs(day - peakDay);
  const curve = [7, 6, 4.5, 3, 1.5];
  return curve[dist] ?? 0;
}

function generateSleepSeries(subject: SubjectConfig, config: SimConfig): number[] {
  const rng = createRng(deriveSeed(config.seed, `${subject.id}:sleep`));
  const phi = config.ar1Phi.sleep;
  let ar = 0;
  const out: number[] = [];

  for (let day = 1; day <= config.days; day++) {
    ar = phi * ar + rng.normal(0, subject.sleepInnovationSd);
    let val = round1(clamp(subject.sleepMeanHours + ar, 4.5, 8.8));
    const override = sleepEventOverride(subject.events, day, rng);
    if (override !== null) {
      val = override;
    }
    out.push(val);
  }
  return out;
}

function generateRestingHrSeries(subject: SubjectConfig, config: SimConfig): number[] {
  const rng = createRng(deriveSeed(config.seed, `${subject.id}:hr`));
  const phi = config.ar1Phi.hr;
  let ar = 0;
  const out: number[] = [];

  for (let day = 1; day <= config.days; day++) {
    ar = phi * ar + rng.normal(0, 1.4);
    const delta = illnessHrDelta(subject.events, day);
    out.push(Math.round(clamp(subject.restingHrMean + ar + delta, 40, 160)));
  }
  return out;
}

function generateBpSeries(
  subject: SubjectConfig,
  restingHr: readonly number[],
  config: SimConfig,
): Array<FixtureDay["bp"]> {
  const rng = createRng(deriveSeed(config.seed, `${subject.id}:bp`));
  const phi = config.ar1Phi.bp;
  let arSbp = 0;
  let arDbp = 0;
  const out: Array<FixtureDay["bp"]> = [];

  for (let day = 1; day <= config.days; day++) {
    arSbp = phi * arSbp + rng.normal(0, config.bpNoiseMmHg.dayToDaySystolic);
    arDbp = phi * arDbp + rng.normal(0, config.bpNoiseMmHg.dayToDayDiastolic);

    // BP cadence: every 3rd day (1, 4, 7, ..., 118), leaving day 120 open for live check-in.
    if ((day - 1) % config.bpCadenceDays !== 0) {
      out.push(null);
      continue;
    }

    const driftDecay =
      day <= config.bpDriftMmHg.settleAfterDay
        ? (config.bpDriftMmHg.settleAfterDay + 1 - day) / config.bpDriftMmHg.settleAfterDay
        : 0;
    const baseSbp = subject.bpSystolicInFlightMean + config.bpDriftMmHg.systolicStartOffset * driftDecay + arSbp;
    const baseDbp = subject.bpDiastolicInFlightMean + config.bpDriftMmHg.diastolicStartOffset * driftDecay + arDbp;
    const baseHr = restingHr[day - 1] ?? subject.restingHrMean;

    const readings: BpReading[] = [0, 1].map(() => ({
      systolic: Math.round(clamp(baseSbp + rng.normal(0, config.bpNoiseMmHg.withinSessionSystolic), 75, 220)),
      diastolic: Math.round(clamp(baseDbp + rng.normal(0, config.bpNoiseMmHg.withinSessionDiastolic), 45, 140)),
      pulse: Math.round(clamp(baseHr + rng.int(-2, 2), 35, 180)),
    }));

    out.push({
      takenAt: isoAtDay(config.launchDate, day, "08:15:00"),
      readings,
    });
  }
  return out;
}

/**
 * Generates PVT-B trials for one daily check-in targeting a given meanSpeed (1/s),
 * lapse count, and false-start count, while respecting protocol constraints.
 */
function generatePvtTrials(
  targetSpeed: number,
  targetLapses: number,
  targetFalseStarts: number,
  rng: Rng,
): Trial[] {
  const isis: number[] = [];
  let elapsed = 0;
  const expectedRt = Math.round(1000 / clamp(targetSpeed, 2.5, 5.2));
  while (elapsed < TARGET_SESSION_MS - 1500 && isis.length < 120) {
    const isi = rng.int(ISI_MIN_MS, ISI_MAX_MS);
    isis.push(isi);
    elapsed += isi + expectedRt;
  }

  // Reserve up to targetFalseStarts positions as early taps (isi only, no RT added).
  const earlyIndices = new Set<number>();
  const earlySlots = Math.min(targetFalseStarts, Math.max(0, Math.floor(isis.length / 8)));
  while (earlyIndices.size < earlySlots) {
    const idx = rng.int(1, isis.length - 2);
    earlyIndices.add(idx);
  }

  const stimIndices: number[] = [];
  for (let i = 0; i < isis.length; i++) {
    if (!earlyIndices.has(i)) stimIndices.push(i);
  }

  const numStim = stimIndices.length;
  const numLapses = Math.min(targetLapses, Math.max(0, numStim - 5));
  const lapsePositions = new Set<number>();
  while (lapsePositions.size < numLapses) {
    lapsePositions.add(stimIndices[rng.int(0, numStim - 1)]!);
  }

  const lapseRts = new Map<number, number>();
  let lapseSpeedSum = 0;
  for (const pos of lapsePositions) {
    const lapseRt = rng.int(362, targetSpeed < 3.85 ? 540 : 440);
    lapseRts.set(pos, lapseRt);
    lapseSpeedSum += 1000 / lapseRt;
  }

  const nonLapseCount = numStim - numLapses;
  const neededNonLapseSpeed = clamp(
    (numStim * targetSpeed - lapseSpeedSum) / Math.max(1, nonLapseCount),
    2.9,
    5.4,
  );

  const nonLapseRts = new Map<number, number>();
  for (const pos of stimIndices) {
    if (lapsePositions.has(pos)) continue;
    const speedSample = clamp(neededNonLapseSpeed + rng.normal(0, 0.35), 2.86, 6.2);
    const rt = clamp(Math.round(1000 / speedSample), 150, LAPSE_MS - 1);
    nonLapseRts.set(pos, rt);
  }

  // Fine-tune non-lapse RTs by a few ms so the session's realized meanSpeed tracks targetSpeed closely.
  const currentMeanSpeed = () => {
    let sum = lapseSpeedSum;
    for (const rt of nonLapseRts.values()) sum += 1000 / rt;
    return sum / numStim;
  };

  for (let iter = 0; iter < 12; iter++) {
    const diff = targetSpeed - currentMeanSpeed();
    if (Math.abs(diff) <= 0.004) break;
    const step = diff > 0 ? -1 : 1; // lower RT increases speed
    for (const pos of stimIndices) {
      if (lapsePositions.has(pos)) continue;
      const cur = nonLapseRts.get(pos)!;
      const next = clamp(cur + step, 150, LAPSE_MS - 1);
      nonLapseRts.set(pos, next);
      if (Math.abs(targetSpeed - currentMeanSpeed()) <= 0.004) break;
    }
  }

  const trials: Trial[] = [];
  for (let i = 0; i < isis.length; i++) {
    const isiMs = isis[i]!;
    if (earlyIndices.has(i)) {
      trials.push({ i, isiMs, rtMs: null, early: true });
    } else {
      const rtMs = lapseRts.get(i) ?? nonLapseRts.get(i)!;
      trials.push({ i, isiMs, rtMs, early: false });
    }
  }
  return trials;
}

function generateCheckinSeries(
  subject: SubjectConfig,
  sleepHours: readonly number[],
  config: SimConfig,
): Array<FixtureDay["checkin"]> {
  const rng = createRng(deriveSeed(config.seed, `${subject.id}:pvt`));
  const phi = config.ar1Phi.speed;
  let ar = 0;
  let sleepDebt = 0;
  const out: Array<FixtureDay["checkin"]> = [];

  // The generator knows nothing about the app's baseline, z-scores or zones.
  // One rule runs on every day for every person: speed is the personal mean, plus
  // day-to-day noise, minus a penalty for accumulated sleep debt. Events only change
  // how long the person slept. Whatever the rules engine then flags (or misses) is real.
  for (let day = 1; day <= config.days; day++) {
    ar = phi * ar + rng.normal(0, subject.speedInnovationSd);
    const sleep = sleepHours[day - 1]!;
    const deficit = Math.max(0, config.shortSleepThresholdHours - sleep);
    sleepDebt = sleepDebt * config.cumulativeSleepDebtFactor + deficit;

    const speed = clamp(
      subject.speedMean + ar - config.sleepLossSpeedPenaltyPerHour * sleepDebt,
      2.5,
      5.2,
    );

    // About 5% of days are missed. The first 16 days (baseline), event days (ground truth)
    // and the last day (the demo posts it) always have a check-in.
    const events = activeEventsForDay(subject.events, day);
    const protectedDay = day <= 16 || day === config.days || events.length > 0;
    if (!protectedDay && rng.next() < config.missedCheckinRate) {
      out.push(null);
      continue;
    }

    // Slower days carry more lapses and false starts, as a smooth function of the drop.
    const drop = Math.max(0, subject.speedMean - speed);
    const expectedLapses = config.restedLapsesPerSession + config.lapsesPerSpeedDrop * drop;
    const targetLapses = Math.max(0, Math.round(expectedLapses + rng.normal(0, Math.sqrt(expectedLapses))));
    const expectedFalseStarts = 0.5 + 2 * drop;
    const targetFalseStarts = Math.max(0, Math.round(expectedFalseStarts + rng.normal(0, 0.6)));

    out.push({
      startedAt: isoAtDay(config.launchDate, day, "08:00:00"),
      trials: generatePvtTrials(speed, targetLapses, targetFalseStarts, rng),
    });
  }

  return out;
}

export function generateSubjectFixture(subject: SubjectConfig, config: SimConfig = SIM_CONFIG): SubjectFixture {
  const sleepHours = generateSleepSeries(subject, config);
  const restingHr = generateRestingHrSeries(subject, config);
  const bp = generateBpSeries(subject, restingHr, config);
  const checkin = generateCheckinSeries(subject, sleepHours, config);

  const days: FixtureDay[] = [];
  for (let i = 0; i < config.days; i++) {
    days.push({
      missionDay: i + 1,
      sleepHours: sleepHours[i]!,
      restingHr: restingHr[i]!,
      checkin: checkin[i]!,
      bp: bp[i]!,
    });
  }

  return {
    meta: {
      kind: "simulated",
      seed: config.seed,
      generatorVersion: config.generatorVersion,
      events: subject.events.map(({ id, startDay, endDay, description, basis }) => ({
        id,
        startDay,
        endDay,
        description,
        basis,
      })),
    },
    subject: {
      id: subject.id,
      name: subject.name,
      role: subject.role,
    },
    days,
  };
}
