/**
 * Card primitives — handoff components.md:
 *   Card = Eyebrow · Title · Body, 24px padding, radius-lg,
 *   bg-surface, border-default.
 */

export function Card({ className = "", children, ...rest }) {
  return (
    <section
      className={`rounded-lg border border-line bg-surface shadow-card ${className}`}
      {...rest}
    >
      {children}
    </section>
  );
}

/** Small uppercase label above a card title. */
export function CardEyebrow({ children, className = "" }) {
  return (
    <p className={`t-caption uppercase tracking-[0.14em] text-muted ${className}`}>
      {children}
    </p>
  );
}

export function CardHeader({ title, subtitle, action, icon: IconComp }) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
      <div className="flex min-w-0 items-start gap-3">
        {IconComp ? (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-raised text-accent">
            <IconComp className="h-5 w-5" aria-hidden="true" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="t-label-lg text-primary">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function CardBody({ className = "", children }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ className = "", children }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 border-t border-line px-6 py-5 ${className}`}
    >
      {children}
    </div>
  );
}
