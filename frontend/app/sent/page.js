"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BackLink from "@/components/ui/BackLink";
import { Card, CardHeader } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import { useStore } from "@/lib/data/store";
import { getEarthDelayLabel } from "@/lib/data/mission";
import { formatDateTime } from "@/lib/utils/format";

function SentPageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { outbox, mission } = useStore();

  const record = outbox.find((item) => item.id === id) || outbox[0] || null;

  return (
    <div className="space-y-6">
      <BackLink href="/">Today</BackLink>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="t-label-md text-muted">
            Downlink queue · {getEarthDelayLabel(mission)}
          </p>
          <h1 className="t-h1 mt-1 text-primary">
            {record ? "Summary queued for Earth" : "Downlink outbox"}
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Confirmed by crew. Queued packages transmit cleanly once the high-gain window opens.
          </p>
        </div>

        <StatusBadge tone="ok" dot={false} className="py-1.5 text-sm">
          <Icon name="check_circle" size={16} />
          <span>{record ? `Status: ${record.status}` : "Outbox ready"}</span>
        </StatusBadge>
      </div>

      {record ? (
        <Card>
          <CardHeader
            title={`Package ${record.id}`}
            subtitle={`Queued ${formatDateTime(record.queuedAt)} · Mission Day ${record.package?.missionDay}`}
            action={
              <StatusBadge tone="info" dot={false}>
                {record.package?.entries?.length ?? 0} entries
              </StatusBadge>
            }
          />

          <p className="mt-3 text-xs text-attention">
            {record.package?.commsDelay?.delayNotice}
          </p>

          <pre className="mt-4 max-h-[280px] overflow-y-auto whitespace-pre-wrap rounded-md border border-line bg-canvas p-4 font-mono text-xs leading-6 text-primary">
            {record.package?.summaryText}
          </pre>

          <p className="mt-4 text-xs text-muted">{record.package?.disclaimer}</p>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-muted">
            No downlink packages have been queued in this session yet.
          </p>
        </Card>
      )}

      {outbox.length > 1 ? (
        <Card>
          <CardHeader title={`Earlier queued packages (${outbox.length - 1})`} />
          <ul className="mt-3 space-y-2 text-xs">
            {outbox.slice(1).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded border border-line bg-raised px-3 py-2"
              >
                <span className="font-mono text-primary">{item.id}</span>
                <span className="text-muted">
                  Day {item.package?.missionDay} · {formatDateTime(item.queuedAt)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/send-to-earth"
          className="inline-flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-5 text-sm font-medium text-primary hover:bg-hover"
        >
          Prepare another summary
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-on-status hover:bg-accent-hover"
        >
          Back to Today
        </Link>
      </div>
    </div>
  );
}

export default function SentPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-muted">Loading downlink queue...</div>}
    >
      <SentPageInner />
    </Suspense>
  );
}
