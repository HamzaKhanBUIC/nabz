import Icon from "@/components/ui/Icon";

/**
 * Instruction step — handoff components.md:
 *   "state: Todo, Done · Text, Number · Tap toggles Done
 *    (check_circle filled, status-normal)"
 *
 * Measured: 640x66, radius-md, bg-surface, border-default, padding 16,
 * 32px number circle on bg-raised, gap 12 to the text (16/400).
 */
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
      className={`flex w-full max-w-[640px] items-center gap-3 rounded-md border border-line bg-surface p-4 text-left transition-colors ${
        interactive ? "hover:bg-hover" : ""
      } ${className}`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          done ? "bg-normal text-on-status" : "bg-raised text-secondary"
        }`}
      >
        {done ? (
          <Icon name="check_circle" filled size={20} />
        ) : (
          <span className="text-sm font-medium leading-5">{number}</span>
        )}
      </span>
      <span
        className={`t-body-md ${done ? "text-muted line-through" : "text-soft"}`}
      >
        {children}
      </span>
    </Tag>
  );
}
