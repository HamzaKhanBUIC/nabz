"use client";

/**
 * Empty-state helper that offers to load the clearly-labelled demo dataset
 * (only when no recorded data exists). Keeps mock data explicit.
 */

import { FlaskConical } from "lucide-react";
import { useStore } from "@/lib/data/store";
import { hasAnyRecordedData } from "@/lib/data/selectors";
import { buttonClassName } from "@/components/ui/Button";

export default function DemoDataAction({ className = "" }) {
  const store = useStore();

  if (store.hydrated && hasAnyRecordedData(store)) return null;
  if (store.hasDemoData) return null;

  return (
    <button
      type="button"
      onClick={store.loadDemoData}
      className={`inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-nasa-blue ${className}`}
    >
      <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
      Load demo dataset (clearly labelled)
    </button>
  );
}

/** Secondary style variant used inside empty states. */
export function DemoDataButton() {
  const store = useStore();
  if (store.hydrated && hasAnyRecordedData(store)) return null;
  if (store.hasDemoData) return null;

  return (
    <button
      type="button"
      onClick={store.loadDemoData}
      className={buttonClassName("secondary", "sm")}
    >
      <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
      Load demo data
    </button>
  );
}
