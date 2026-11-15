/**
 * Card primitives: radius-lg 20px, bg-surface, a 1px line, no shadow.
 * Responsive padding: 16px mobile -> 24px desktop.
 */

export function Card({ className = "", children, ...rest }) {
  return (
    <section
      className={`rounded-lg border border-line bg-surface transition-colors duration-200 ${className}`}
      {...rest}
    >
      {children}
    </section>
  );
}

export function CardEyebrow({ children, className = "" }) {
  return (
    <p className={`t-caption text-muted ${className}`}>
      {children}
    </p>
  );
}

export function CardHeader({ title, subtitle, action, icon: IconComp, titleAs: Title = "h2" }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex min-w-[min(100%,190px)] flex-1 items-start gap-3">
        {IconComp ? (
          <IconComp className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
        ) : null}
        <div className="min-w-0 flex-1">
          <Title className="t-label-lg text-primary">{title}</Title>
          {subtitle ? (
            <p className="mt-1 text-sm leading-5 text-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function CardBody({ className = "", children }) {
  return <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ className = "", children }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 border-t border-line px-4 py-4 sm:px-6 sm:py-5 ${className}`}
    >
      {children}
    </div>
  );
}
