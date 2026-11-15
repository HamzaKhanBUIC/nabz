"use client";

/**
 * Reaction pad — handoff components.md:
 *   "state: Ready, Wait, Go, Done · Interactive:
 *    Ready -tap-> Wait -1.5s-> Go -tap-> Done. 200px target circle"
 *   icons.md: touch_app / timer / check_circle, all Filled.
 *
 * The wait is randomised (1.5–4s) and the reaction time is measured from the
 * moment the circle turns blue to the tap — nothing is simulated.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";

const MIN_WAIT_MS = 1500;
const MAX_WAIT_MS = 4000;

const STATES = {
  ready: {
    label: "Ready",
    hint: "Tap the circle when you are ready.",
    icon: "touch_app",
    circle: "bg-raised border border-line text-secondary",
  },
  wait: {
    label: "Wait",
    hint: "Wait for the circle to turn blue.",
    icon: "timer",
    circle: "bg-raised border border-line text-secondary",
  },
  go: {
    label: "Go",
    hint: "Tap now.",
    icon: "touch_app",
    circle: "bg-accent border border-transparent text-on-accent",
  },
  done: {
    label: "Done",
    hint: null,
    icon: "check_circle",
    circle: "bg-normal border border-transparent text-on-status",
  },
};

export default function ReactionPad({ round = 1, rounds = [], onResult }) {
  const [phase, setPhase] = useState("ready");
  const [elapsed, setElapsed] = useState(null);

  const waitTimer = useRef(null);
  const goAt = useRef(null);
  const resultRef = useRef(onResult);

  useEffect(() => {
    resultRef.current = onResult;
  });

  useEffect(
    () => () => {
      if (waitTimer.current) clearTimeout(waitTimer.current);
    },
    []
  );

  const arm = useCallback(() => {
    setPhase("wait");
    const delay = MIN_WAIT_MS + Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS);
    waitTimer.current = setTimeout(() => {
      goAt.current =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      setPhase("go");
    }, delay);
  }, []);

  const handleTap = useCallback(() => {
    if (phase === "ready") {
      arm();
      return;
    }
    if (phase === "wait") return; // too early — ignore, the round keeps waiting
    if (phase === "go") {
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const ms = Math.max(1, Math.round(now - goAt.current));
      if (waitTimer.current) clearTimeout(waitTimer.current);
      setElapsed(ms);
      setPhase("done");
      resultRef.current?.(ms);
    }
    // "done" is not tappable — the flow advances.
  }, [phase, arm]);

  const state = STATES[phase];
  const hint =
    phase === "done" && elapsed != null ? `${elapsed} ms recorded.` : state.hint;

  return (
    <div className="flex min-h-[460px] flex-col items-center justify-center px-6 py-8">
      <button
        type="button"
        onClick={handleTap}
        disabled={phase === "done"}
        aria-label={`${state.label} — reaction pad, round ${round}`}
        className={`flex h-[200px] w-[200px] flex-col items-center justify-center gap-3 rounded-full transition-colors duration-150 ${state.circle} ${
          phase === "done" ? "cursor-default" : "cursor-pointer"
        }`}
      >
        <Icon name={state.icon} filled size={64} />
        <span className="text-base font-semibold leading-6">{state.label}</span>
      </button>

      <h2 className="mt-6 t-h2 text-primary">{state.label}</h2>
      <p className="mt-2 t-body-md text-muted">{hint}</p>

      <ul className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: 3 }, (_, index) => {
          const value = rounds[index];
          const current = index === round - 1;
          return (
            <li
              key={index}
              className={`rounded-pill border px-3 py-1 text-xs font-medium ${
                current
                  ? "border-accent bg-raised text-accent"
                  : "border-line bg-raised text-muted"
              }`}
            >
              Round {index + 1}
              {typeof value === "number" ? ` · ${value} ms` : " · —"}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
