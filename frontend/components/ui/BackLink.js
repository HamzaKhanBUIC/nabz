import Link from "next/link";
import Icon from "@/components/ui/Icon";

export default function BackLink({
  href,
  onClick,
  children,
  className = "",
}) {
  const classes = `inline-flex min-h-10 items-center gap-1.5 -ml-2 px-2 py-1.5 rounded-md t-label-md text-secondary transition-[transform,color,background-color] duration-150 ease-[var(--ease-smooth)] hover:bg-hover/60 hover:text-primary active:scale-[0.98] ${className}`;
  const content = (
    <>
      <Icon name="arrow_back" size={18} />
      <span>{children}</span>
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
