import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";

/**
 * Standard empty state: explains why a section is empty and offers a way out.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  onSecondary,
  compact = false,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-canvas/60 text-center ${
        compact ? "px-4 py-6" : "px-6 py-10"
      }`}
    >
      {Icon ? (
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-surface border border-line text-muted">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      ) : null}
      <h3 className="text-sm font-semibold text-navy">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
      {(actionLabel || secondaryLabel) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {actionLabel &&
            (onAction ? (
              <button
                type="button"
                onClick={onAction}
                className={buttonClassName("primary", "sm")}
              >
                {actionLabel}
              </button>
            ) : (
              <Link
                href={actionHref || "/check-in"}
                className={buttonClassName("primary", "sm")}
              >
                {actionLabel}
              </Link>
            ))}
          {secondaryLabel && onSecondary ? (
            <button
              type="button"
              onClick={onSecondary}
              className={buttonClassName("secondary", "sm")}
            >
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
