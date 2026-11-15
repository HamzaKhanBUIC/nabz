"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Button, { buttonClassName } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import InstructionStep from "@/components/ui/InstructionStep";
import { useSession } from "@/lib/data/session";
import { useStore } from "@/lib/data/store";
import { formatTime, makeId } from "@/lib/utils/format";

function formatClock(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function StepCountdown({ seconds }) {
  const [remaining, setRemaining] = useState(seconds);
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
        className="inline-flex min-h-9 items-center gap-1.5 rounded-pill border border-line bg-canvas px-3 py-1 tabular-nums text-xs font-semibold tabular-nums text-primary"
      >
        <Icon name="timer" size={14} className="text-emergency" />
        {remaining === 0 ? "Timer finished" : formatClock(remaining)}
      </span>
      <button
        type="button"
        onClick={() => setRunning((r) => !r)}
        disabled={remaining === 0}
        className="inline-flex min-h-9 cursor-pointer items-center rounded-md border border-line bg-raised px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-hover disabled:opacity-50"
      >
        {running ? "Pause" : remaining === seconds ? "Start timer" : "Resume"}
      </button>
      {remaining !== seconds ? (
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setRemaining(seconds);
          }}
          className="inline-flex min-h-9 cursor-pointer items-center rounded-md border border-line px-3 py-1 text-xs font-medium text-secondary transition-colors hover:bg-hover"
        >
          Reset
        </button>
      ) : null}
    </div>
  );
}

function MetronomeControl({ bpm = 110 }) {
  const [active, setActive] = useState(false);
  const [beat, setBeat] = useState(false);
  const [beatCount, setBeatCount] = useState(0);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;

    const intervalMs = Math.round(60_000 / bpm);
    const triggerTick = () => {
      setBeat(true);
      setBeatCount((c) => c + 1);
      setTimeout(() => setBeat(false), Math.min(180, intervalMs * 0.45));

      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioCtx();
          }
          const ctx = audioCtxRef.current;
          if (ctx.state === "suspended") {
            ctx.resume().catch(() => null);
          }
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.18, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.07);
        }
      } catch {
        // visual beat still works if audio blocked
      }
    };

    triggerTick();
    const id = setInterval(triggerTick, intervalMs);
    return () => clearInterval(id);
  }, [active, bpm]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => null);
      }
    };
  }, []);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-emergency/50 bg-emergency/10 p-3">
      <div
        aria-hidden="true"
        className={`flex h-11 w-11 items-center justify-center rounded-full border-2 border-emergency tabular-nums text-xs font-bold transition-transform duration-100 ${
          beat
            ? "scale-110 bg-emergency-solid text-white"
            : "scale-100 bg-canvas text-emergency"
        }`}
      >
        {bpm}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-primary">
          Compression cadence metronome ({bpm} bpm)
        </p>
        <p className="text-xs text-secondary">
          {active
            ? `Active: push on every flash or tone (beat ${beatCount})`
            : "Tap start for rhythmic audio & visual cadence"}
        </p>
      </div>
      <Button
        type="button"
        variant={active ? "secondary" : "primary"}
        size="sm"
        onClick={() => {
          if (active) {
            setActive(false);
            setBeat(false);
          } else {
            setBeatCount(0);
            setActive(true);
          }
        }}
      >
        <Icon name={active ? "stop" : "play_arrow"} size={16} />
        {active ? "Stop cadence" : `Start ${bpm} bpm`}
      </Button>
    </div>
  );
}

/** Icon per procedure for the big "What is happening?" buttons. Presentation only. */
const PROCEDURE_ICONS = {
  "allergic-reaction": "allergy",
  bleeding: "water_drop",
  burn: "local_fire_department",
  eye: "visibility",
  "near-fainting": "airline_seat_flat",
  "crewmate-collapse": "personal_injury",
  "crewmate-cpr": "ecg_heart",
  "crewmate-low-blood-sugar": "glucose",
  "crewmate-seizure": "neurology",
};

const TOTAL_STEPS = 4;

