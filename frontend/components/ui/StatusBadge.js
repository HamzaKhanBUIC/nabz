import Icon from "@/components/ui/Icon";

/**
 * Health / system status pill — handoff components.md:
 *   "Solid status-* fill, text and icon in text-on-status.
 *    check_circle / warning / error (filled). radius-pill."
 *
 * The icon rule (NASA-STD-3001 display guidance) requires an icon **and** a
 * text label, never colour alone — hence `filled` + `label` on every pill.
 */
const STATUSES = {
  normal: { className: "bg-normal", icon: "check_circle" },
  attention: { className: "bg-attention", icon: "warning" },
  emergency: { className: "bg-emergency", icon: "error" },
};

export function StatusPill({
  status = "normal",
  children,
  className = "",
}) {
  const tone = STATUSES[status] || STATUSES.normal;
  return (
    <span
      className={`inline-flex h-9 items-center gap-1.5 rounded-pill px-3.5 text-sm font-semibold leading-5 text-on-status ${tone.className} ${className}`}
    >
      <Icon name={tone.icon} filled size={18} />
      {children}
    </span>
  );
}

/**
 * Neutral badge for non-status metadata (demo markers, timestamps, counts).
 * Deliberately a neutral surface + neutral border so it never competes with a
 * real health status, and never a tinted background with a same-colour border.
 */
const TONES = {
  ok: "bg-raised text-normal border border-line",
  warn: "bg-raised text-attention border border-line",
  bad: "bg-raised text-emergency border border-line",
  info: "bg-raised text-accent border border-line",
  neutral: "bg-raised text-secondary border border-line",
  demo: "bg-raised text-attention border border-line",
  danger: "bg-raised text-emergency border border-line",
};

const DOT_TONES = {
  ok: "bg-normal",
  warn: "bg-attention",
  bad: "bg-emergency",
  info: "bg-accent",
  neutral: "bg-muted",
  demo: "bg-attention",
  danger: "bg-emergency",
};

export default function StatusBadge({
  tone = "neutral",
  children,
  dot = true,
  className = "",
}) {
  const toneClass = TONES[tone] || TONES.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-xs font-medium ${toneClass} ${className}`}
    >
      {dot ? (
        <span
          className={`h-1.5 w-1.5 rounded-full ${DOT_TONES[tone] || DOT_TONES.neutral}`}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  );
}

/** Small label used next to demo records so mock vs recorded stays obvious. */
export function DemoBadge() {
  return (
    <StatusBadge tone="demo" dot={false}>
      Demo
    </StatusBadge>
  );
}
