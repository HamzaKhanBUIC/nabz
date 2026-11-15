"use client";

/**
 * Guided reaction-time test.
 *
 * Flow: start → waiting (random delay) → circle turns green → user clicks
 * or presses Space → reaction time measured in ms → result shown.
 *
 * The result is only ever the measured value — nothing is simulated or
 * pre-generated. Handles false starts ("too early") and timeouts.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Ban, CheckCircle2, Timer } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";

const MIN_DELAY_MS = 1200;
const MAX_DELAY_MS = 4200;
/** If the user has not reacted within this window, treat it as a miss. */
const TIMEOUT_MS = 10_000;

const STATE = {
  idle: "idle",
  waiting: "waiting",
  ready: "ready",
  result: "result",
  tooEarly: "tooEarly",
  timeout: "timeout",
};

export default function ReactionTest({ onResult, onCancel, stepLabel }) {
  const reduceMotion = useReducedMotion();
  const [status, setStatus] = useState(STATE.idle);
  const [elapsed, setElapsed] = useState(null);
  const [countdown, setCountdown] = useState(null);

  const armTimeRef = useRef(null);
  const startTimeoutRef = useRef(null);
  const missTimeoutRef = useRef(null);
  const tickRef = useRef(null);
  const listeningRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
    if (missTimeoutRef.current) clearTimeout(missTimeoutRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    startTimeoutRef.current = null;
    missTimeoutRef.current = null;
    tickRef.current = null;
    listeningRef.current = false;
  }, []);

  // Cleanup on unmount.
  useEffect(() => clearTimers, [clearTimers]);

  const startTest = useCallback(() => {
    clearTimers();
    setStatus(STATE.waiting);
    setElapsed(null);
    const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);

    // Countdown showing approximate wait time (updates every 500ms).
    setCountdown(Math.ceil(delay / 1000));
    tickRef.current = setInterval(() => {
      setCountdown((prev) => (prev && prev > 1 ? prev - 1 : 0));
    }, 500);

    startTimeoutRef.current = setTimeout(() => {
      if (tickRef.current) clearInterval(tickRef.current);
      armTimeRef.current = performance.now();
      listeningRef.current = true;
      setStatus(STATE.ready);

      // Auto-miss if the user never reacts.
      missTimeoutRef.current = setTimeout(() => {
        listeningRef.current = false;
        setStatus(STATE.timeout);
      }, TIMEOUT_MS);
    }, delay);
  }, [clearTimers]);

  const recordReaction = useCallback(() => {
    if (!listeningRef.current || armTimeRef.current == null) return;
    listeningRef.current = false;
    clearTimers();
    const ms = Math.round(performance.now() - armTimeRef.current);
    setElapsed(ms);
    setStatus(STATE.result);
    onResult?.(ms);
  }, [clearTimers, onResult]);

  const handleEarlyClick = useCallback(() => {
    if (status !== STATE.waiting) return;
    clearTimers();
    setStatus(STATE.tooEarly);
  }, [clearTimers, status]);

  // Space / Enter handling.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code !== "Space" && event.code !== "Enter") return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      event.preventDefault();
      if (status === STATE.ready) recordReaction();
      else if (status === STATE.waiting) handleEarlyClick();
      else if (status === STATE.idle) startTest();
      else if (
        status === STATE.tooEarly ||
        status === STATE.timeout ||
        status === STATE.result
      ) {
        startTest();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [status, recordReaction, handleEarlyClick, startTest]);

  const circleLabel = {
    [STATE.idle]: "Start test",
    [STATE.waiting]: `Wait… ${countdown ?? ""}`,
    [STATE.ready]: "CLICK!",
    [STATE.result]: `${elapsed} ms`,
    [STATE.tooEarly]: "Too early",
    [STATE.timeout]: "Missed",
  }[status];

  const circleTone = {
    [STATE.idle]: "bg-canvas border-line text-navy",
    [STATE.waiting]: "bg-nasa-blue-soft border-nasa-blue/30 text-nasa-blue",
    [STATE.ready]: "bg-ok border-ok text-white",
    [STATE.result]: "bg-surface border-nasa-blue text-nasa-blue",
    [STATE.tooEarly]: "bg-warn-soft border-warn/40 text-warn",
    [STATE.timeout]: "bg-bad-soft border-bad/40 text-bad",
  }[status];

  const interactive =
    status === STATE.idle ||
    status === STATE.ready ||
    status === STATE.waiting ||
    status === STATE.tooEarly ||
    status === STATE.timeout;

  const onPress = () => {
    if (status === STATE.idle || status === STATE.tooEarly || status === STATE.timeout) {
      startTest();
    } else if (status === STATE.ready) {
      recordReaction();
    } else if (status === STATE.waiting) {
      handleEarlyClick();
    }
  };

  const instruction = {
    [STATE.idle]: "Press start, then wait for the circle to turn green.",
    [STATE.waiting]:
      "Wait… then click or press Space when it turns green.",
    [STATE.ready]: "Now! Click or press Space.",
    [STATE.result]: "Measured. Try another round or continue.",
    [STATE.tooEarly]: "You clicked too early — go again when ready.",
    [STATE.timeout]: "No reaction recorded in time — go again when ready.",
  }[status];

  return (
    <div className="flex flex-col items-center">
      {stepLabel ? (
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-nasa-blue">
          {stepLabel}
        </p>
      ) : null}

      <div className="relative flex min-h-[280px] w-full items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.button
            key={status}
            type="button"
            onClick={onPress}
            disabled={!interactive}
            aria-label={`${circleLabel}. ${instruction}`}
            className={[
              "flex h-52 w-52 select-none items-center justify-center rounded-full border-4 transition-colors duration-150 sm:h-60 sm:w-60",
              circleTone,
              interactive ? "cursor-pointer" : "cursor-default",
            ].join(" ")}
            initial={reduceMotion ? false : { scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduceMotion ? undefined : { scale: 0.96, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
          >
            <span className="flex flex-col items-center gap-1.5 px-6 text-center">
              <span
                className={`font-mono font-medium leading-none ${
                  status === STATE.ready
                    ? "text-3xl sm:text-4xl"
                    : status === STATE.result
                      ? "text-4xl sm:text-5xl"
                      : "text-xl sm:text-2xl"
                }`}
              >
                {circleLabel}
              </span>
              {status === STATE.result ? (
                <span className="text-xs font-sans text-muted">milliseconds</span>
              ) : status === STATE.ready ? (
                <span className="text-xs font-sans text-white/90">now!</span>
              ) : null}
            </span>
          </motion.button>
        </AnimatePresence>
      </div>

      <p
        className="mt-4 min-h-[40px] max-w-sm text-center text-sm leading-relaxed text-muted"
        aria-live="polite"
      >
        {instruction}
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        {status !== STATE.idle && status !== STATE.result ? (
          <button
            type="button"
            onClick={() => {
              clearTimers();
              setStatus(STATE.idle);
              setElapsed(null);
            }}
            className={buttonClassName("ghost", "sm")}
          >
            <Ban className="h-4 w-4" aria-hidden="true" />
            Cancel test
          </button>
        ) : null}

        {status === STATE.result ? (
          <button
            type="button"
            onClick={startTest}
            className={buttonClassName("secondary", "sm")}
          >
            <Timer className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        ) : null}

        {status === STATE.idle ? (
          <button
            type="button"
            onClick={startTest}
            className={buttonClassName("primary", "md")}
          >
            Start reaction test
          </button>
        ) : null}
      </div>

      {status === STATE.result ? (
        <div
          className="mt-3 flex items-center gap-1.5 text-xs text-ok"
          role="status"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Result saved to this check-in: {elapsed} ms
        </div>
      ) : null}

      {onCancel ? (
        <div className="mt-6 w-full border-t border-line pt-4">
          <button
            type="button"
            onClick={onCancel}
            className={`${buttonClassName("ghost", "sm")} w-full`}
          >
            Cancel check-in
          </button>
        </div>
      ) : null}
    </div>
  );
}
