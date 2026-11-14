import type { InjectedEvent, MissionFile } from "../../src/schemas";

export type EventKind = "short-sleep-week" | "illness" | "high-workload" | "short-sleep-before-120";

export type SubjectEventSpec = InjectedEvent & {
  kind: EventKind;
};

export type SubjectConfig = {
  id: string;
  name: string;
  role: string;
  /** Rested sleep mean in hours (anchored around Barger 2014 ISS 6.09 +- 0.67 h). */
  sleepMeanHours: number;
  /** Night-to-night AR(1) innovation SD for sleep (hours). */
  sleepInnovationSd: number;
  /** Rested PVT-B mean response speed in 1/s (anchored to 4.1-4.3 1/s, R2 #11). */
  speedMean: number;
  /** Day-to-day AR(1) innovation SD for reaction speed (1/s). */
  speedInnovationSd: number;
  /** In-flight settled systolic BP (mmHg, after 30-day -8 mmHg drift, Norsk 2015 #7). */
  bpSystolicInFlightMean: number;
  /** In-flight settled diastolic BP (mmHg, after 30-day -9 mmHg drift, Norsk 2015 #7). */
  bpDiastolicInFlightMean: number;
  /** Resting heart rate mean in bpm (anchored around Quer 2020 65.5 +- 7.7 bpm, #10). */
  restingHrMean: number;
  events: SubjectEventSpec[];
};

export type SimConfig = {
  seed: number;
  generatorVersion: string;
  launchDate: string;
  days: number;
  /** Sleep at or below this many hours counts as short (CHECKS R2 addendum, Jones 2022). */
  shortSleepThresholdHours: number;
  /**
   * Speed lost (1/s) per hour of accumulated sleep debt. Assumption, anchored to one
   * published number: 5 nights of 4 h in bed lowers 10-min PVT speed by 0.545 /s
   * (Basner & Dinges 2011, R2 #15). With the carry-over below, 5 such nights build a
   * debt of about 5.05 h, so 0.545 / 5.05 = 0.108.
   */
  sleepLossSpeedPenaltyPerHour: number;
  /** Share of yesterday's sleep debt carried into today (assumption). */
  cumulativeSleepDebtFactor: number;
  /** Lapses in a rested session (R2 #11: median 1 on the 3-min test). */
  restedLapsesPerSession: number;
  /** Extra lapses per 1/s of lost speed (assumption). */
  lapsesPerSpeedDrop: number;
  /** Probability of missing a non-protected daily reaction check-in (~5%). */
  missedCheckinRate: number;
  /** AR(1) persistence coefficient across daily signals. */
  ar1Phi: {
    sleep: number;
    speed: number;
    bp: number;
    hr: number;
  };
  /** Pre-flight to in-flight BP offset over days 1-30 (Norsk 2015, CHECKS #7). */
  bpDriftMmHg: {
    systolicStartOffset: number;
    diastolicStartOffset: number;
    tauDays: number;
    settleAfterDay: number;
  };
  bpCadenceDays: number;
  /**
   * Blood pressure spread in mmHg (assumption; no published within-person value).
   * dayToDay: AR(1) innovation SD. withinSession: SD between the two readings.
   * Together they give a day-to-day systolic SD of about 5 mmHg (CV about 4%),
   * well under the 11% CV that R6 #4 (Juhanoja 2017) links to raised risk.
   */
  bpNoiseMmHg: {
    dayToDaySystolic: number;
    dayToDayDiastolic: number;
    withinSessionSystolic: number;
    withinSessionDiastolic: number;
  };
  mission: MissionFile;
  subjects: SubjectConfig[];
};

