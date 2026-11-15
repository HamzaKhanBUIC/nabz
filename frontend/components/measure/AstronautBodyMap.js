"use client";

/**
 * Interactive astronaut body map — native SVG React component.
 *
 * - Front-facing, anatomically simplified figure.
 * - Distinguishable, clickable regions (head, chest, abdomen, arms, legs).
 * - Hover + selected highlighting, keyboard accessible (tabindex, role, aria).
 * - Responsive: scales with its container via viewBox.
 *
 * Foundation for future health measurement and symptom-reporting features.
 * No static images are used — every shape is real SVG.
 */

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** Region metadata driving both the shapes and the side panel. */
export const BODY_REGIONS = [
  {
    id: "head",
    label: "Head",
    description:
      "Head, face and neck. Relevant for headache, dizziness, vision changes or sleep quality follow-ups.",
    metrics: ["Reaction time", "Sleep hours"],
  },
  {
    id: "chest",
    label: "Chest",
    description:
      "Chest and upper torso. Relevant for breathing, heart rate and blood pressure context.",
    metrics: ["Blood pressure", "Pulse"],
  },
  {
    id: "abdomen",
    label: "Abdomen",
    description:
      "Abdomen and lower torso. Relevant for digestion, hydration and appetite notes.",
    metrics: ["Hydration", "Appetite"],
  },
  {
    id: "left-arm",
    label: "Left arm",
    description:
      "Left arm, including the upper arm where a blood pressure cuff is placed.",
    metrics: ["Blood pressure cuff site"],
  },
  {
    id: "right-arm",
    label: "Right arm",
    description: "Right arm. Used as the alternate site for cuff placement.",
    metrics: ["Blood pressure cuff site"],
  },
  {
    id: "left-leg",
    label: "Left leg",
    description:
      "Left leg. Relevant for mobility, muscle soreness and microgravity deconditioning notes.",
    metrics: ["Mobility notes"],
  },
  {
    id: "right-leg",
    label: "Right leg",
    description:
      "Right leg. Relevant for mobility, muscle soreness and microgravity deconditioning notes.",
    metrics: ["Mobility notes"],
  },
];

const SHAPE_STYLE = (state) => {
  if (state === "selected")
    return { fill: "var(--color-accent)", fillOpacity: 0.9, stroke: "var(--color-primary)", strokeWidth: 1.5 };
  if (state === "hover")
    return { fill: "var(--color-accent)", fillOpacity: 0.35, stroke: "var(--color-accent)", strokeWidth: 1.5 };
  return { fill: "var(--color-raised)", fillOpacity: 1, stroke: "var(--color-line-strong)", strokeWidth: 1.2 };
};

