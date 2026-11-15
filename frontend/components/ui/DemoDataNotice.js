"use client";

/**
 * Banner shown when demo records are present, so mock data is never
 * mistaken for real recorded measurements.
 *
 * Renders below the Today grid (the one place the handoff leaves open for
 * operational notices) and disappears entirely once the demo set is removed.
 */

import Icon from "@/components/ui/Icon";
import { useStore } from "@/lib/data/store";

export default function DemoDataNotice() {
  const store = useStore();
  if (!store.hasDemoData) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-raised px-4 py-3">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface text-accent"
        aria-hidden="true"
      >
        <Icon name="science" size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-primary">
          Demo dataset is loaded
        </p>
        <p className="text-xs text-muted">
          Records marked &ldquo;Demo&rdquo; are sample values for previewing
          charts — they are not measurements you recorded.
        </p>
      </div>
      <button
        type="button"
        onClick={store.removeDemoData}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-xs font-medium text-secondary transition-colors hover:bg-hover hover:text-primary"
      >
        <Icon name="close" size={16} />
        Remove demo data
      </button>
    </div>
  );
}
