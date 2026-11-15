/**
 * Metric tile — handoff components.md:
 *   "Label, Value, Unit, Helper · Value in Data/Metric 48px"
 *
 * Measured: 520x162 (also used at 340x162), padding 24, radius-lg.
 */
export default function MetricTile({
  label,
  value,
  unit,
  helper,
  className = "",
}) {
  return (
    <div
      className={`rounded-lg border border-line bg-surface p-6 ${className}`}
    >
      <p className="t-label-md text-secondary">{label}</p>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2 t-metric text-primary">
        <span>{value}</span>
        {unit ? (
          <span className="t-body-md font-normal text-muted">{unit}</span>
        ) : null}
      </p>
      {helper ? (
        <p className="mt-2 text-sm leading-5 text-muted">{helper}</p>
      ) : null}
    </div>
  );
}
