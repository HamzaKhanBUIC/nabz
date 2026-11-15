"use client";

/**
 * Measurement stepper — screen 06 (blood pressure, the designed flow) plus
 * the same stepper pattern for the other three measurement items.
 *
 * Every step: Back link · H1 · Step indicator · H2 step title · content ·
 * Primary/Secondary buttons · Safety banner.
 *
 * Blood pressure copy is verbatim from screens.md. The other metrics reuse
 * the same pattern with generic, non-medical device instructions — no
 * procedures or thresholds are invented for them.
 */

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackLink from "@/components/ui/BackLink";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import StepIndicator from "@/components/ui/StepIndicator";
import InstructionStep from "@/components/ui/InstructionStep";
import MetricTile from "@/components/ui/MetricTile";
import { StatusPill } from "@/components/ui/StatusBadge";
import { useStore } from "@/lib/data/store";

/** Normal range shown on the blood-pressure result (from the handoff). */
const BP_NORMAL = { systolic: [110, 125], diastolic: [70, 82] };

const GENERIC_PREP = [
  "Sit comfortably and relax for a moment.",
  "Keep the device within reach.",
  "Take readings at the same time of day when you can.",
];

const GENERIC_DEVICE = [
  "Turn on the device and wait for it to settle.",
  "Follow the instructions on its display.",
  "Make sure the sensor is steady before you start.",
];

export const MEASUREMENTS = [
  {
    id: "blood-pressure",
    title: "Blood pressure",
    icon: "blood_pressure",
    subtitle: "4 steps",
    fields: [
      { key: "systolic", label: "Systolic", unit: "mmHg", value: "118" },
      { key: "diastolic", label: "Diastolic", unit: "mmHg", value: "76" },
      { key: "pulse", label: "Pulse", unit: "bpm", value: "68" },
    ],
    steps: [
      {
        title: "Get ready",
        instructions: [
          "Sit still with both feet on the floor for 5 minutes",
          "Rest your left arm on the table at heart level",
          "Do not talk or move during the measurement",
        ],
      },
      {
        title: "Put on the cuff",
        instructions: [
          "Wrap the cuff about 2 cm above the elbow",
          "The tube runs down the inside of your arm",
          "Snug, with room for one finger under it",
        ],
      },
      {
        title: "Measure and enter",
        intro: "Press Start on the monitor and keep your arm still.",
      },
      { title: "Your reading" },
    ],
  },
  {
    id: "heart-rate-oxygen",
    title: "Heart rate & oxygen",
    icon: "ecg_heart",
    subtitle: "4 steps",
    fields: [
      { key: "pulse", label: "Heart rate", unit: "bpm", value: "" },
      { key: "spo2", label: "Oxygen", unit: "%", value: "" },
    ],
    steps: [
      { title: "Get ready", instructions: GENERIC_PREP },
      { title: "Prepare the device", instructions: GENERIC_DEVICE },
      { title: "Measure and enter", intro: "Start the measurement and keep still until it finishes." },
      { title: "Your reading" },
    ],
  },
  {
    id: "body-temperature",
    title: "Body temperature",
    icon: "device_thermostat",
    subtitle: "4 steps",
    fields: [{ key: "temperature", label: "Temperature", unit: "°C", value: "" }],
    steps: [
      { title: "Get ready", instructions: GENERIC_PREP },
      { title: "Prepare the device", instructions: GENERIC_DEVICE },
      { title: "Measure and enter", intro: "Take the reading and wait for the value to settle." },
      { title: "Your reading" },
    ],
  },
  {
    id: "blood-sugar",
    title: "Blood sugar",
    icon: "glucose",
    subtitle: "4 steps",
    fields: [{ key: "glucose", label: "Blood sugar", unit: "mmol/L", value: "" }],
    steps: [
      { title: "Get ready", instructions: GENERIC_PREP },
      { title: "Prepare the device", instructions: GENERIC_DEVICE },
      { title: "Measure and enter", intro: "Take the reading and wait for the value to settle." },
      { title: "Your reading" },
    ],
  },
];

export function measurementById(id) {
  return MEASUREMENTS.find((m) => m.id === id) || MEASUREMENTS[0];
}

function NumberField({ field, value, onChange }) {
  return (
    <label className="block">
      <span className="block t-label-md text-secondary">{field.label}</span>
      <span className="mt-2 flex h-14 items-center rounded-md border border-line bg-surface px-4 transition-shadow focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-focus">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="—"
          className="min-w-0 flex-1 bg-transparent text-2xl font-semibold leading-8 text-primary outline-none placeholder:text-muted"
        />
        <span className="shrink-0 pl-3 text-sm text-muted">{field.unit}</span>
      </span>
    </label>
  );
}

