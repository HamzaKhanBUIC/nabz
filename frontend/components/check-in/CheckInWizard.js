"use client";

/**
 * Guided check-in flow:
 *   Step 1/3 Reaction test → Step 2/3 Sleep hours → Step 3/3 Mood → Save.
 *
 * Persists one combined check-in record to the store; charts update from it.
 */

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Moon,
  Save,
} from "lucide-react";
import ReactionTest from "@/components/check-in/ReactionTest";
import MoodSelector, { moodLabel } from "@/components/check-in/MoodSelector";
import { Card, CardBody } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { buttonClassName } from "@/components/ui/Button";
import { useStore } from "@/lib/data/store";

const STEPS = [
  { key: "reaction", label: "Reaction", icon: Activity, title: "Reaction check-in" },
  { key: "sleep", label: "Sleep", icon: Moon, title: "How long did you sleep?" },
  { key: "mood", label: "Mood", icon: Check, title: "How is your mood?" },
];

const SLEEP_PRESETS = [
  { hours: 5.5, label: "5.5 h" },
  { hours: 6, label: "6 h" },
  { hours: 6.5, label: "6.5 h" },
  { hours: 7, label: "7 h" },
  { hours: 7.5, label: "7.5 h" },
  { hours: 8, label: "8 h" },
  { hours: 9, label: "9 h" },
];

