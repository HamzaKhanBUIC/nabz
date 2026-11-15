"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";

function randomIsi(minMs, maxMs) {
  return Math.round(minMs + Math.random() * (maxMs - minMs));
}

function buildRealisticSampleTrials(protocol) {
  const minIsi = protocol?.isiMinMs ?? 1000;
  const maxIsi = protocol?.isiMaxMs ?? 4000;
  const trials = [];
  for (let i = 0; i < 64; i += 1) {
    const isiMs = Math.round(minIsi + ((i * 613) % Math.max(1, maxIsi - minIsi)));
    const rtMs = Math.round(230 + ((i * 23) % 85));
    trials.push({ i, isiMs, rtMs, early: false });
  }
  return trials;
}

export default function ReactionPad({
  protocol,
  sleepHours,
  submitting = false,
  onComplete,
  onCancel,
}) {
  const durationMs = protocol?.durationMs ?? 180_000;
  const isiMinMs = protocol?.isiMinMs ?? 1000;
  const isiMaxMs = protocol?.isiMaxMs ?? 4000;
  const feedbackMs = protocol?.feedbackMs ?? 1000;
  const noResponseTimeoutMs = protocol?.noResponseTimeoutMs ?? 30_000;
  const lapseMs = protocol?.lapseMs ?? 355;

  const [phase, setPhase] = useState("waiting"); // waiting | stimulus | feedback | finishing
  const [trials, setTrials] = useState([]);
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const [feedbackText, setFeedbackText] = useState("Wait for the target...");
  const [lastRt, setLastRt] = useState(null);

  const startedAtIsoRef = useRef(new Date().toISOString());
  const sessionStartPerfRef = useRef(null);
  const stateStartPerfRef = useRef(null);
  const stimulusOnsetPerfRef = useRef(null);
  const plannedIsiRef = useRef(randomIsi(isiMinMs, isiMaxMs));
  const phaseRef = useRef("waiting");
  const trialsRef = useRef([]);
  const timerRef = useRef(null);
  const rafRef = useRef(null);
  const submittedRef = useRef(false);
  const scheduleNextWaitingRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const finishSession = useCallback(
    (finalTrials) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      clearTimers();
      phaseRef.current = "finishing";
      setPhase("finishing");
      onComplete?.({
        protocolId: protocol?.protocolId || "pvt-b-3min",
        startedAt: startedAtIsoRef.current,
        sleepHours:
          sleepHours === "" || sleepHours == null ? undefined : Number(sleepHours),
        trials: finalTrials,
      });
    },
    [clearTimers, onComplete, protocol?.protocolId, sleepHours],
  );

  const scheduleNextWaiting = useCallback(() => {
    clearTimers();
    const now = performance.now();
    if (
      sessionStartPerfRef.current &&
      now - sessionStartPerfRef.current >= durationMs &&
      trialsRef.current.length >= 1
    ) {
      finishSession(trialsRef.current);
      return;
    }

    phaseRef.current = "waiting";
    setPhase("waiting");
    setLastRt(null);
    setFeedbackText("Wait for the blue cue...");
    stateStartPerfRef.current = now;
    const isi = randomIsi(isiMinMs, isiMaxMs);
    plannedIsiRef.current = isi;

    timerRef.current = setTimeout(() => {
      rafRef.current = requestAnimationFrame(() => {
        const onset = performance.now();
        stimulusOnsetPerfRef.current = onset;
        phaseRef.current = "stimulus";
        setPhase("stimulus");
        setFeedbackText("TAP NOW!");

        timerRef.current = setTimeout(() => {
          if (phaseRef.current !== "stimulus") return;
          const idx = trialsRef.current.length;
          const missedTrial = {
            i: idx,
            isiMs: plannedIsiRef.current,
            rtMs: null,
            early: false,
          };
          const updated = [...trialsRef.current, missedTrial];
          trialsRef.current = updated;
          setTrials(updated);
          phaseRef.current = "feedback";
          setPhase("feedback");
          setFeedbackText("Missed response (timeout)");
          timerRef.current = setTimeout(
            () => scheduleNextWaitingRef.current?.(),
            feedbackMs,
          );
        }, noResponseTimeoutMs);
      });
    }, isi);
  }, [
    clearTimers,
    durationMs,
    feedbackMs,
    finishSession,
    isiMaxMs,
    isiMinMs,
    noResponseTimeoutMs,
  ]);

  useEffect(() => {
    scheduleNextWaitingRef.current = scheduleNextWaiting;
  }, [scheduleNextWaiting]);

  useEffect(() => {
    startedAtIsoRef.current = new Date().toISOString();
    sessionStartPerfRef.current = performance.now();
    scheduleNextWaiting();

    const tickId = setInterval(() => {
      if (!sessionStartPerfRef.current) return;
      const elapsed = performance.now() - sessionStartPerfRef.current;
      const left = Math.max(0, durationMs - elapsed);
      setRemainingMs(left);
      if (left <= 0 && trialsRef.current.length >= 1 && !submittedRef.current) {
        finishSession(trialsRef.current);
      }
    }, 250);

    return () => {
      clearInterval(tickId);
      clearTimers();
    };
  }, [clearTimers, durationMs, finishSession, scheduleNextWaiting]);

  const handleTap = useCallback(
    (eventTimestamp) => {
      if (submittedRef.current) return;
      const now = eventTimestamp || performance.now();

      if (phaseRef.current === "waiting") {
        clearTimers();
        const elapsedWait = Math.max(
          0,
          Math.round(now - (stateStartPerfRef.current || now)),
        );
        const earlyTrial = {
          i: trialsRef.current.length,
          isiMs: Math.min(60_000, elapsedWait),
          rtMs: null,
          early: true,
        };
        const updated = [...trialsRef.current, earlyTrial];
        trialsRef.current = updated;
        setTrials(updated);
        phaseRef.current = "feedback";
        setPhase("feedback");
        setLastRt(null);
        setFeedbackText("Too early — wait for the blue cue");
        timerRef.current = setTimeout(scheduleNextWaiting, feedbackMs);
        return;
      }

      if (phaseRef.current === "stimulus") {
        clearTimers();
        const rawRt = Math.round(
          now - (stimulusOnsetPerfRef.current || now),
        );
        const clampedRt = Math.max(1, Math.min(60_000, rawRt));
        const trial = {
          i: trialsRef.current.length,
          isiMs: plannedIsiRef.current,
          rtMs: clampedRt,
          early: false,
        };
        const updated = [...trialsRef.current, trial];
        trialsRef.current = updated;
        setTrials(updated);
        phaseRef.current = "feedback";
        setPhase("feedback");
        setLastRt(clampedRt);
        setFeedbackText(
          clampedRt >= lapseMs
            ? `${clampedRt} ms (lapse >= ${lapseMs} ms)`
            : `${clampedRt} ms`,
        );
        timerRef.current = setTimeout(scheduleNextWaiting, feedbackMs);
      }
    },
    [clearTimers, feedbackMs, lapseMs, scheduleNextWaiting],
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === "Space" || e.code === "Enter") {
        if (
          document.activeElement?.tagName === "BUTTON" &&
          document.activeElement?.dataset?.padControl === "true"
        ) {
          return;
        }
        e.preventDefault();
        handleTap(e.timeStamp);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleTap]);

  const remainSecs = Math.ceil(remainingMs / 1000);
  const mm = Math.floor(remainSecs / 60);
  const ss = remainSecs % 60;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-5 py-3.5">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-muted">Time remaining</p>
            <p className="font-mono text-lg font-semibold text-primary">
              {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
            </p>
          </div>
          <div className="h-8 w-px bg-line" />
          <div>
            <p className="text-xs text-muted">Trials logged</p>
            <p className="font-mono text-lg font-semibold text-primary">
              {trials.length}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-pad-control="true"
            disabled={submitting || trials.length === 0}
            onClick={() => finishSession(trialsRef.current)}
          >
            Finish & score ({trials.length})
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-pad-control="true"
            disabled={submitting}
            onClick={() => finishSession(buildRealisticSampleTrials(protocol))}
          >
            Complete 3-min sample (64 trials)
          </Button>
          {onCancel ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-pad-control="true"
              disabled={submitting}
              onClick={onCancel}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          handleTap(e.timeStamp);
        }}
        disabled={phase === "finishing" || submitting}
        aria-label="PVT reaction test tap pad — press Space or click when target appears"
        className={`flex min-h-[320px] w-full flex-col items-center justify-center rounded-xl border-2 p-8 text-center transition-colors select-none focus-visible:outline-2 focus-visible:outline-accent ${
          phase === "stimulus"
            ? "border-accent bg-accent text-on-status shadow-lg"
            : phase === "feedback" && feedbackText.startsWith("Too early")
              ? "border-attention bg-attention/15 text-primary"
              : "border-line-strong bg-surface text-primary hover:bg-raised"
        }`}
      >
        <Icon
          name={phase === "stimulus" ? "bolt" : "touch_app"}
          size={48}
          className={phase === "stimulus" ? "text-on-status" : "text-accent"}
        />
        <p className="t-h1 mt-4">
          {submitting || phase === "finishing"
            ? "Scoring session on server..."
            : phase === "stimulus"
              ? "TAP!"
              : lastRt !== null
                ? `${lastRt} ms`
                : "Watch for the blue cue"}
        </p>
        <p
          className={`mt-2 text-sm ${
            phase === "stimulus" ? "text-on-status/90" : "text-secondary"
          }`}
        >
          {feedbackText} · Tap anywhere in this box or press Spacebar
        </p>
      </button>
    </div>
  );
}
