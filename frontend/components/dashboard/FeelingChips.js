"use client";

/**
 * Feeling chips (handoff components.md "Feeling chip").
 *
 *   feeling: Good · Okay · Not great   state: Default · Selected
 *   Icons: sentiment_satisfied / neutral / dissatisfied (Outlined → Filled)
 *   Selected = solid fill by feeling, text and filled icon in text-on-status,
 *   no border.
 *
 * Selecting a chip records a quick mood tap in the store — the answer is then
 * attached to the next check-in (screen 04 reads it back).
 */

import Icon from "@/components/ui/Icon";

export const FEELINGS = [
  {
    id: "good",
    label: "Good",
    icon: "sentiment_satisfied",
    mood: 5,
    selected: "bg-normal",
  },
  {
    id: "okay",
    label: "Okay",
    icon: "sentiment_neutral",
    mood: 3,
    selected: "bg-attention",
  },
  {
    id: "not-great",
    label: "Not great",
    icon: "sentiment_dissatisfied",
    mood: 1,
    selected: "bg-emergency",
  },
];

export function feelingById(id) {
  return FEELINGS.find((f) => f.id === id) || null;
}

export default function FeelingChips({ value, onChange, className = "" }) {
  return (
    <div
      role="radiogroup"
      aria-label="How do you feel today?"
      className={`flex flex-wrap gap-4 ${className}`}
    >
      {FEELINGS.map((feeling) => {
        const selected = value === feeling.id;
        return (
          <button
            key={feeling.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? null : feeling.id)}
            className={`flex h-[122px] w-40 shrink-0 flex-col items-center justify-center gap-4 rounded-lg border-2 transition-colors ${
              selected
                ? `${feeling.selected} border-transparent text-on-status`
                : "border-line bg-surface text-primary hover:bg-hover"
            }`}
          >
            <Icon
              name={feeling.icon}
              filled={selected}
              size={32}
              className={selected ? "" : "text-secondary"}
            />
            <span className="text-base font-semibold leading-6">
              {feeling.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
