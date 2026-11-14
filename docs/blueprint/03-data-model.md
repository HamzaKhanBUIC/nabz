# Data model and constants

Shapes are written as TypeScript for reading; the real definitions are the zod schemas in `src/schemas/` (F01). Field names are FHIR-inspired, not FHIR-compliant.

## Shapes

```ts
type Zone = "not_scored" | "building" | "in_zone" | "watch" | "act";
//   not_scored: session failed quality checks, or the series has no zone (sleep hours)
//   building:   fewer than 5 valid sessions, so no baseline yet
type Level = "info" | "in_zone" | "watch" | "act" | "urgent";
type Status = { level: Level; label: string; iconKey: "info" | "hourglass" | "check" | "eye" | "alert" | "siren" };
type SourceRef = { id: string; title: string; url: string };   // ids defined in content/sources.json

// Reaction check-in
type Trial = { i: number; isiMs: number; rtMs: number | null; early: boolean };
//   early: true  = tapped before the target appeared (false start); rtMs is null
//   rtMs: null and early: false = no response before the timeout (counts as a lapse)
type CheckinInput = { protocolId: "pvt-b-3min"; startedAt: string; trials: Trial[]; sleepHours?: number };
type PvtMetrics = { stimuli: number; validResponses: number; lapses: number; falseStarts: number;
                    meanSpeed: number; medianRtMs: number | null; performanceScore: number };
type Baseline = { n: number; mean: number | null; sd: number | null; ready: boolean; windowSessions: 14 };
type ZoneResult = { code: string; value: number; unit: string; z: number | null; zone: Zone;
                    baseline: Baseline; status: Status };
type Checkin = { id: string; subjectId: string; missionDay: number; effectiveDateTime: string;
                 protocolId: string; metrics: PvtMetrics; sleepHours: number | null;
                 qcFlags: string[]; zone: ZoneResult; source: "simulated" | "live" };
// raw trials are stored beside the check-in so everything can be re-scored

// Action card
type Card = { id: string; ruleId: string; severity: Level; status: Status; title: string;
              whatChanged: string; whyItMatters: string; whatToDo: string[];
              facts: Record<string, number | string | boolean>;      // the numbers the rule used
              sources: SourceRef[]; disclaimer: "Decision support, not a diagnosis.";
              links?: { emergencyProcedureId?: string; measurement?: "bp"; routineId?: string } };

// Blood pressure
type BpReading = { systolic: number; diastolic: number; pulse?: number };
type BpInput = { takenAt: string; readings: BpReading[]; symptoms: string[]; retestOf?: string };
type BpCategory = "low" | "normal" | "elevated" | "stage1" | "stage2" | "severe";
type NextAction = { type: "none" | "retest" | "alert_crew"; afterSeconds?: number };
type BpMeasurement = { id: string; subjectId: string; missionDay: number; effectiveDateTime: string;
                       readings: BpReading[]; average: BpReading; category: BpCategory;
                       symptoms: string[]; zone: ZoneResult; nextAction: NextAction; card: Card;
                       source: "simulated" | "live" };

// Emergency
type Step = { id: string; text: string; detail?: string; timerSeconds?: number; caution?: string; metronomeBpm?: number };
type Procedure = { id: string; version: number; for: "self" | "crewmate"; title: string;
                   whenToUse: string; steps: Step[]; redFlags: string[];
                   escalation: { text: string; action: "alert_crew" };
                   disclaimer: string; sources: SourceRef[] };

// Routines (S03), Coach (S02), Share to Earth (S04), Reminders (S05)
type Routine = { id: string; version: number; category: "hands" | "tension" | "blood-pressure";
                 title: string; summary: string; durationSeconds: number;
                 steps: Step[]; disclaimer: string; sources: SourceRef[] };
type CoachAskResponse = { cardId: string | null; ruleId: string | null; answer: string; grounded: boolean;
                          citations: SourceRef[]; banner?: Status; suggestedQuestions: string[];
                          disclaimer: "Decision support, not a diagnosis."; provider: "deterministic" | "ollama" };
type SharePackagePreview = { generatedAt: string; missionDay: number; subjectId: string;
                             commsDelay: { oneWayMinMinutes: number; oneWayMaxMinutes: number; nominalMinutes: number; delayNotice: string };
                             selection: { includeReaction: boolean; includeSleep: boolean; includeBp: boolean; includeCards: boolean; days: number };
                             entries: Array<{ id: string; kind: "reaction" | "sleep" | "bp" | "card"; missionDay: number; effectiveDateTime: string; summary: string }>;
                             cards: Card[]; summaryText: string; disclaimer: "Decision support, not a diagnosis." };
type RemindersResponse = { version: 1; schedule: { enabled: boolean; checkinTimeUtc: string; bpIntervalDays: number; bpTimeUtc: string };
                           nextDue: string | null; items: Array<{ kind: "checkin" | "bp"; label: string; dueAt: string; overdue: boolean; reason: string }> };

// Trend
type TrendPoint = { missionDay: number; effectiveDateTime: string; value: number; z: number | null;
                    zone: Zone; baselineMean: number | null; baselineSd: number | null };
type Trend = { code: string; unit: string; subjectId: string; source: "simulated" | "live" | "nasa-osd-569";
               points: TrendPoint[]; band: { ready: boolean; mean: number | null; sd: number | null;
               watchAt: number | null; actAt: number | null }; referenceRange?: { low: number; high: number } };

// Mission
type Mission = { name: string; profile: "mars-transit"; launchDate: string; missionDay: number;
                 commsDelay: { oneWayMinMinutes: number; oneWayMaxMinutes: number };
                 crew: { id: string; name: string; role: string }[] };
```

