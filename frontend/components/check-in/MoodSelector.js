"use client";

/**
 * Mood selection (1–5). Used on the Today dashboard (quick log) and inside
 * the check-in flow. Reports the chosen value via onMood.
 */

import { motion, useReducedMotion } from "framer-motion";

export const MOOD_OPTIONS = [
  { value: 1, label: "Very low", face: "😞", color: "#B91C1C" },
  { value: 2, label: "Low", face: "😕", color: "#B45309" },
  { value: 3, label: "Okay", face: "😐", color: "#737B89" },
  { value: 4, label: "Good", face: "🙂", color: "#0B3D91" },
  { value: 5, label: "Great", face: "😄", color: "#15803D" },
];

export function moodLabel(value) {
  return MOOD_OPTIONS.find((m) => m.value === value)?.label || "—";
}

export default function MoodSelector({
  value,
  onMood,
  name = "mood",
  compact = false,
  disabled = false,
}) {
  const reduceMotion = useReducedMotion();

  return (
    <fieldset className="w-full">
      <legend className="sr-only">Select your mood from 1 to 5</legend>
      <div
        role="radiogroup"
        aria-label="Mood"
        className="grid w-full grid-cols-5 gap-2"
      >
        {MOOD_OPTIONS.map((mood) => {
          const selected = value === mood.value;
          return (
            <button
              key={mood.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`Mood ${mood.value} of 5 — ${mood.label}`}
              disabled={disabled}
              onClick={() => onMood?.(mood.value)}
              className={[
                "group relative flex flex-col items-center justify-center gap-1 rounded-xl border transition-all duration-150",
                compact ? "py-2.5" : "py-3.5",
                "min-h-[64px] touch-manipulation",
                selected
                  ? "border-nasa-blue bg-nasa-blue-soft shadow-card"
                  : "border-line bg-surface hover:border-nasa-blue/40 hover:bg-canvas",
                "disabled:opacity-50 disabled:pointer-events-none",
              ].join(" ")}
            >
              <motion.span
                className={`leading-none ${compact ? "text-xl" : "text-2xl"}`}
                style={{ filter: selected ? "none" : "grayscale(0.35)" }}
                animate={
                  reduceMotion
                    ? undefined
                    : selected
                      ? { scale: [1, 1.18, 1] }
                      : { scale: 1 }
                }
                transition={{ duration: 0.28, ease: "easeOut" }}
                aria-hidden="true"
              >
                {mood.face}
              </motion.span>
              <span
                className={`font-mono text-[11px] leading-none ${
                  selected ? "font-medium text-nasa-blue" : "text-muted"
                }`}
              >
                {mood.value}
              </span>
              <span className="sr-only">{mood.label}</span>
            </button>
          );
        })}
      </div>
      <div
        className="mt-2 flex justify-between px-1 text-[10px] text-muted"
        aria-hidden="true"
      >
        <span>Very low</span>
        <span>Great</span>
      </div>
      <p className="sr-only" aria-live="polite">
        {value ? `Selected mood: ${value} of 5, ${moodLabel(value)}` : "No mood selected"}
      </p>
    </fieldset>
  );
}
