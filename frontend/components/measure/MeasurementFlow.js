"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import BackLink from "@/components/ui/BackLink";
import Button, { buttonClassName } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import InstructionStep from "@/components/ui/InstructionStep";
import MetricTile from "@/components/ui/MetricTile";
import StatusBadge from "@/components/ui/StatusBadge";
import StepIndicator from "@/components/ui/StepIndicator";
import CuffPlacementIllustration from "@/components/measure/CuffPlacementIllustration";
import ClinicalActionCard from "@/components/dashboard/ClinicalActionCard";
import { iconNameForKey, statusToBadgeTone } from "@/lib/api";
import { useStore } from "@/lib/data/store";
import { makeId } from "@/lib/utils/format";

export const MEASUREMENTS = [
  {
    id: "blood-pressure",
    title: "Blood pressure",
    subtitle: "8-step AHA/microgravity guided protocol, 5-min rest timer & symptom screen",
    icon: "monitor_heart",
    href: "/measure/blood-pressure",
  },
];

export function measurementById(id) {
  return MEASUREMENTS.find((m) => m.id === id) || null;
}

const BP_CATEGORY_LABELS = {
  low: "Low (< 90 / < 60 mmHg)",
  normal: "Normal (< 120 and < 80 mmHg)",
  elevated: "Elevated (120-129 / < 80 mmHg)",
  stage1: "Stage 1 high (130-139 or 80-89 mmHg)",
  stage2: "Stage 2 high (>= 140 or >= 90 mmHg)",
  severe: "Severe high (> 180 or > 120 mmHg)",
};

function formatClock(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function CountdownControl({ initialSeconds, label }) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || remaining <= 0) return undefined;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, remaining]);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span
        aria-live="polite"
        className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-canvas px-3 py-1 tabular-nums text-xs font-semibold text-primary"
      >
        <Icon name="timer" size={14} className="text-accent" />
        {remaining === 0 ? `${label}: Complete` : `${label}: ${formatClock(remaining)}`}
      </span>
      <button
        type="button"
        onClick={() => setRunning((r) => !r)}
        disabled={remaining === 0}
        className="rounded-md border border-line bg-raised px-2.5 py-1 text-xs font-medium text-primary hover:bg-hover disabled:opacity-50"
      >
        {running ? "Pause" : remaining === initialSeconds ? "Start timer" : "Resume"}
      </button>
      {remaining !== initialSeconds ? (
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setRemaining(initialSeconds);
          }}
          className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-secondary hover:bg-hover"
        >
          Reset
        </button>
      ) : null}
    </div>
  );
}

const VITAL_TITLES = { "heart-rate": "Resting heart rate", spo2: "Oxygen level (SpO2)" };

