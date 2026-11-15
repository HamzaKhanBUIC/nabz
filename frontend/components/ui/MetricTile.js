/**
 * Metric tile — Nova rounded-lg surface with crisp tabular typography.
 */
export default function MetricTile({
  label,
  value,
  unit,
  helper,
  bare = false,
  className = "",
}) {
  return (
    <div
      className={`${bare ? "" : "rounded-lg border border-line bg-surface"} p-4 sm:p-6 ${className}`}
    >
      <p className="t-label-md text-secondary">{label}</p>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2 t-metric text-primary">
        <span className="whitespace-nowrap tabular-nums">{value}</span>
        {unit ? (
          <span className="t-body-md font-normal whitespace-nowrap text-muted">{unit}</span>
        ) : null}
      </p>
      {helper ? (
        <p className="mt-2 text-sm leading-5 text-muted">{helper}</p>
      ) : null}
    </div>
  );
}
