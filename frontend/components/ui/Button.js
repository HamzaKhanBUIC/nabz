import Link from "next/link";
import Icon from "@/components/ui/Icon";

/**
 * Button primitive — tactile Apple/Google-smooth transitions while preserving
 * Nova design tokens (Primary, Secondary, Ghost, Danger).
 */
const VARIANTS = {
  primary:
    "bg-primary text-canvas border border-transparent hover:bg-soft",
  secondary:
    "bg-surface text-primary border border-line hover:bg-hover hover:border-line-strong",
  ghost:
    "bg-transparent text-secondary border border-transparent hover:bg-hover hover:text-primary",
  danger:
    "bg-emergency-solid text-white border border-transparent hover:bg-emergency-hover",
};

const SIZES = {
  sm: "min-h-9 px-3.5 py-1.5 gap-1.5 t-label-md",
  md: "min-h-11 px-4 py-2 gap-2 t-label-md font-semibold",
  lg: "min-h-13 px-6 py-2.5 gap-2.5 t-label-lg",
  icon: "h-11 w-11 justify-center",
};

export function buttonClassName(variant = "primary", size = "md", className = "") {
  return [
    "inline-flex items-center justify-center rounded-pill font-heading select-none cursor-pointer",
    "transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-[var(--ease-smooth)]",
    "active:scale-[0.985]",
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
