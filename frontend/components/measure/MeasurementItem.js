import Link from "next/link";
import Icon from "@/components/ui/Icon";

/**
 * Measurement item — handoff components.md:
 *   "560px row: 48px icon box (bg-raised), text, chevron_right"
 * Measured on screen 05: 720x82, padding 16/24, radius-lg, border-default.
 */
export default function MeasurementItem({
  href,
  title,
  subtitle,
  icon,
  onClick,
}) {
  const inner = (
    <>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-raised text-accent">
        <Icon name={icon} size={24} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-semibold leading-6 text-primary">
          {title}
        </span>
        <span className="block truncate text-sm leading-5 text-muted">
          {subtitle}
        </span>
      </span>
      <Icon name="chevron_right" size={24} className="shrink-0 text-muted" />
    </>
  );

  const className =
    "interactive-surface flex w-full max-w-[720px] items-center gap-4 rounded-lg border border-line bg-surface px-4 py-3.5 text-left sm:px-6 sm:py-4";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
