import Link from "next/link";
import Icon from "@/components/ui/Icon";

/**
 * Back link — handoff components.md:
 *   "arrow_back + Label/Medium, top-left of sub-screens."
 * Measured at y112 (content top), 14/500, `--color-text-secondary`.
 */
export default function BackLink({
  href,
  onClick,
  children,
  className = "",
}) {
  const classes = `inline-flex h-5 items-center gap-2 t-label-md text-secondary transition-colors hover:text-primary ${className}`;
  const content = (
    <>
      <Icon name="arrow_back" size={20} />
      {children}
    </>
  );

  if (onClick && !href) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href || "/"} className={classes} onClick={onClick}>
      {content}
    </Link>
  );
}
