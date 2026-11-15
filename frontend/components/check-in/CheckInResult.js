"use client";

import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button, { buttonClassName } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import MetricTile from "@/components/ui/MetricTile";
import StatusBadge from "@/components/ui/StatusBadge";
import ClinicalActionCard from "@/components/dashboard/ClinicalActionCard";
import { iconNameForKey, statusToBadgeTone } from "@/lib/api";
import { formatMetricValue } from "@/lib/utils/health";

export default function CheckInResult({ record, onReset }) {
  if (!record) return null;

  const zoneStatus = record.zone?.status;
  const baseline = record.zone?.baseline;
  const badgeTone = statusToBadgeTone(zoneStatus?.level);
  const badgeIcon = iconNameForKey(zoneStatus?.iconKey);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="t-label-md text-muted">
            Day {record.missionDay} · Protocol {record.protocolId}
          </p>
          <h2 className="t-h1 mt-1 text-primary">Check-in scored</h2>
          <p className="mt-1 text-sm text-secondary">
            Compared against your rolling 28-day personal normal.
          </p>
        </div>

        <StatusBadge tone={badgeTone} dot={false} className="shrink-0 py-1.5 text-sm">
          <Icon name={badgeIcon} size={16} />
          <span>{zoneStatus?.label || "Scored"}</span>
        </StatusBadge>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
        <MetricTile
          label="Mean reaction speed"
          value={formatMetricValue("reaction-speed", record.metrics?.meanSpeed)}
          unit="resp/s"
          helper={`Median RT ${record.metrics?.medianRtMs != null ? `${Math.round(record.metrics.medianRtMs)} ms` : "—"}`}
        />
        <MetricTile
          label="Performance score"
          value={record.metrics?.performanceScore ?? "—"}
          unit="/ 100"
          helper={`${record.metrics?.validResponses ?? 0} of ${record.metrics?.stimuli ?? 0} valid responses`}
        />
        <MetricTile
          label="Lapses & early taps"
          value={`${record.metrics?.lapses ?? 0} / ${record.metrics?.falseStarts ?? 0}`}
          helper="Lapses >= 355 ms · Early < 100 ms"
        />
        <MetricTile
          label="Sleep logged"
          value={
            record.sleepHours != null
              ? formatMetricValue("sleep-hours", record.sleepHours)
              : "—"
          }
          unit={record.sleepHours != null ? "h" : undefined}
          helper={
            baseline?.ready && baseline.mean != null
              ? `Baseline ${formatMetricValue("reaction-speed", baseline.mean)} ± ${formatMetricValue("reaction-speed", baseline.sd)} resp/s (${baseline.n} sessions)`
              : `Building baseline (${baseline?.n ?? 0} sessions)`
          }
        />
      </div>

      {Array.isArray(record.qcFlags) && record.qcFlags.length > 0 ? (
        <Card>
          <CardHeader
            title="Quality check notes"
            subtitle="Session timing and validity checks"
          />
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {record.qcFlags.map((flag) => (
                <StatusBadge key={flag} tone="warn" dot={false}>
                  {flag}
                </StatusBadge>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : null}

      <ClinicalActionCard card={record.card} heading="Result action card" />

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/normal-zone"
          className={buttonClassName("primary", "md")}
        >
          <Icon name="monitoring" size={18} />
          View normal zone trends
        </Link>
        <Link
          href="/"
          className={buttonClassName("secondary", "md")}
        >
          Back to Today
        </Link>
        {onReset ? (
          <Button type="button" variant="ghost" size="md" onClick={onReset}>
            Run another check-in
          </Button>
        ) : null}
      </div>
    </div>
  );
}
