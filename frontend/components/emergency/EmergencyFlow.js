"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import InstructionStep from "@/components/ui/InstructionStep";
import StatusBadge from "@/components/ui/StatusBadge";
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
        className="inline-flex min-h-9 items-center gap-1.5 rounded-pill border border-line bg-canvas px-3 py-1 font-mono text-xs font-semibold tabular-nums text-primary"
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
        className={`flex h-11 w-11 items-center justify-center rounded-full border-2 border-emergency font-mono text-xs font-bold transition-transform duration-100 ${
          beat
            ? "scale-110 bg-emergency text-white"
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

function EmergencyFlowInner() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");
  const {
    emergencySelf,
    emergencyCrewmate,
    emergencyLog,
    environment,
    recordEmergencyAlert,
  } = useStore();
  const activeEnv = environment?.active || null;

  const [userTarget, setUserTarget] = useState(null); // self | crewmate | null
  const [userSelectedId, setUserSelectedId] = useState(null);
  const [doneSteps, setDoneSteps] = useState({});
  const [alertNotice, setAlertNotice] = useState(null);

  const defaultTarget =
    initialId && emergencyCrewmate.some((p) => p.id === initialId)
      ? "crewmate"
      : "self";
  const target = userTarget ?? defaultTarget;
  const selectedId =
    userSelectedId ?? (userTarget === null ? initialId : null);

  const list = target === "crewmate" ? emergencyCrewmate : emergencySelf;
  const activeProcedure =
    list.find((p) => p.id === selectedId) || list[0] || null;

  const toggleDone = (procId, stepId) => {
    const key = `${procId}:${stepId}`;
    setDoneSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAlertCrew = (proc) => {
    const entry = {
      id: makeId("alert"),
      procedureId: proc.id,
      title: proc.title,
      target: proc.for,
      triggeredAt: new Date().toISOString(),
    };
    recordEmergencyAlert(entry);
    setAlertNotice(
      `Local crew alert recorded at ${formatTime(entry.triggeredAt)} for "${proc.title}".`,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="t-label-md text-emergency">
            Cached locally · Offline ready
          </p>
          <h1 className="t-h1 mt-1 text-primary">Emergency action guides</h1>
          <p className="mt-1 text-sm text-secondary">
            Works offline without internet. Follow each step carefully and alert crewmates early if red flags appear.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Who needs help"
          className="flex w-full rounded-lg border border-line bg-surface p-1 sm:inline-flex sm:w-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={target === "self"}
            onClick={() => {
              setUserTarget("self");
              setUserSelectedId(null);
              setAlertNotice(null);
            }}
            className={`min-h-10 flex-1 cursor-pointer rounded-md px-4 py-2 text-sm font-semibold transition-[background-color,color,box-shadow] duration-200 ease-[var(--ease-smooth)] sm:flex-initial ${
              target === "self"
                ? "bg-emergency text-white shadow-sm"
                : "text-secondary hover:bg-hover hover:text-primary"
            }`}
          >
            For me ({emergencySelf.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={target === "crewmate"}
            onClick={() => {
              setUserTarget("crewmate");
              setUserSelectedId(null);
              setAlertNotice(null);
            }}
            className={`min-h-10 flex-1 cursor-pointer rounded-md px-4 py-2 text-sm font-semibold transition-[background-color,color,box-shadow] duration-200 ease-[var(--ease-smooth)] sm:flex-initial ${
              target === "crewmate"
                ? "bg-emergency text-white shadow-sm"
                : "text-secondary hover:bg-hover hover:text-primary"
            }`}
          >
            For a crewmate ({emergencyCrewmate.length})
          </button>
        </div>
      </div>

      {activeEnv?.name && activeEnv?.escalation ? (
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
      ) : null}

      {alertNotice ? (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-lg border border-emergency bg-emergency/15 px-4 py-3 text-sm font-semibold text-primary"
        >
          <Icon name="notifications_active" size={20} className="text-emergency" />
          <span>{alertNotice}</span>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {target === "self" ? "Self-care procedures" : "Crewmate responder protocols"}
          </p>
          {list.length === 0 ? (
            <div className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
              No local guides loaded yet. Make sure the server ran at least once so procedures are cached.
            </div>
          ) : (
            list.map((proc) => {
              const active = activeProcedure?.id === proc.id;
              return (
                <button
                  key={proc.id}
                  type="button"
                  onClick={() => {
                    setUserSelectedId(proc.id);
                    setAlertNotice(null);
                  }}
                  aria-current={active ? "true" : undefined}
                  className={`interactive-surface flex w-full cursor-pointer items-start justify-between gap-2 rounded-lg border p-4 text-left ${
                    active
                      ? "border-emergency bg-raised"
                      : "border-line bg-surface hover:bg-hover"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      {proc.title}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {proc.steps.length} steps
                    </p>
                  </div>
                  <Icon
                    name="chevron_right"
                    size={18}
                    className={active ? "text-emergency" : "text-muted"}
                  />
                </button>
              );
            })
          )}

          {emergencyLog.length > 0 ? (
            <Card className="mt-4">
              <CardBody className="p-4 sm:p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Local alert log ({emergencyLog.length})
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-secondary">
                  {emergencyLog.slice(0, 3).map((entry) => (
                    <li key={entry.id}>
                      {formatTime(entry.triggeredAt)}: {entry.title}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}
        </div>

        {activeProcedure ? (
          <div className="space-y-5">
            <Card>
              <CardBody className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge tone="bad" dot={false}>
                        {activeProcedure.for === "crewmate"
                          ? "Crewmate emergency"
                          : "Self protocol"}
                      </StatusBadge>
                      <span className="text-xs text-muted">
                        v{activeProcedure.version}
                      </span>
                    </div>
                    <h2 className="t-h1 mt-2 text-primary">
                      {activeProcedure.title}
                    </h2>
                    <p className="mt-1 text-sm text-secondary">
                      <strong className="text-primary">When to use: </strong>
                      {activeProcedure.whenToUse}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => handleAlertCrew(activeProcedure)}
                  >
                    <Icon name="emergency" filled size={18} />
                    Alert crew
                  </Button>
                </div>

                <div className="space-y-3">
                  {activeProcedure.steps.map((s, idx) => {
                    const key = `${activeProcedure.id}:${s.id}`;
                    return (
                      <div key={s.id} className="space-y-1.5">
                        <InstructionStep
                          number={idx + 1}
                          done={Boolean(doneSteps[key])}
                          onToggle={() => toggleDone(activeProcedure.id, s.id)}
                        >
                          {s.text}
                        </InstructionStep>

                        <div className="pl-4">
                          {s.detail ? (
                            <p className="text-xs leading-5 text-secondary">
                              {s.detail}
                            </p>
                          ) : null}
                          {s.caution ? (
                            <p className="mt-1 rounded-md border border-attention/40 bg-attention/10 px-3 py-1.5 text-xs font-medium text-attention">
                              Caution: {s.caution}
                            </p>
                          ) : null}
                          {s.timerSeconds ? (
                            <StepCountdown
                              key={`${activeProcedure.id}:${s.id}:${s.timerSeconds}`}
                              seconds={s.timerSeconds}
                            />
                          ) : null}
                          {s.metronomeBpm ? (
                            <MetronomeControl bpm={s.metronomeBpm} />
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-lg border border-emergency/50 bg-emergency/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emergency">
                    Red flags: escalate immediately
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-primary">
                    {activeProcedure.redFlags.map((rf, i) => (
                      <li key={i}>{rf}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs font-semibold text-secondary">
                    {activeProcedure.escalation.text}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-muted">
                  <span className="font-medium">{activeProcedure.disclaimer}</span>
                  <div className="flex flex-wrap gap-3">
                    {activeProcedure.sources.map((src) => (
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
              </CardBody>
            </Card>
          </div>
        ) : null}
      </div>
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