Errors: `{ error: { code: "invalid_input" | "not_found" | "not_built", message: string, issues?: unknown[], feature?: string } }`.

## Constants (`src/core/constants.ts`)

Sourced. "CHECKS" = `research/CHECKS.md`.

| Constant | Value | Source |
|---|---|---|
| `PVT_DURATION_MS` | 180 000 | CHECKS R2: PVT-B, 3 min (Basner 2011) |
| `ISI_MIN_MS` / `ISI_MAX_MS` | 1 000 / 4 000 | CHECKS R2: 1–4 s including 1 s feedback |
| `LAPSE_MS` | 355 | CHECKS R2 (≥ 355 ms) |
| `FALSE_START_MS` | 100 | CHECKS R2 (< 100 ms or no target) |
| `Z_ACT` | −1.5 | CHECKS R2 addendum: Cognition ISS study, PMC11614644 (z ≤ −1.5) |
| `SHORT_SLEEP_HOURS` | 6 | CHECKS R2 addendum: Jones 2022, PMC8919197 (≤ 6 h slows PVT-B) |
| BP categories | <120 & <80 · 120–129 & <80 · 130–139 or 80–89 · ≥140 or ≥90 | CHECKS R3 (AHA/ACC 2025) |
| `BP_SEVERE` | systolic > 180 or diastolic > 120 | CHECKS R3 |
| `BP_RETEST_SECONDS` | 300 | CHECKS R3 correction (about 5 min, not 1) |
| `BP_SEVERE_SYMPTOMS` | chest pain, shortness of breath, back pain, numbness or weakness, vision change, trouble speaking | CHECKS R3 |
| `BP_LOW` | systolic < 90 or diastolic < 60 | CHECKS R3 addendum: NHLBI ("lower than 90/60") |
| `BP_LOW_SYMPTOMS` | confusion, dizziness or lightheadedness, fainting, cold and sweaty skin, rapid breathing, weak and rapid pulse | CHECKS R3 addendum: NHLBI |
| `BP_SUSTAINED` | ≥ 140/90 | CHECKS #4: OCHMO-STD-100.1A |
| `MARS_ONE_WAY_DELAY_MIN` | 3–22 | CHECKS #15 |

Design choices (no published value; each is one named constant so it can change in one place):

| Constant | Value | Reasoning |
|---|---|---|
| `Z_WATCH` | −1.0 | R2 proposal: an early "heads-up" tier before −1.5 |
| `BASELINE_WINDOW_SESSIONS` | 14 | R2 proposal: rolling two-week window |
| `BASELINE_MIN_SESSIONS` | 5 | R2 proposal: 5–7 rested sessions; PVT has no practice effect |
| Baseline excludes flagged sessions (and two-sided `watch` spikes) | — | Stops flagged checks or severe BP spikes skewing later bands without ratcheting one-sided reaction baselines upward |
| `PERSISTENT_DAYS` | 3 | Three `act` check-ins in a row raise the persistent card |
| `BP_SUSTAINED_READINGS` | 3 | Last 3 measurements on different days all ≥ 140/90 (R3: assess over 3–7 days) |
| `BP_Z_FLAG` | ±1.5 | Mirrors the reaction threshold for "different from your normal" |
| `NO_RESPONSE_TIMEOUT_MS` | 30 000 | Used by the 10-min PVT (R2 #6); not re-checked for PVT-B |
| QC limits | ≥ 20 stimuli; total time within 150–210 s; median RT ≥ 120 ms | Reject broken or scripted sessions |
| `CPR_METRONOME_BPM` | 110 | Midpoint of verified 100–120/min chest compression target (CHECKS R8) |
| `DEFAULT_CHECKIN_REMINDER_UTC` | "08:00" | Daily morning check-in reminder default (design choice, S05) |
| `DEFAULT_BP_REMINDER_UTC` / `DEFAULT_BP_INTERVAL_DAYS` | "08:30" / 3 | Periodic BP check default (design choice, S05; R3 notes periodic checks) |

## Storage

- `data/fixtures/mission.json`, `data/fixtures/<subjectId>.json`: generated, committed, read-only. Holds raw trials per day, sleep hours, BP measurements, and `meta` (seed, generator version, injected events).
- `data/runtime/<subjectId>.json`: entries added through the API. Ignored by git. Written to a temp file, then renamed.
- The server scores fixtures through `src/core` at start-up, so stored summaries can never disagree with the code.
- Clock: `src/store/clock.ts`. Mission day = days since `launchDate` + 1. `MISSION_NOW` (ISO string) pins it; tests always pin it. `launchDate` is 2026-07-19, so day 120 is 2026-11-15.
