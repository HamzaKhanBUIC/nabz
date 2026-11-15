"use client";

/**
 * SVG illustration of correct blood-pressure cuff placement.
 * Pure SVG (no raster images) — scales responsively.
 *
 * @param {"idle"|"correct"|"wrong-high"|"wrong-low"} variant
 */

export default function CuffPlacementIllustration({
  variant = "idle",
  className = "",
}) {
  const cuffY =
    variant === "wrong-high" ? 96 : variant === "wrong-low" ? 176 : 134;
  const cuffLabel =
    variant === "wrong-high"
      ? "Too high on the arm"
      : variant === "wrong-low"
        ? "Too low on the arm"
        : "Correct position";

  const cuffStroke =
    variant === "correct"
      ? "var(--color-normal)"
      : variant === "idle"
        ? "var(--color-accent)"
        : "var(--color-emergency)";

  return (
    <figure className={`rounded-xl border border-line bg-canvas/70 p-4 ${className}`}>
      <svg
        viewBox="0 0 240 260"
        className="h-auto w-full"
        role="img"
        aria-label={`Blood pressure cuff placement illustration: ${cuffLabel}`}
      >
        <title>Blood pressure cuff placement</title>
        <desc>
          Upper arm with a cuff wrapped around the bicep, a tube running to the
          monitor, and a marker for correct placement two to three centimetres
          above the elbow crease.
        </desc>

        {/* Torso hint (context) */}
        <path
          d="M60 10 h60 c10 0 16 8 16 18 v70 h-92 v-70 c0 -10 6 -18 16 -18 z"
          fill="var(--color-surface)"
          stroke="var(--color-line-strong)"
          strokeWidth="1.5"
        />
        <text x="90" y="56" textAnchor="middle" fontSize="10" fill="var(--color-muted)" fontFamily="monospace">
          SHOULDER
        </text>

        {/* Upper arm */}
        <path
          d="M112 98
             c22 0 34 12 34 34
             v54
             c0 10 -6 18 -16 20
             l-30 4
             c-12 2 -22 -6 -22 -18
             v-58
             c0 -22 12 -36 34 -36 z"
          fill="var(--color-raised)"
          stroke="var(--color-line-strong)"
          strokeWidth="1.5"
        />

        {/* Elbow crease reference */}
        <path
          d="M92 196 q28 -8 54 0"
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <text x="176" y="200" fontSize="9" fill="var(--color-muted)" fontFamily="monospace">
          ELBOW
        </text>

        {/* Guidance line: 2–3 cm above elbow */}
        <g>
          <line x1="76" y1={cuffY + 34} x2="76" y2="194" stroke="var(--color-muted)" strokeWidth="1" strokeDasharray="3 3" />
          <path d={`M72 ${cuffY + 34} h8 M72 194 h8`} stroke="var(--color-muted)" strokeWidth="1" />
          <text x="60" y={cuffY + 62} fontSize="9" fill="var(--color-muted)" fontFamily="monospace">
            2-3 cm
          </text>
        </g>

        {/* Cuff */}
        <g>
          <rect
            x="70"
            y={cuffY}
            width="96"
            height="56"
            rx="10"
            fill={cuffStroke}
            fillOpacity={variant === "idle" ? 0.14 : 0.18}
            stroke={cuffStroke}
            strokeWidth="2.5"
          />
          {/* Velcro texture */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line
              key={i}
              x1={82 + i * 14}
              y1={cuffY + 8}
              x2={82 + i * 14}
              y2={cuffY + 48}
              stroke={cuffStroke}
              strokeWidth="1"
              strokeOpacity="0.35"
            />
          ))}
          {/* Tube to monitor */}
          <path
            d={`M166 ${cuffY + 16} c26 0 34 -10 34 -26 v-16`}
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* Monitor */}
        <g>
          <rect x="186" y="14" width="42" height="44" rx="6" fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth="1" />
          <text x="207" y="30" textAnchor="middle" fontSize="8" fill="var(--color-muted)" fontFamily="monospace">
            mmHg
          </text>
          <text x="207" y="48" textAnchor="middle" fontSize="13" fill="var(--color-primary)" fontFamily="monospace">
            118
          </text>
        </g>

        {/* Verdict badge */}
        <g>
          <rect
            x="112"
            y="228"
            width="120"
            height="24"
            rx="6"
            fill={cuffStroke}
            fillOpacity="0.12"
            stroke={cuffStroke}
            strokeWidth="1"
          />
          <text
            x="172"
            y="244"
            textAnchor="middle"
            fontSize="10"
            fill={cuffStroke}
            fontFamily="monospace"
          >
            {cuffLabel}
          </text>
        </g>
      </svg>

      <figcaption className="mt-3 text-center text-xs text-muted">
        Cuff edge sits <span className="font-mono">2 to 3 cm</span> above the elbow
        crease, snug on bare skin, heart level.
      </figcaption>
    </figure>
  );
}
