import { Activity } from "lucide-react";

/** Route-level loading state for the check-in flow. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse">
      <div className="mb-6 h-4 w-32 rounded bg-line" />
      <div className="mb-6 h-8 w-64 rounded bg-line" />
      <div className="rounded-xl border border-line bg-surface p-6">
        <div className="mb-4 h-6 w-48 rounded bg-line" />
        <div className="mb-6 h-2 w-full rounded-full bg-canvas" />
        <div className="flex justify-center py-8">
          <div className="h-52 w-52 rounded-full border-4 border-line bg-canvas sm:h-60 sm:w-60" />
        </div>
        <div className="mx-auto mb-2 h-4 w-72 rounded bg-line" />
        <div className="mx-auto flex justify-center gap-2">
          <div className="h-9 w-24 rounded-lg bg-line" />
          <div className="h-9 w-28 rounded-lg bg-line" />
        </div>
      </div>
      <span className="sr-only">
        <Activity aria-hidden="true" /> Loading check-in
      </span>
    </div>
  );
}