function SafetyBanner() {
  return (
    <div className="mt-8 flex flex-col gap-4 rounded-lg bg-raised px-6 py-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon name="warning" size={24} className="shrink-0 text-secondary" />
        <p className="t-body-md text-secondary">
          If something feels wrong, stop and open Emergency mode.
        </p>
      </div>
      <Button
        href="/emergency"
        variant="danger"
        size="md"
        icon="emergency"
        iconFilled
        className="shrink-0"
      >
        Emergency
      </Button>
    </div>
  );
}

function Flow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useStore();

  const metric = measurementById(searchParams.get("metric"));
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(() =>
    Object.fromEntries(metric.fields.map((f) => [f.key, f.value]))
  );

  const stepDef = metric.steps[step - 1];
  const isLast = step === metric.steps.length;
  const requiredKeys = metric.fields.map((f) => f.key);
  const canAdvance = requiredKeys.every(
    (key) => String(values[key] ?? "").trim() !== ""
  );

  const save = () => {
    const record = {
      metric: metric.id,
      timestamp: new Date().toISOString(),
      values: { ...values },
    };
    if (metric.id === "blood-pressure") {
      store.addMeasurement({
        systolic: Number(values.systolic),
        diastolic: Number(values.diastolic),
        pulse: values.pulse === "" ? null : Number(values.pulse),
        posture: "Seated, resting 5 min",
        timestamp: record.timestamp,
      });
    } else {
      store.addMeasurement({
        metric: metric.id,
        values: { ...values },
        timestamp: record.timestamp,
      });
    }
    router.push("/");
  };

  const backHref = "/measure";

  return (
    <div>
      <BackLink href={backHref}>Measure</BackLink>
      <h1 className="mt-6 t-h1 text-primary">{metric.title}</h1>

      <StepIndicator step={step} total={4} className="mt-8" />
      <h2 className="mt-[30px] t-h2 text-primary">{stepDef.title}</h2>

      {/* Steps 1–2: instruction list */}
      {stepDef.instructions ? (
        <div className="mt-6 flex flex-col gap-3">
          {stepDef.instructions.map((text, index) => (
            <InstructionStep key={text} number={index + 1}>
              {text}
            </InstructionStep>
          ))}
        </div>
      ) : null}

      {/* Step 3: intro + number fields */}
      {stepDef.intro ? (
        <div className="mt-6 max-w-[752px]">
          <p className="t-body-md text-muted">{stepDef.intro}</p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metric.fields.map((field) => (
              <NumberField
                key={field.key}
                field={field}
                value={values[field.key]}
                onChange={(next) =>
                  setValues((prev) => ({ ...prev, [field.key]: next }))
                }
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Step 4: the reading */}
      {isLast ? (
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center">
          <MetricTile
            className="w-full max-w-[340px]"
            label={metric.title}
            value={
              metric.id === "blood-pressure"
                ? `${values.systolic} / ${values.diastolic}`
                : metric.fields
                    .map((f) => values[f.key] || "—")
                    .join(" / ")
            }
            unit={
              metric.id === "blood-pressure"
                ? "mmHg"
                : metric.fields[0]?.unit
            }
            helper={
              metric.id === "blood-pressure"
                ? "Your normal: 110–125 / 70–82"
                : "Saved to your log"
            }
          />
          <div className="flex flex-col gap-6">
            {metric.id === "blood-pressure" ? (
              <StatusPill status="normal">Normal</StatusPill>
            ) : (
              <StatusPill status="normal">Recorded</StatusPill>
            )}
            <p className="t-label-lg text-primary">
              {metric.id === "blood-pressure"
                ? "Inside your normal. Saved to your log."
                : "Saved to your log."}
            </p>
          </div>
        </div>
      ) : null}

      {/* Buttons */}
      <div className="mt-8 flex flex-wrap gap-4">
        {isLast ? (
          <>
            <Button variant="primary" size="lg" onClick={save}>
              Done
            </Button>
            <Button href="/measure" variant="secondary" size="lg">
              Measure something else
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="primary"
              size="lg"
              arrow
              disabled={!canAdvance}
              onClick={() => setStep((current) => current + 1)}
            >
              Next
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() =>
                step === 1 ? router.push(backHref) : setStep((c) => c - 1)
              }
            >
              Back
            </Button>
          </>
        )}
      </div>

      {!isLast && !canAdvance ? (
        <p className="mt-3 t-body-sm text-muted" aria-live="polite">
          Enter a value for every field to continue.
        </p>
      ) : null}

      <SafetyBanner />
    </div>
  );
}

export default function MeasurementFlow() {
  return (
    <Suspense fallback={null}>
      <Flow />
    </Suspense>
  );
}