export const SIM_CONFIG: SimConfig = {
  seed: 20261115,
  generatorVersion: "2.0.0",
  launchDate: "2026-07-19",
  days: 120,
  shortSleepThresholdHours: 6.0,
  sleepLossSpeedPenaltyPerHour: 0.108,
  cumulativeSleepDebtFactor: 0.65,
  restedLapsesPerSession: 1.0,
  lapsesPerSpeedDrop: 14,
  missedCheckinRate: 0.05,
  ar1Phi: {
    sleep: 0.45,
    speed: 0.25,
    bp: 0.45,
    hr: 0.5,
  },
  bpDriftMmHg: {
    systolicStartOffset: 8,
    diastolicStartOffset: 9,
    tauDays: 8,
    settleAfterDay: 30,
  },
  bpCadenceDays: 3,
  bpNoiseMmHg: {
    dayToDaySystolic: 4.0,
    dayToDayDiastolic: 3.0,
    withinSessionSystolic: 2.5,
    withinSessionDiastolic: 2.0,
  },
  mission: {
    name: "Mars Transit 1",
    profile: "mars-transit",
    launchDate: "2026-07-19",
    commsDelay: {
      oneWayMinMinutes: 3,
      oneWayMaxMinutes: 22,
    },
    crew: [
      { id: "sara", name: "Sara", role: "Commander" },
      { id: "mateo", name: "Mateo", role: "Pilot" },
      { id: "elena", name: "Elena", role: "Medical officer" },
      { id: "kenji", name: "Kenji", role: "Engineer" },
    ],
    otherProfiles: [
      { profile: "station", oneWayDelaySeconds: 1 },
      { profile: "moon", oneWayDelaySeconds: 1.3 },
    ],
  },
  subjects: [
    {
      id: "sara",
      name: "Sara",
      role: "Commander",
      sleepMeanHours: 6.35,
      sleepInnovationSd: 0.25,
      speedMean: 4.22,
      speedInnovationSd: 0.17,
      bpSystolicInFlightMean: 118,
      bpDiastolicInFlightMean: 75,
      restingHrMean: 63,
      events: [
        {
          id: "short-sleep-week",
          kind: "short-sleep-week",
          startDay: 35,
          endDay: 41,
          description: "Seven nights of 4.5-5.5 h sleep causing cumulative reaction slowing.",
          basis: "Van Dongen 2003 (R6 #10)",
        },
        {
          id: "illness",
          kind: "illness",
          startDay: 62,
          endDay: 70,
          description: "Viral-like illness raising resting heart rate by +7 bpm starting 4 days before peak day 66.",
          basis: "Mishra 2020 (CHECKS #13)",
        },
        {
          id: "high-workload",
          kind: "high-workload",
          startDay: 105,
          endDay: 108,
          description: "High-workload block with two nights under 5 h sleep and slower reactions.",
          basis: "R6 #13",
        },
        {
          id: "short-sleep-before-120",
          kind: "short-sleep-before-120",
          startDay: 119,
          endDay: 120,
          description: "Two nights of very short sleep (about 4 h, then about 3 h) before days 119 and 120.",
          basis: "Jones 2022 (CHECKS R2 addendum)",
        },
      ],
    },
    {
      id: "mateo",
      name: "Mateo",
      role: "Pilot",
      sleepMeanHours: 6.15,
      sleepInnovationSd: 0.28,
      speedMean: 4.18,
      speedInnovationSd: 0.17,
      bpSystolicInFlightMean: 122,
      bpDiastolicInFlightMean: 77,
      restingHrMean: 60,
      events: [
        {
          id: "short-sleep-week",
          kind: "short-sleep-week",
          startDay: 50,
          endDay: 56,
          description: "Seven nights of 4.5-5.5 h sleep causing cumulative reaction slowing.",
          basis: "Van Dongen 2003 (R6 #10)",
        },
      ],
    },
    {
      id: "elena",
      name: "Elena",
      role: "Medical officer",
      sleepMeanHours: 6.3,
      sleepInnovationSd: 0.25,
      speedMean: 4.26,
      speedInnovationSd: 0.16,
      bpSystolicInFlightMean: 116,
      bpDiastolicInFlightMean: 74,
      restingHrMean: 68,
      events: [
        {
          id: "illness",
          kind: "illness",
          startDay: 78,
          endDay: 86,
          description: "Viral-like illness raising resting heart rate by +7 bpm starting 4 days before peak day 82.",
          basis: "Mishra 2020 (CHECKS #13)",
        },
      ],
    },
    {
      id: "kenji",
      name: "Kenji",
      role: "Engineer",
      sleepMeanHours: 6.05,
      sleepInnovationSd: 0.28,
      speedMean: 4.14,
      speedInnovationSd: 0.17,
      bpSystolicInFlightMean: 124,
      bpDiastolicInFlightMean: 78,
      restingHrMean: 66,
      events: [
        {
          id: "high-workload",
          kind: "high-workload",
          startDay: 92,
          endDay: 95,
          description: "High-workload block with two nights under 5 h sleep and slower reactions.",
          basis: "R6 #13",
        },
      ],
    },
  ],
};
