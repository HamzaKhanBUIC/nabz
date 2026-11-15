"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import { sectionLabels } from "@/lib/data/reportSections";
import { formatDateTime } from "@/lib/utils/format";

export default function ReportPreview({ preview, loading = false }) {
  if (loading && !preview) {
    return (
      <Card>
        <p className="text-sm text-muted">Generating downlink preview from backend...</p>
      </Card>
    );
  }

  if (!preview) {
    return (
      <Card>
        <p className="text-sm text-muted">
          Select at least one category to preview your Earth downlink summary.
        </p>
      </Card>
    );
  }

  const includedLabels = sectionLabels(preview.selection);

  return (
    <Card>
      <CardHeader
        title="Downlink package preview"
        subtitle={`Mission Day ${preview.missionDay} · Generated ${formatDateTime(preview.generatedAt)}`}
        action={
          <StatusBadge tone="info" dot={false}>
            {preview.selection?.days ?? 7}-day window
          </StatusBadge>
        }
      />

      <div className="mt-4 rounded-md border border-attention/40 bg-attention/10 p-3.5 text-xs text-primary">
        <div className="flex items-start gap-2">
          <Icon name="schedule" size={16} className="mt-0.5 shrink-0 text-attention" />
          <span>{preview.commsDelay?.delayNotice}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {includedLabels.map((label) => (
          <StatusBadge key={label} tone="neutral" dot={false}>
            {label}
          </StatusBadge>
        ))}
        <StatusBadge tone="ok" dot={false}>
          {preview.entries?.length ?? 0} entries
        </StatusBadge>
        <StatusBadge tone="info" dot={false}>
          {preview.cards?.length ?? 0} cards
        </StatusBadge>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Plain-text Earth summary
        </p>
        <pre className="mt-2 max-h-[260px] overflow-y-auto whitespace-pre-wrap rounded-md border border-line bg-canvas p-4 font-mono text-xs leading-6 text-primary">
          {preview.summaryText}
        </pre>
      </div>

      {Array.isArray(preview.entries) && preview.entries.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Included records ({preview.entries.length})
          </p>
          <ul className="mt-2 max-h-[200px] space-y-1.5 overflow-y-auto text-xs">
            {preview.entries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-line bg-raised px-3 py-2"
              >
                <span className="text-primary">{entry.summary}</span>
                <span className="text-muted">Day {entry.missionDay}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-4 border-t border-line pt-3 text-xs font-medium text-muted">
        {preview.disclaimer}
      </p>
    </Card>
  );
}
