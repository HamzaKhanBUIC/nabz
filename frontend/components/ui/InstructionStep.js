import Icon from "@/components/ui/Icon";

export default function InstructionStep({
  number,
  children,
  done = false,
  onToggle,
  className = "",
}) {
  const interactive = typeof onToggle === "function";
  const Tag = interactive ? "button" : "div";

  return (
    <Tag
      {...(interactive ? { type: "button", onClick: onToggle } : {})}
      aria-pressed={interactive ? done : undefined}
      className={`flex w-full items-start gap-3 rounded-md border border-line bg-surface p-3.5 sm:p-4 text-left transition-[transform,background-color,border-color] duration-150 ease-[var(--ease-smooth)] ${
        interactive
          ? "cursor-pointer hover:bg-hover hover:border-line-strong active:scale-[0.99]"
          : ""
      } ${className}`}
    >
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${
          done ? "bg-normal text-on-status" : "bg-raised text-secondary"
        }`}
      >
        {done ? (
          <Icon name="check_circle" filled size={18} />
        ) : (
          <span className="text-sm font-medium leading-5 tabular-nums">{number}</span>
        )}
      </span>
      <span
        className={`t-body-md leading-6 ${
          done ? "text-muted line-through" : "text-soft"
        }`}
      >
        {children}
      </span>
    </Tag>
  );
}