export default function AstronautBodyMap({
  selected,
  onSelect,
  className = "",
  showLabels = true,
}) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(null);

  const stateFor = (id) => {
    if (selected === id) return "selected";
    if (hovered === id) return "hover";
    return "idle";
  };

  const activeRegion = useMemo(
    () => BODY_REGIONS.find((region) => region.id === selected) || null,
    [selected]
  );

  const handleSelect = (id) => {
    onSelect?.(selected === id ? null : id);
  };

  /** Shared props for each interactive region shape. */
  const regionProps = (id, label) => ({
    role: "button",
    tabIndex: 0,
    "aria-label": `${label} region`,
    "aria-pressed": selected === id,
    onClick: () => handleSelect(id),
    onKeyDown: (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleSelect(id);
      }
    },
    onMouseEnter: () => setHovered(id),
    onMouseLeave: () => setHovered((prev) => (prev === id ? null : prev)),
    onFocus: () => setHovered(id),
    onBlur: () => setHovered((prev) => (prev === id ? null : prev)),
    style: { cursor: "pointer", transition: reduceMotion ? "none" : "fill 150ms ease" },
    ...SHAPE_STYLE(stateFor(id)),
  });

  return (
    <div className={className}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* SVG figure */}
        <div className="relative mx-auto w-full max-w-[240px] shrink-0 rounded-xl border border-line bg-canvas/70 p-3">
          <svg
            viewBox="0 0 200 380"
            className="h-auto w-full"
            aria-label="Interactive astronaut body map"
          >
            <title>Interactive astronaut body map</title>
            <desc>
              Front-facing astronaut figure with selectable body regions: head,
              chest, abdomen, arms and legs.
            </desc>

            {/* Helmet backdrop (decorative) */}
            <ellipse
              cx="100"
              cy="58"
              rx="46"
              ry="52"
              fill="var(--color-surface)"
              stroke="var(--color-line)"
              strokeWidth="2"
            />
            <path
              d="M54 58 a46 52 0 0 1 92 0"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="1"
              strokeOpacity="0.25"
            />

            {/* HEAD */}
            <g {...regionProps("head", "Head")}>
              <path
                d="M100 16
                   c-15 0 -26 11 -26 26
                   c0 9 4 16 10 21
                   c-4 4 -6 9 -6 15
                   c0 8 9 14 22 14
                   s22 -6 22 -14
                   c0 -6 -2 -11 -6 -15
                   c6 -5 10 -12 10 -21
                   c0 -15 -11 -26 -26 -26 z"
              />
            </g>

            {/* NECK */}
            <path
              d="M90 86 h20 v10 h-20 z"
              fill="var(--color-raised)"
              stroke="var(--color-line-strong)"
              strokeWidth="1.2"
            />

            {/* CHEST */}
            <g {...regionProps("chest", "Chest")}>
              <path
                d="M100 96
                   c-14 0 -26 4 -34 11
                   c-8 7 -12 18 -12 30
                   v34
                   c0 6 4 10 10 10
                   h72
                   c6 0 10 -4 10 -10
                   v-34
                   c0 -12 -4 -23 -12 -30
                   c-8 -7 -20 -11 -34 -11 z"
              />
            </g>

            {/* ABDOMEN */}
            <g {...regionProps("abdomen", "Abdomen")}>
              <path
                d="M54 181
                   h92
                   c4 0 6 3 6 7
                   v34
                   c0 12 -10 22 -24 22
                   h-56
                   c-14 0 -24 -10 -24 -22
                   v-34
                   c0 -4 2 -7 6 -7 z"
              />
            </g>

            {/* LEFT ARM (viewer's right side of figure = figure's left) */}
            <g {...regionProps("left-arm", "Left arm")}>
              <path
                d="M54 110
                   c-8 3 -14 11 -16 22
                   l-9 56
                   c-1 8 3 14 10 15
                   c7 1 13 -4 14 -12
                   l8 -44
                   v-25 z"
              />
              <path
                d="M34 196
                   c-1 6 2 11 8 12
                   c6 1 11 -3 12 -9
                   l4 -22
                   l-16 -6 z"
              />
            </g>

            {/* RIGHT ARM */}
            <g {...regionProps("right-arm", "Right arm")}>
              <path
                d="M146 110
                   c8 3 14 11 16 22
                   l9 56
                   c1 8 -3 14 -10 15
                   c-7 1 -13 -4 -14 -12
                   l-8 -44
                   v-25 z"
              />
              <path
                d="M166 196
                   c1 6 -2 11 -8 12
                   c-6 1 -11 -3 -12 -9
                   l-4 -22
                   l16 -6 z"
              />
            </g>

            {/* LEFT LEG */}
            <g {...regionProps("left-leg", "Left leg")}>
              <path
                d="M56 254
                   h38
                   v56
                   c0 30 -3 56 -7 74
                   c-2 8 -9 13 -17 11
                   c-8 -2 -12 -9 -11 -17
                   c3 -20 5 -44 5 -66 z"
              />
            </g>

            {/* RIGHT LEG */}
            <g {...regionProps("right-leg", "Right leg")}>
              <path
                d="M144 254
                   h-38
                   v56
                   c0 30 3 56 7 74
                   c2 8 9 13 17 11
                   c8 -2 12 -9 11 -17
                   c-3 -20 -5 -44 -5 -66 z"
              />
            </g>

            {/* Belt detail (decorative) */}
            <rect
              x="54"
              y="238"
              width="92"
              height="14"
              rx="4"
              fill="var(--color-surface)"
              fillOpacity="0.4"
              stroke="var(--color-line)"
              strokeWidth="1"
            />
            <rect x="92" y="240" width="16" height="10" rx="2" fill="var(--color-emergency)" />

            {/* Region labels */}
            {showLabels ? (
              <g aria-hidden="true">
                <text x="100" y="12" textAnchor="middle" fontSize="9" fill="var(--color-muted)" fontFamily="monospace">
                  HEAD
                </text>
                <text x="100" y="150" textAnchor="middle" fontSize="9" fill="var(--color-muted)" fontFamily="monospace">
                  CHEST
                </text>
                <text x="100" y="215" textAnchor="middle" fontSize="9" fill="var(--color-muted)" fontFamily="monospace">
                  ABDOMEN
                </text>
              </g>
            ) : null}
          </svg>
        </div>

        {/* Side panel */}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-nasa-blue">
            Body regions
          </p>
          <p className="mt-1 text-sm text-muted">
            Select a region to view context. This map is the foundation for
            future symptom reporting.
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {BODY_REGIONS.map((region) => {
              const active = selected === region.id;
              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => handleSelect(region.id)}
                  aria-pressed={active}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                    active
                      ? "border-nasa-blue bg-nasa-blue text-white"
                      : "border-line bg-surface text-navy hover:border-nasa-blue/40 hover:bg-canvas"
                  }`}
                >
                  {region.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {activeRegion ? (
              <motion.div
                key={activeRegion.id}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
                className="mt-3 rounded-xl border border-line bg-surface p-4 shadow-card"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-nasa-blue" aria-hidden="true" />
                  <h4 className="text-sm font-semibold">{activeRegion.label}</h4>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  {activeRegion.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {activeRegion.metrics.map((metric) => (
                    <span
                      key={metric}
                      className="rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-[10px] text-navy"
                    >
                      {metric}
                    </span>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 rounded-xl border border-dashed border-line bg-canvas/60 p-4 text-center"
              >
                <p className="text-xs text-muted">
                  No region selected. Pick a body part on the figure or the
                  chips above.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
