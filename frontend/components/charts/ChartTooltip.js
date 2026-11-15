"use client";

/**
 * Shared Recharts tooltip styled for the Nabz design system.
 * Uses monospace for values and labels the record source (demo vs recorded).
 */

export default function ChartTooltip({ active, payload, label, unit = "", formatter }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2">
      {label ? <p className="mb-1 text-[11px] text-muted">{label}</p> : null}
      <div className="flex flex-col gap-1">
        {payload.map((entry) => {
          const rawValue = entry.value;
          const display =
            typeof formatter === "function" ? formatter(rawValue, entry) : rawValue;
          const source = entry.payload?.source;
          return (
            <div key={entry.dataKey || entry.name} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color || entry.stroke || "var(--color-accent)" }}
                aria-hidden="true"
              />
              <span className="text-xs text-navy">{entry.name}</span>
              <span className="ml-auto tabular-nums text-xs font-medium text-navy">
                {display}
                {unit}
              </span>
              {source === "demo" ? (
                <span className="rounded border border-accent/30 bg-accent-subtle px-1 text-[9px] font-medium text-accent">
                  Demo
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
