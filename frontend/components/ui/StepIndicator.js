/**
 * Step indicator — handoff components.md:
 *   "'Step N of 4' + 4 segments (accent-primary done, border-strong to do)"
 *
 * Two measured geometries (1440px reference):
 *   - sub-screens: fixed 480px wide, segments 114px, gap 8, height 6, at the
 *     content's left edge (x288, y256).
 *   - emergency: full content width (x64 → x1376), segments 322px, gap 8,
 *     height 6, at y140.
 */
export default function StepIndicator({
  step,
  total = 4,
  variant = "sub",
  className = "",
}) {
  const full = variant === "full";

  return (
    <div
      className={`${full ? "w-full" : "w-full max-w-[480px]"} ${className}`}
    >
      <p
        className={`t-label-md ${full ? "text-secondary" : "text-muted"}`}
        aria-current="step"
      >
        Step {step} of {total}
      </p>
      <div className={`${full ? "mt-2" : "mt-1"} flex gap-2`} aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-pill ${
              index < step ? "bg-accent" : "bg-line-strong"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
