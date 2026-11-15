import Link from "next/link";
import Icon from "@/components/ui/Icon";

/**
 * Button primitive — handoff components.md:
 *   kind:    Primary · Secondary · Ghost · Danger
 *   size:    Large (56px) · Medium (44px)
 *   radius:  radius-md (10px)
 *
 * Rules enforced by the screens that use it: one Primary per screen, and
 * Danger only inside Emergency (with the filled `emergency` icon).
 *
 * Renders as <button> by default, or as a Next <Link> when `href` is given.
 */

const VARIANTS = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover border border-transparent",
  secondary:
    "bg-surface text-primary border border-line hover:bg-hover",
  ghost: "bg-transparent text-secondary border border-transparent hover:bg-hover hover:text-primary",
  danger:
    "bg-emergency text-white border border-transparent hover:bg-emergency-hover",
};

const SIZES = {
  sm: "h-9 px-3.5 gap-1.5 t-label-md",
  md: "h-11 px-4 gap-2 t-label-md font-semibold",
  lg: "h-14 px-6 gap-3 t-label-lg",
  icon: "h-11 w-11 justify-center",
};

export function buttonClassName(variant = "primary", size = "md", className = "") {
  return [
    "inline-flex items-center justify-center rounded-md font-heading select-none",
    "transition-colors duration-150",
    "disabled:opacity-50 disabled:pointer-events-none",
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  href,
  type = "button",
  arrow = false,
  icon,
  iconFilled = false,
  children,
  ...rest
}) {
  const classes = buttonClassName(variant, size, className);

  const content = (
    <>
      {icon ? <Icon name={icon} filled={iconFilled} size={size === "sm" ? 16 : 20} /> : null}
      {children}
      {arrow ? <Icon name="arrow_forward" size={18} /> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...rest}>
      {content}
    </button>
  );
}