function StepHeader({ step, title, subtitle, onBack, headingRef }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-secondary">
          Step {step} of {TOTAL_STEPS}
        </p>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-sm font-medium text-secondary hover:bg-hover hover:text-primary"
          >
            <Icon name="arrow_back" size={18} />
            Back
          </button>
        ) : null}
      </div>
      <div
        className="grid grid-cols-4 gap-1.5"
        role="progressbar"
        aria-label="Emergency steps"
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={step}
      >
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full ${i < step ? "bg-emergency-solid" : "bg-line"}`}
          />
        ))}
      </div>
      <div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="t-h1 text-primary focus:outline-none"
        >
          {title}
        </h1>
        {subtitle ? <p className="mt-1 text-sm text-secondary">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function BigChoice({ icon, label, onClick, selected = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-36 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 p-5 text-center text-base font-semibold transition-[transform,background-color,border-color] duration-150 active:scale-[0.98] ${
        selected
          ? "border-emergency-solid bg-emergency-solid text-white"
          : "border-line bg-surface text-primary hover:border-emergency hover:bg-hover"
      }`}
    >
      <Icon
        name={icon}
        size={36}
        className={selected ? "text-white" : "text-emergency"}
      />
      <span>{label}</span>
    </button>
  );
}

function StepList({ procedure, doneSteps, onToggle }) {
  return (
    <ol className="space-y-3">
      {procedure.steps.map((s, idx) => {
        const key = `${procedure.id}:${s.id}`;
        return (
          <li key={s.id} className="space-y-1.5">
            <InstructionStep
              number={idx + 1}
              done={Boolean(doneSteps[key])}
              onToggle={() => onToggle(procedure.id, s.id)}
            >
              {s.text}
            </InstructionStep>
            <div className="pl-4">
              {s.detail ? (
                <p className="text-sm leading-6 text-secondary">{s.detail}</p>
              ) : null}
              {s.caution ? (
                <p className="mt-1 rounded-md border border-attention/40 bg-attention/10 px-3 py-1.5 text-xs font-medium text-attention">
                  Caution: {s.caution}
                </p>
              ) : null}
              {s.timerSeconds ? (
                <StepCountdown
                  key={`${procedure.id}:${s.id}:${s.timerSeconds}`}
                  seconds={s.timerSeconds}
                />
              ) : null}
              {s.metronomeBpm ? <MetronomeControl bpm={s.metronomeBpm} /> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function EmergencyFlowInner() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");
  const { isAuthenticated } = useSession();
  const { emergencySelf, emergencyCrewmate, environment, recordEmergencyAlert } =
    useStore();
  const activeEnv = environment?.active || null;

  const initialProc =
    (initialId &&
      [...emergencySelf, ...emergencyCrewmate].find((p) => p.id === initialId)) ||
    null;

  // 1: who, 2: what is happening, 3: do this now, 4: help is on the way
  const [userStep, setUserStep] = useState(null);
  const [userTarget, setUserTarget] = useState(null); // self | crewmate
  const [userProcId, setUserProcId] = useState(null);
  const [doneSteps, setDoneSteps] = useState({});
  const [alertedAt, setAlertedAt] = useState(null);
  const headingRef = useRef(null);

  const step = userStep ?? (initialProc ? 3 : 1);
  const target = userTarget ?? initialProc?.for ?? null;
  const procId = userProcId ?? initialProc?.id ?? null;
  const list = target === "crewmate" ? emergencyCrewmate : emergencySelf;
  const procedure = list.find((p) => p.id === procId) || null;

  useEffect(() => {
    if (userStep !== null) headingRef.current?.focus();
  }, [userStep]);

  const toggleDone = (pid, sid) => {
    const key = `${pid}:${sid}`;
    setDoneSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAlert = (proc) => {
    const entry = {
      id: makeId("alert"),
      procedureId: proc.id,
      title: proc.title,
      target: proc.for,
      triggeredAt: new Date().toISOString(),
    };
    recordEmergencyAlert(entry);
    setAlertedAt(entry.triggeredAt);
    setUserStep(4);
  };

  const contactLine =
    activeEnv?.name && activeEnv?.escalation ? (
      <div className="flex items-start gap-3 rounded-lg border border-attention/40 bg-attention/10 px-4 py-3 text-sm">
        <Icon
          name="contact_phone"
          size={20}
          className="mt-0.5 shrink-0 text-attention"
        />
        <div className="min-w-0">
          <p className="t-label-md text-secondary">Who to contact</p>
          <p className="mt-0.5 font-semibold text-primary">
            {`${activeEnv.name}: ${activeEnv.escalation}`}
          </p>
        </div>
      </div>
    ) : null;

  if (step === 1 || !target) {
    const pickTarget = (t) => {
      setUserTarget(t);
      setUserProcId(null);
      setUserStep(2);
    };
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <StepHeader
          step={1}
          title="Who is this for?"
          subtitle="Tap one. Help steps change depending on who needs it."
          headingRef={headingRef}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <BigChoice
            icon="person"
            label="Me"
            selected={target === "self"}
            onClick={() => pickTarget("self")}
          />
          <BigChoice
            icon="group"
            label="A crewmate"
            selected={target === "crewmate"}
            onClick={() => pickTarget("crewmate")}
          />
        </div>
        {contactLine}
      </div>
    );
  }

  if (step === 2 || !procedure) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <StepHeader
          step={2}
          title="What is happening?"
          subtitle={`For: ${target === "crewmate" ? "a crewmate" : "me"}. Pick the closest match. No typing needed.`}
          onBack={() => setUserStep(1)}
          headingRef={headingRef}
        />
        {list.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
            No local guides loaded yet. Make sure the server ran at least once so
            procedures are cached.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((proc) => (
              <BigChoice
                key={proc.id}
                icon={PROCEDURE_ICONS[proc.id] || "medical_services"}
                label={proc.title}
                selected={procId === proc.id}
                onClick={() => {
                  setUserProcId(proc.id);
                  setAlertedAt(null);
                  setUserStep(3);
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const redFlags = Array.isArray(procedure.redFlags) ? procedure.redFlags : [];
  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-muted">
      <span className="font-medium">{procedure.disclaimer}</span>
      <div className="flex flex-wrap gap-3">
        {(procedure.sources || []).map((src) => (
          <a
            key={src.id}
            href={src.url}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            {src.title}
          </a>
        ))}
      </div>
    </div>
  );

  if (step === 4) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <StepHeader
          step={4}
          title="Help is on the way"
          subtitle="Keep following the steps until the medical officer takes over."
          headingRef={headingRef}
        />
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-lg bg-ok px-4 py-3 text-sm font-semibold text-on-status"
        >
          <Icon name="check_circle" size={20} />
          <span>
            Medical officer alerted{alertedAt ? ` at ${formatTime(alertedAt)}` : ""}.
          </span>
        </div>
        <p className="text-sm font-semibold text-primary">{procedure.title}</p>
        <StepList procedure={procedure} doneSteps={doneSteps} onToggle={toggleDone} />
        <div className="flex flex-wrap gap-3">
          <Link
            href={isAuthenticated ? "/" : "/sign-in"}
            className={buttonClassName("primary", "lg")}
          >
            Close emergency mode
          </Link>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => setUserStep(3)}
          >
            Back to steps
          </Button>
        </div>
        {footer}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StepHeader
        step={3}
        title={`Do this now: ${procedure.title}`}
        subtitle="Tap each step when it is done."
        onBack={() => setUserStep(2)}
        headingRef={headingRef}
      />
      <p className="text-sm text-secondary">
        <strong className="text-primary">When to use: </strong>
        {procedure.whenToUse}
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <StepList procedure={procedure} doneSteps={doneSteps} onToggle={toggleDone} />

        <div className="space-y-4">
          <Button
            type="button"
            variant="danger"
            size="lg"
            className="w-full justify-center"
            onClick={() => handleAlert(procedure)}
          >
            <Icon name="emergency" filled size={20} />
            Alert medical officer
          </Button>
          <Link
            href="/measure/blood-pressure"
            className={`${buttonClassName("secondary", "lg")} w-full justify-center`}
          >
            <Icon name="monitor_heart" size={20} />
            Check heart rate &amp; oxygen
          </Link>
          {contactLine}
          {redFlags.length > 0 ? (
            <div className="rounded-lg bg-emergency-solid p-4 text-white">
              <p className="flex items-center gap-1.5 text-sm font-bold">
                <Icon name="warning" size={18} />
                Red flags: escalate immediately
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {redFlags.map((rf, i) => (
                  <li key={i}>{rf}</li>
                ))}
              </ul>
              {procedure.escalation?.text ? (
                <p className="mt-3 text-sm font-semibold">
                  {procedure.escalation.text}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {footer}
    </div>
  );
}

export default function EmergencyFlow() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted">Loading emergency protocols...</div>
      }
    >
      <EmergencyFlowInner />
    </Suspense>
  );
}