export default function CheckInWizard() {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const store = useStore();

  const [stepIndex, setStepIndex] = useState(0);
  const [reactionMs, setReactionMs] = useState(null);
  const [sleepHours, setSleepHours] = useState(null);
  const [customSleep, setCustomSleep] = useState("");
  const [mood, setMood] = useState(null);
  const [saved, setSaved] = useState(false);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const cancel = useCallback(() => {
    if (window.history.length > 1) router.push(pathname === "/" ? "/check-in" : "/");
    else router.push("/");
  }, [router, pathname]);

  const canAdvance =
    (step.key === "reaction" && reactionMs !== null) ||
    (step.key === "sleep" && sleepHours !== null) ||
    (step.key === "mood" && mood !== null);

  const handleCustomSleep = (value) => {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 24) {
      setSleepHours(parsed);
    } else {
      setSleepHours(null);
    }
  };

  const save = () => {
    store.addCheckIn({
      reactionTimeMs: reactionMs,
      sleepHours,
      mood,
    });
    setSaved(true);
  };

  if (saved) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardBody className="flex flex-col items-center px-6 py-10 text-center">
          <motion.span
            initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-ok-soft text-ok"
          >
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </motion.span>
          <h2 className="mt-4 text-xl font-bold">Check-in saved</h2>
          <p className="mt-1.5 text-sm text-muted">
            Your Normal Zone and dashboards now include this record.
          </p>

          <dl className="mt-5 grid w-full grid-cols-3 gap-3">
            <div className="rounded-lg border border-line bg-canvas/70 px-2 py-3">
              <dt className="text-[10px] uppercase tracking-wider text-muted">
                Reaction
              </dt>
              <dd className="mt-1 font-mono text-lg font-medium text-navy">
                {reactionMs}
                <span className="ml-1 text-[10px] font-normal text-muted">ms</span>
              </dd>
            </div>
            <div className="rounded-lg border border-line bg-canvas/70 px-2 py-3">
              <dt className="text-[10px] uppercase tracking-wider text-muted">Sleep</dt>
              <dd className="mt-1 font-mono text-lg font-medium text-navy">
                {sleepHours}
                <span className="ml-1 text-[10px] font-normal text-muted">h</span>
              </dd>
            </div>
            <div className="rounded-lg border border-line bg-canvas/70 px-2 py-3">
              <dt className="text-[10px] uppercase tracking-wider text-muted">Mood</dt>
              <dd className="mt-1 font-mono text-lg font-medium text-navy">
                {mood}
                <span className="ml-1 text-[10px] font-normal text-muted">/5</span>
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => router.push("/normal-zone")}
              className={buttonClassName("primary", "md")}
            >
              View Normal Zone
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className={buttonClassName("secondary", "md")}
            >
              Back to Today
            </button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {STEPS.map((s, index) => {
              const StepIcon = s.icon;
              const state =
                index < stepIndex ? "done" : index === stepIndex ? "active" : "todo";
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-medium transition-colors ${
                      state === "done"
                        ? "border-ok bg-ok text-white"
                        : state === "active"
                          ? "border-nasa-blue bg-nasa-blue text-white"
                          : "border-line bg-canvas text-muted"
                    }`}
                    aria-current={state === "active" ? "step" : undefined}
                  >
                    {state === "done" ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <StepIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </span>
                  <span
                    className={`hidden text-xs font-medium sm:inline ${
                      state === "todo" ? "text-muted" : "text-navy"
                    }`}
                  >
                    {s.label}
                  </span>
                  {index < STEPS.length - 1 ? (
                    <span
                      className={`mx-1 hidden h-px w-8 sm:block ${
                        index < stepIndex ? "bg-ok" : "bg-line"
                      }`}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
          <span className="shrink-0 font-mono text-xs text-muted">
            {stepIndex + 1} of {STEPS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
          <motion.div
            className="h-full rounded-full bg-nasa-blue"
            initial={false}
            animate={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Step body */}
      <CardBody className="px-5 py-6 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.key}
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
          >
            {step.key === "reaction" ? (
              <>
                <h2 className="text-center text-xl font-bold">Reaction check-in</h2>
                <p className="mb-4 mt-1 text-center text-sm text-muted">
                  Measure your response time honestly — the result is recorded
                  exactly as measured.
                </p>
                <ReactionTest
                  stepLabel={`Step ${stepIndex + 1} of ${STEPS.length}`}
                  onResult={(ms) => setReactionMs(ms)}
                />
                {reactionMs !== null ? (
                  <p className="mt-3 text-center">
                    <StatusBadge tone="ok">
                      {reactionMs} ms recorded
                    </StatusBadge>
                  </p>
                ) : null}
              </>
            ) : null}

            {step.key === "sleep" ? (
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-nasa-blue">
                  Step {stepIndex + 1} of {STEPS.length}
                </p>
                <h2 className="text-xl font-bold">How long did you sleep?</h2>
                <p className="mt-1.5 text-sm text-muted">
                  Record your total sleep from the last rest period.
                </p>

                <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {SLEEP_PRESETS.map((preset) => (
                    <button
                      key={preset.hours}
                      type="button"
                      onClick={() => {
                        setSleepHours(preset.hours);
                        setCustomSleep("");
                      }}
                      aria-pressed={sleepHours === preset.hours && customSleep === ""}
                      className={`rounded-lg border py-3 font-mono text-sm transition-colors ${
                        sleepHours === preset.hours && customSleep === ""
                          ? "border-nasa-blue bg-nasa-blue-soft text-nasa-blue"
                          : "border-line bg-surface text-navy hover:border-nasa-blue/40"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <label className="mt-4 block">
                  <span className="text-xs font-medium text-muted">
                    Or enter a custom value (hours)
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    inputMode="decimal"
                    value={customSleep}
                    onChange={(event) => {
                      setCustomSleep(event.target.value);
                      handleCustomSleep(event.target.value);
                    }}
                    placeholder="e.g. 6.5"
                    className="mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 font-mono text-sm text-navy outline-none transition-colors focus:border-nasa-blue"
                  />
                </label>

                <p className="mt-3 font-mono text-sm text-navy" aria-live="polite">
                  {sleepHours !== null ? (
                    <>
                      Selected: <span className="text-nasa-blue">{sleepHours} h</span>
                    </>
                  ) : (
                    <span className="text-muted">No value selected yet</span>
                  )}
                </p>
              </div>
            ) : null}

            {step.key === "mood" ? (
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-nasa-blue">
                  Step {stepIndex + 1} of {STEPS.length}
                </p>
                <h2 className="text-xl font-bold">How is your mood?</h2>
                <p className="mt-1.5 text-sm text-muted">
                  Pick the option that best matches how you feel right now.
                </p>

                <div className="mt-5">
                  <MoodSelector value={mood} onMood={setMood} />
                </div>

                <p className="mt-4 text-center" aria-live="polite">
                  {mood ? (
                    <StatusBadge tone="info">
                      Mood {mood}/5 · {moodLabel(mood)}
                    </StatusBadge>
                  ) : (
                    <span className="text-sm text-muted">No mood selected yet</span>
                  )}
                </p>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </CardBody>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => {
            if (stepIndex === 0) cancel();
            else setStepIndex((index) => index - 1);
          }}
          className={buttonClassName("ghost", "md")}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {stepIndex === 0 ? "Cancel" : "Back"}
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={save}
            disabled={!canAdvance}
            className={buttonClassName("primary", "md")}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Save check-in
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStepIndex((index) => index + 1)}
            disabled={!canAdvance}
            className={buttonClassName("primary", "md")}
          >
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {!canAdvance ? (
        <p className="border-t border-line bg-canvas/60 px-5 py-2.5 text-center text-xs text-muted sm:px-6">
          Complete this step to continue.
        </p>
      ) : null}
    </Card>
  );
}
