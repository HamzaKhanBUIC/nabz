/**
 * Monospace value display used for technical readings and mission statistics.
 */

export default function Stat({ label, value, unit, tone = "default", size = "md" }) {
  const valueSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  const valueTone =
    tone === "red"
      ? "text-nasa-red"
      : tone === "ok"
        ? "text-ok"
        : tone === "warn"
          ? "text-warn"
          : "text-navy";

  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className={`mt-1 font-mono font-medium leading-none ${valueSize} ${valueTone}`}>
        {value}
        {unit ? (
          <span className="ml-1 text-xs font-normal text-muted">{unit}</span>
        ) : null}
      </p>
    </div>
  );
}