/** E07: heart rate and SpO2 checks returned by the API. Scoring is server-side; this only renders. */
function VitalsPanel({ vitals }) {
  return (
    <section
      aria-labelledby="vitals-title"
      className="rounded-lg border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id="vitals-title" className="t-h3 text-primary">
        Pulse and oxygen
      </h2>
      <ul className="mt-4 divide-y divide-line">
        {vitals.map((v) => (
          <li key={v.code} className="py-4 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-secondary">{VITAL_TITLES[v.code] || v.code}</p>
              <StatusBadge tone={statusToBadgeTone(v.status.level)} dot={false}>
                <Icon name={iconNameForKey(v.status.iconKey)} size={14} />
                <span>{v.status.label}</span>
              </StatusBadge>
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-primary">
              {v.value}
              <span className="ml-1 text-sm font-medium text-muted">{v.unit === "%" ? "%" : "bpm"}</span>
            </p>
            <p className="mt-1 text-sm leading-6 text-secondary">{v.message}</p>
            <p className="mt-2 text-xs text-muted">
              Sources:{" "}
              {v.sources.map((s, i) => (
                <span key={s.id}>
                  {i > 0 ? ", " : ""}
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-accent underline-offset-2 hover:underline">
                    {s.title}
                  </a>
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-line pt-3 text-xs text-muted">Decision support, not a diagnosis.</p>
    </section>
  );
}

export default function MeasurementFlow() {
  const { bpGuide, submitBpMeasurement } = useStore();
  const [step, setStep] = useState(1); // 1: Prep | 2: Readings | 3: Symptoms | 4: Result
  const [doneSteps, setDoneSteps] = useState({});
  const [readings, setReadings] = useState([
    { key: "r1", systolic: "118", diastolic: "76", pulse: "68" },
  ]);
  const [spo2, setSpo2] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  const [retestOf, setRetestOf] = useState(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState(null);

  const stepHeadingRef = useRef(null);
  const baseId = useId();

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [step]);

  const guideSteps = bpGuide?.steps || [];
  const prepSteps = guideSteps.slice(0, 6);
  const readingStepOne = guideSteps.find((s) => s.id === "reading-1");
  const readingStepTwo = guideSteps.find((s) => s.id === "reading-2");
  const severeSymptoms = bpGuide?.severeSymptoms || [];
  const lowSymptoms = bpGuide?.lowSymptoms || [];

  const toggleStepDone = (id) => {
    setDoneSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateReading = (idx, field, value) => {
    setReadings((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    );
  };

  const addReading = () => {
    if (readings.length >= 3) return;
    setReadings((prev) => [
      ...prev,
      { key: makeId("r"), systolic: "", diastolic: "", pulse: "" },
    ]);
  };

  const removeReading = (idx) => {
    if (readings.length <= 1) return;
    setReadings((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleSymptom = (id) => {
    setSymptoms((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const validateReadings = () => {
    const parsed = [];
    for (let i = 0; i < readings.length; i += 1) {
      const r = readings[i];
      const sys = Number(r.systolic);
      const dia = Number(r.diastolic);
      const pul = r.pulse === "" ? undefined : Number(r.pulse);

      if (!Number.isInteger(sys) || sys < 40 || sys > 300) {
        return { error: `Reading ${i + 1}: Systolic must be a whole number (40 to 300 mmHg).` };
      }
      if (!Number.isInteger(dia) || dia < 20 || dia > 200) {
        return { error: `Reading ${i + 1}: Diastolic must be a whole number (20 to 200 mmHg).` };
      }
      if (pul !== undefined && (!Number.isInteger(pul) || pul < 20 || pul > 250)) {
        return { error: `Reading ${i + 1}: Pulse must be a whole number (20 to 250 bpm).` };
      }
      parsed.push(
        pul === undefined
          ? { systolic: sys, diastolic: dia }
          : { systolic: sys, diastolic: dia, pulse: pul },
      );
    }
    if (spo2 !== "") {
      const ox = Number(spo2);
      if (!Number.isInteger(ox) || ox < 50 || ox > 100) {
        return { error: "Oxygen level must be a whole number (50 to 100%)." };
      }
    }
    return { parsed };
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const check = validateReadings();
    if (check.error) {
      setErrorMessage(check.error);
      setStep(2);
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    try {
      const payload = {
        takenAt: new Date().toISOString(),
        readings: check.parsed,
        ...(spo2 !== "" ? { spo2: Number(spo2) } : {}),
        symptoms,
        ...(retestOf ? { retestOf } : {}),
      };
      const res = await submitBpMeasurement(payload);
      setResult(res);
      setStep(4);
    } catch (err) {
      setErrorMessage(err?.message || "Failed to record blood pressure.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <BackLink href="/measure">Measurements</BackLink>

      <div>
        <h1 className="t-h1 mt-1 text-primary">Blood pressure guide</h1>
        <p className="mt-1 text-sm text-secondary">
          {retestOf ? `Follow-up retest (${retestOf}). ` : ""}Follow the AHA + microgravity preparation steps, log 1 to 3 readings, and check acute symptoms.
        </p>
      </div>

      <StepIndicator step={step} total={4} />

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-lg border border-emergency/50 bg-emergency/10 px-4 py-3 text-sm text-primary"
        >
          {errorMessage}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <Card>
            <CardHeader
              title={
                <span ref={stepHeadingRef} tabIndex={-1}>
                  Step 1: Prepare & rest 5 minutes
                </span>
              }
              subtitle="Tap each preparation step to check it off before inflating the cuff."
            />

            <CardBody>
              <div className="space-y-3">
                {prepSteps.length === 0 ? (
                  <p className="text-sm text-muted">Loading blood pressure guide...</p>
                ) : (
                  prepSteps.map((s, index) => (
                    <div key={s.id} className="space-y-1.5">
                      <InstructionStep
                        number={index + 1}
                        done={Boolean(doneSteps[s.id])}
                        onToggle={() => toggleStepDone(s.id)}
                      >
                        <span>{s.text}</span>
                      </InstructionStep>
                      <div className="pl-4">
                        {s.detail ? (
                          <p className="text-xs leading-5 text-secondary">{s.detail}</p>
                        ) : null}
                        {s.adaptation ? (
                          <span className="mt-1 inline-block rounded-pill border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
                            Microgravity adaptation
                          </span>
                        ) : null}
                        {s.timerSeconds ? (
                          <CountdownControl
                            key={`${s.id}:${s.timerSeconds}`}
                            initialSeconds={s.timerSeconds}
                            label="Quiet rest timer"
                          />
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {bpGuide ? (
                <div className="mt-5 border-t border-line pt-4 text-xs text-muted">
                  <p className="font-medium">{bpGuide.disclaimer}</p>
                  <div className="mt-1.5 flex flex-wrap gap-3">
                    {bpGuide.sources?.map((src) => (
                      <a
                        key={src.id}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent underline-offset-2 hover:underline"
                      >
                        {src.title}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setErrorMessage("");
                    setStep(2);
                  }}
                >
                  Continue to readings
                  <Icon name="arrow_forward" size={18} />
                </Button>
              </div>
            </CardBody>
          </Card>

          <div className="space-y-4">
            <CuffPlacementIllustration variant="correct" />
            <p className="text-xs leading-5 text-muted">
              Bare skin cuff 2 to 3 cm above the elbow crease, supported at heart level.
            </p>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader
            title={
              <span ref={stepHeadingRef} tabIndex={-1}>
                Step 2: Record 1 to 3 readings
              </span>
            }
            subtitle={
              readingStepOne?.text ||
              "Take your first reading. If possible, wait 1 minute and add a second reading to average."
            }
          />

          <CardBody className="space-y-5">
            {readingStepTwo?.timerSeconds ? (
              <div className="rounded-md border border-line bg-raised p-4">
                <p className="text-xs font-medium text-secondary">
                  {readingStepTwo.text}
                </p>
                <CountdownControl
                  key={`reading2:${readingStepTwo.timerSeconds}`}
                  initialSeconds={readingStepTwo.timerSeconds}
                  label="Wait between readings"
                />
              </div>
            ) : null}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const check = validateReadings();
                if (check.error) {
                  setErrorMessage(check.error);
                  return;
                }
                setErrorMessage("");
                setStep(3);
              }}
              className="space-y-4"
            >
              {readings.map((row, idx) => (
                <fieldset
                  key={row.key}
                  className="rounded-md border border-line bg-raised p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <legend className="text-sm font-semibold text-primary">
                      Reading {idx + 1}
                    </legend>
                    {readings.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeReading(idx)}
                        className="inline-flex min-h-8 cursor-pointer items-center rounded-md px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-hover hover:text-emergency"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor={`${baseId}-sys-${idx}`}
                        className="block text-xs font-medium text-secondary"
                      >
                        Systolic (mmHg) *
                      </label>
                      <input
                        id={`${baseId}-sys-${idx}`}
                        name={`systolic_${idx}`}
                        type="number"
                        min={40}
                        max={300}
                        step={1}
                        required
                        value={row.systolic}
                        onChange={(e) => updateReading(idx, "systolic", e.target.value)}
                        className="mt-1.5 w-full rounded-md border border-line bg-canvas px-3.5 py-2.5 text-sm text-primary tabular-nums transition-colors focus:border-accent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`${baseId}-dia-${idx}`}
                        className="block text-xs font-medium text-secondary"
                      >
                        Diastolic (mmHg) *
                      </label>
                      <input
                        id={`${baseId}-dia-${idx}`}
                        name={`diastolic_${idx}`}
                        type="number"
                        min={20}
                        max={200}
                        step={1}
                        required
                        value={row.diastolic}
                        onChange={(e) => updateReading(idx, "diastolic", e.target.value)}
                        className="mt-1.5 w-full rounded-md border border-line bg-canvas px-3.5 py-2.5 text-sm text-primary tabular-nums transition-colors focus:border-accent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`${baseId}-pul-${idx}`}
                        className="block text-xs font-medium text-secondary"
                      >
                        Pulse (bpm, optional)
                      </label>
                      <input
                        id={`${baseId}-pul-${idx}`}
                        name={`pulse_${idx}`}
                        type="number"
                        min={20}
                        max={250}
                        step={1}
                        value={row.pulse}
                        onChange={(e) => updateReading(idx, "pulse", e.target.value)}
                        className="mt-1.5 w-full rounded-md border border-line bg-canvas px-3.5 py-2.5 text-sm text-primary tabular-nums transition-colors focus:border-accent focus:outline-none"
                      />
                    </div>
                  </div>
                </fieldset>
              ))}

              {readings.length < 3 ? (
                <button
                  type="button"
                  onClick={addReading}
                  className="interactive-surface inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md border border-line bg-raised px-3.5 py-2 text-xs font-semibold text-accent"
                >
                  <Icon name="add" size={16} />
                  Add reading {readings.length + 1} (recommended average)
                </button>
              ) : null}

              <div className="rounded-lg border border-line bg-surface p-4 sm:p-5">
                <label
                  htmlFor={`${baseId}-spo2`}
                  className="block text-sm font-semibold text-primary"
                >
                  Oxygen level, SpO2 (%, optional)
                </label>
                <p className="mt-1 text-xs leading-5 text-secondary">
                  Clip the pulse oximeter on a finger with no nail polish. Keep the hand warm,
                  relaxed and below heart level, stay still, and enter the number once it stops
                  changing.
                </p>
                <input
                  id={`${baseId}-spo2`}
                  name="spo2"
                  type="number"
                  min={50}
                  max={100}
                  step={1}
                  inputMode="numeric"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className="mt-3 w-full rounded-md border border-line bg-canvas px-3.5 py-2.5 text-sm text-primary tabular-nums transition-colors focus:border-accent focus:outline-none sm:w-40"
                />
              </div>

              <div className="flex flex-wrap justify-between gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                  Back to preparation
                </Button>
                <Button type="submit" variant="primary">
                  Next: Check symptoms
                  <Icon name="arrow_forward" size={18} />
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <CardHeader
            title={
              <span ref={stepHeadingRef} tabIndex={-1}>
                Step 3: Acute symptom check
              </span>
            }
            subtitle="Select any symptoms present right now. Leave all unchecked if none."
          />

          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-primary">
                  Target-organ / severe high BP symptoms
                </legend>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {severeSymptoms.map((sym) => {
                    const cid = `${baseId}-${sym.id}`;
                    const checked = symptoms.includes(sym.id);
                    return (
                      <label
                        key={sym.id}
                        htmlFor={cid}
                        className={`interactive-surface flex min-h-12 cursor-pointer items-center gap-3 rounded-md border p-3.5 text-sm ${
                          checked
                            ? "border-emergency bg-emergency/10 text-primary"
                            : "border-line bg-raised text-secondary hover:bg-hover"
                        }`}
                      >
                        <input
                          id={cid}
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSymptom(sym.id)}
                          className="h-5 w-5 accent-[var(--color-emergency)]"
                        />
                        <span>{sym.label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-primary">
                  Low BP / shock warning signs
                </legend>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {lowSymptoms.map((sym) => {
                    const cid = `${baseId}-${sym.id}`;
                    const checked = symptoms.includes(sym.id);
                    return (
                      <label
                        key={sym.id}
                        htmlFor={cid}
                        className={`interactive-surface flex min-h-12 cursor-pointer items-center gap-3 rounded-md border p-3.5 text-sm ${
                          checked
                            ? "border-attention bg-attention/10 text-primary"
                            : "border-line bg-raised text-secondary hover:bg-hover"
                        }`}
                      >
                        <input
                          id={cid}
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSymptom(sym.id)}
                          className="h-5 w-5 accent-[var(--color-attention)]"
                        />
                        <span>{sym.label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-4">
                <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                  Back to readings
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? "Checking..." : "Submit BP measurement"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {step === 4 && result ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="t-label-md text-muted">
                Day {result.missionDay} · {result.readings?.length} reading(s) averaged
              </p>
              <h2 ref={stepHeadingRef} tabIndex={-1} className="t-h1 mt-1 text-primary">
                Blood pressure recorded
              </h2>
            </div>

            <StatusBadge
              tone={statusToBadgeTone(result.zone?.status?.level)}
              dot={false}
              className="py-1.5 text-sm"
            >
              <Icon name={iconNameForKey(result.zone?.status?.iconKey)} size={16} />
              <span>{result.zone?.status?.label}</span>
            </StatusBadge>
          </div>

          {result.nextAction?.type === "alert_crew" ? (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border-2 border-emergency bg-emergency/15 p-5"
            >
              <div className="flex items-start gap-3">
                <Icon name="emergency" filled size={28} className="mt-0.5 text-emergency" />
                <div>
                  <p className="text-base font-bold text-primary">
                    Alert crew now
                  </p>
                  <p className="mt-0.5 text-sm text-secondary">
                    Severe reading or acute warning symptoms were reported. Open offline emergency steps right away.
                  </p>
                </div>
              </div>
              <Link
                href="/emergency"
                className={buttonClassName("danger", "md")}
              >
                <Icon name="emergency" filled size={18} />
                Open Emergency mode
              </Link>
            </div>
          ) : null}

          {result.nextAction?.type === "retest" ? (
            <div className="rounded-lg border border-attention/50 bg-attention/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-primary">
                    Retest recommended
                  </p>
                  <p className="mt-0.5 text-sm text-secondary">
                    Sit or anchor quietly and recheck to confirm whether this severe reading persists.
                  </p>
                  {result.nextAction.afterSeconds ? (
                    <CountdownControl
                      key={`retest:${result.id}:${result.nextAction.afterSeconds}`}
                      initialSeconds={result.nextAction.afterSeconds}
                      label="Retest countdown"
                    />
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setRetestOf(result.id);
                    setReadings([{ key: makeId("r"), systolic: "", diastolic: "", pulse: "" }]);
                    setErrorMessage("");
                    setStep(2);
                  }}
                >
                  Log retest now
                </Button>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <MetricTile
              label="Average blood pressure"
              value={`${result.average.systolic}/${result.average.diastolic}`}
              unit="mmHg"
              helper={
                result.average.pulse != null
                  ? `Pulse ${result.average.pulse} bpm`
                  : "Pulse not entered"
              }
            />
            <MetricTile
              label="AHA/ACC category"
              value={result.category.toUpperCase()}
              helper={BP_CATEGORY_LABELS[result.category] || result.category}
            />
            <MetricTile
              label="Personal systolic baseline"
              value={
                result.zone?.baseline?.ready && result.zone.baseline.mean != null
                  ? `${Math.round(result.zone.baseline.mean)}`
                  : "Building"
              }
              unit={result.zone?.baseline?.ready ? "mmHg" : undefined}
              helper={`${result.zone?.baseline?.n ?? 0} sessions in window`}
            />
          </div>

          <ClinicalActionCard card={result.card} heading="Blood pressure action card" />

          {result.vitals?.length ? <VitalsPanel vitals={result.vitals} /> : null}

          <div className="flex flex-wrap gap-3">
            <Link
              href="/normal-zone"
              className={buttonClassName("primary", "md")}
            >
              <Icon name="monitoring" size={18} />
              View trends
            </Link>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setResult(null);
                setRetestOf(undefined);
                setSpo2("");
                setSymptoms([]);
                setDoneSteps({});
                setStep(1);
              }}
            >
              New measurement
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
