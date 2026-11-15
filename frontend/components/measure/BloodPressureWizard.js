"use client";

/**
 * Guided five-step blood pressure measurement workflow.
 *   1 Prepare → 2 Position cuff → 3 Take measurement → 4 Enter readings → 5 Review & save
 *
 * Readings are manually entered (no device integration) and saved as records.
 * Explicitly not presented as a medical diagnosis.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  Save,
  Siren,
} from "lucide-react";
import CuffPlacementIllustration from "@/components/measure/CuffPlacementIllustration";
import { Card, CardBody } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { buttonClassName } from "@/components/ui/Button";
import { useStore } from "@/lib/data/store";
import { formatDateTime } from "@/lib/utils/format";

const STEPS = [
  {
    key: "prepare",
    title: "Prepare for measurement",
    summary: "Rest quietly for 5 minutes before measuring.",
  },
  {
    key: "position",
    title: "Position the cuff",
    summary: "Place the cuff on your upper arm, 2–3 cm above the elbow.",
  },
  {
    key: "measure",
    title: "Take the measurement",
    summary: "Stay still and relaxed while the cuff inflates.",
  },
  {
    key: "enter",
    title: "Enter your readings",
    summary: "Type systolic, diastolic and pulse values.",
  },
  {
    key: "review",
    title: "Review and save",
    summary: "Confirm the values before saving the record.",
  },
];

const POSITION_VARIANTS = [
  { id: "correct", label: "Correct", hint: "2–3 cm above elbow" },
  { id: "wrong-high", label: "Too high", hint: "On the shoulder" },
  { id: "wrong-low", label: "Too low", hint: "Over the elbow" },
];

const DISCLAIMER =
  "Recorded values are stored as entered. CrewPulse does not diagnose medical conditions — consult the medical officer for interpretation.";

function validateField(value) {
  if (value === "") return "Required";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "Enter a number";
  if (parsed < 0 || parsed > 300) return "Out of range";
  return null;
}

export default function BloodPressureWizard() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const store = useStore();

  const [stepIndex, setStepIndex] = useState(0);
  const [cuffVariant, setCuffVariant] = useState("correct");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [saved, setSaved] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  // Timestamps captured in event handlers (never read during render — the
  // clock is unstable during prerender and would flicker between renders).
  const [reviewedAt, setReviewedAt] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const isFirst = stepIndex === 0;

  const systolicError = validateField(systolic);
  const diastolicError = validateField(diastolic);
  const pulseError = pulse === "" ? null : validateField(pulse);
  const readingsValid = !systolicError && !diastolicError && !pulseError;

  const canAdvance =
    step.key === "enter" ? readingsValid : true;

  const save = () => {
    if (!readingsValid) {
      setShowErrors(true);
      setStepIndex(3);
      return;
    }
    const at = new Date().toISOString();
    store.addMeasurement({
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      pulse: pulse === "" ? null : Number(pulse),
      cuffVariant,
      posture: "Seated, resting 5 min",
      timestamp: at,
    });
    setSavedAt(at);
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
          <h2 className="mt-4 text-xl font-bold">Measurement saved</h2>
          <p className="mt-1.5 text-sm text-muted">
            Your Normal Zone for blood pressure now includes this reading.
          </p>

          <div className="mt-5 w-full rounded-xl border border-line bg-canvas/70 px-4 py-4">
            <p className="text-center font-mono text-3xl font-medium text-navy">
              {systolic}
              <span className="mx-1 text-muted">/</span>
              {diastolic}
              <span className="ml-2 text-sm font-normal text-muted">mmHg</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {pulse ? (
                <StatusBadge tone="neutral" dot={false}>
                  Pulse {pulse} bpm
                </StatusBadge>
              ) : null}
              <StatusBadge tone="info" dot={false}>
                {formatDateTime(savedAt)}
              </StatusBadge>
            </div>
          </div>

          <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => router.push("/normal-zone")}
              className={buttonClassName("primary", "md")}
            >
              View in Normal Zone
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className={buttonClassName("secondary", "md")}
            >
              Back to Today
            </button>
          </div>

          <div className="mt-5 flex w-full items-start gap-2 rounded-lg border border-line bg-canvas/60 px-3 py-2.5 text-left">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-muted">{DISCLAIMER}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-3xl">
      {/* Step header */}
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-nasa-blue">
              Blood pressure measurement
            </p>
            <h2 className="mt-0.5 text-lg font-bold">{step.title}</h2>
          </div>
          <span className="shrink-0 font-mono text-xs text-muted">
            {stepIndex + 1} of {STEPS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((s, index) => (
            <div key={s.key} className="flex-1">
              <motion.div
                className={`h-1.5 rounded-full ${
                  index <= stepIndex ? "bg-nasa-blue" : "bg-line"
                }`}
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.25 }}
              />
              <span
                className={`mt-1 block truncate text-[10px] ${
                  index === stepIndex ? "text-nasa-blue" : "text-muted"
                }`}
              >
                {s.summary}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <CardBody className="px-5 py-6 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.key}
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
          >
            {step.key === "prepare" ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold">Before you begin</h3>
                  <ul className="mt-3 space-y-2.5 text-sm text-muted">
                    {[
                      "Rest quietly for at least 5 minutes.",
                      "Avoid caffeine, food or exercise in the last 30 minutes.",
                      "Empty your bladder if needed.",
                      "Have your cuff and a chair with back support ready.",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-line bg-canvas/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    Measurement context
                  </p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Posture</dt>
                      <dd className="font-mono text-navy">Seated</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Arm</dt>
                      <dd className="font-mono text-navy">Upper, heart level</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Timing</dt>
                      <dd className="font-mono text-navy">Morning preferred</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    Values are entered manually — no device integration is
                    configured in this build.
                  </p>
                </div>
              </div>
            ) : null}

            {step.key === "position" ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold">Position the cuff</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Wrap the cuff around your bare upper arm so the lower edge
                    sits 2–3 cm above the elbow crease. It should be snug — you
                    should fit one finger underneath.
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {POSITION_VARIANTS.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setCuffVariant(variant.id)}
                        aria-pressed={cuffVariant === variant.id}
                        className={`rounded-lg border px-2 py-2.5 text-center transition-colors ${
                          cuffVariant === variant.id
                            ? "border-nasa-blue bg-nasa-blue-soft"
                            : "border-line bg-surface hover:border-nasa-blue/40"
                        }`}
                      >
                        <span
                          className={`block text-xs font-medium ${
                            cuffVariant === variant.id ? "text-nasa-blue" : "text-navy"
                          }`}
                        >
                          {variant.label}
                        </span>
                        <span className="mt-0.5 block font-mono text-[10px] text-muted">
                          {variant.hint}
                        </span>
                      </button>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-muted">
                    Select a position to preview it on the illustration.
                  </p>
                </div>

                <CuffPlacementIllustration variant={cuffVariant} />
              </div>
            ) : null}

            {step.key === "measure" ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold">While measuring</h3>
                  <ul className="mt-3 space-y-2.5 text-sm text-muted">
                    {[
                      "Sit with both feet flat on the floor.",
                      "Rest your arm on a table at heart level.",
                      "Stay still and silent — do not talk.",
                      "Breathe normally until the cuff deflates.",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-nasa-red" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-canvas/60 px-5 py-6 text-center">
                  <motion.span
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-nasa-red-soft text-nasa-red"
                    animate={
                      reduceMotion ? undefined : { scale: [1, 1.08, 1] }
                    }
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <HeartPulse className="h-8 w-8" aria-hidden="true" />
                  </motion.span>
                  <p className="mt-4 text-sm font-medium text-navy">
                    Cuff inflating…
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    This app does not control a cuff — measure with your device,
                    then record the values on the next step.
                  </p>
                </div>
              </div>
            ) : null}

            {step.key === "enter" ? (
              <div>
                <h3 className="text-sm font-semibold">Enter your readings</h3>
                <p className="mt-1.5 text-sm text-muted">
                  Read the values from your monitor and type them below.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <ReadingInput
                    id="systolic"
                    label="Systolic"
                    unit="mmHg"
                    hint="Top number"
                    value={systolic}
                    onChange={setSystolic}
                    error={showErrors ? systolicError : null}
                    placeholder="118"
                  />
                  <ReadingInput
                    id="diastolic"
                    label="Diastolic"
                    unit="mmHg"
                    hint="Bottom number"
                    value={diastolic}
                    onChange={setDiastolic}
                    error={showErrors ? diastolicError : null}
                    placeholder="76"
                  />
                  <ReadingInput
                    id="pulse"
                    label="Pulse (optional)"
                    unit="bpm"
                    hint="If shown on device"
                    value={pulse}
                    onChange={setPulse}
                    error={showErrors ? pulseError : null}
                    placeholder="62"
                  />
                </div>

                <div className="mt-5 flex items-start gap-2 rounded-lg border border-line bg-canvas/60 px-3.5 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
                  <p className="text-xs leading-relaxed text-muted">
                    {DISCLAIMER}
                  </p>
                </div>
              </div>
            ) : null}

            {step.key === "review" ? (
              <div>
                <h3 className="text-sm font-semibold">Review before saving</h3>

                <div className="mt-4 rounded-xl border border-line bg-canvas/70 px-5 py-5">
                  <p className="text-center font-mono text-4xl font-medium text-navy">
                    {systolic || "—"}
                    <span className="mx-1.5 text-muted">/</span>
                    {diastolic || "—"}
                    <span className="ml-2 text-base font-normal text-muted">mmHg</span>
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <StatusBadge tone="neutral" dot={false}>
                      Pulse {pulse || "—"} bpm
                    </StatusBadge>
                    <StatusBadge tone="info" dot={false}>
                      Seated, resting 5 min
                    </StatusBadge>
                    <StatusBadge tone="neutral" dot={false}>
                      {formatDateTime(reviewedAt)}
                    </StatusBadge>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-line px-3 py-2.5">
                    <dt className="text-[10px] uppercase tracking-wider text-muted">
                      Cuff position
                    </dt>
                    <dd className="mt-1 text-sm text-navy">
                      {POSITION_VARIANTS.find((v) => v.id === cuffVariant)?.label}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-line px-3 py-2.5">
                    <dt className="text-[10px] uppercase tracking-wider text-muted">
                      Recorded at
                    </dt>
                    <dd className="mt-1 font-mono text-sm text-navy">
                      {formatDateTime(reviewedAt)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex items-start gap-2 rounded-lg border border-warn/30 bg-warn-soft px-3.5 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
                  <p className="text-xs leading-relaxed text-warn">
                    This reading is a recorded measurement, not a medical
                    diagnosis.
                  </p>
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </CardBody>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => {
            if (isFirst) router.push("/");
            else setStepIndex((index) => index - 1);
          }}
          className={buttonClassName("ghost", "md")}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {isFirst ? "Exit" : "Back"}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/emergency")}
            className={buttonClassName("danger", "sm")}
            aria-label="Open emergency mode"
          >
            <Siren className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Emergency</span>
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={save}
              className={buttonClassName("primary", "md")}
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Save measurement
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (step.key === "enter") setShowErrors(true);
                // Entering the review step: stamp the review time here in the
                // event handler so renders stay pure.
                if (step.key === "enter" && canAdvance) {
                  setReviewedAt(new Date().toISOString());
                }
                setStepIndex((index) => index + 1);
              }}
              disabled={!canAdvance}
              className={buttonClassName("primary", "md")}
            >
              Next
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {!canAdvance ? (
        <p className="border-t border-line bg-canvas/60 px-5 py-2.5 text-center text-xs text-muted sm:px-6">
          Enter valid systolic and diastolic values to continue.
        </p>
      ) : null}
    </Card>
  );
}

function ReadingInput({ id, label, unit, hint, value, onChange, error, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-navy">
        {label}
        <span className="ml-1 font-normal text-muted">({hint})</span>
      </label>
      <div
        className={`mt-1.5 flex items-center rounded-lg border bg-surface transition-colors ${
          error ? "border-nasa-red" : "border-line focus-within:border-nasa-blue"
        }`}
      >
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min="0"
          max="300"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-11 w-full rounded-lg bg-transparent px-3 font-mono text-lg text-navy outline-none placeholder:text-muted/50"
        />
        <span className="pr-3 font-mono text-xs text-muted">{unit}</span>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[11px] text-nasa-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}
