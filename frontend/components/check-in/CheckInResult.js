"use client";

import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button, { buttonClassName } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import ClinicalActionCard from "@/components/dashboard/ClinicalActionCard";
import { iconNameForKey, statusToBadgeTone } from "@/lib/api";

export default function CheckInResult({ record, onReset }) {
  if (!record) return null;

  const zoneStatus = record.zone?.status;
  const badgeTone = statusToBadgeTone(zoneStatus?.level);
  const badgeIcon = iconNameForKey(zoneStatus?.iconKey);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="t-label-md text-muted">Day {record.missionDay}</p>
          <h2 className="t-h1 mt-1 text-primary">Check-in scored</h2>
          <p className="mt-1 text-sm text-secondary">
            Compared with your own recent check-ins.
          </p>
        </div>

        <StatusBadge tone={badgeTone} dot={false} className="shrink-0 py-1.5 text-sm">
          <Icon name={badgeIcon} size={16} />
          <span>{zoneStatus?.label || "Scored"}</span>
        </StatusBadge>
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

      <ClinicalActionCard card={record.card} heading="Your result" simple />

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/normal-zone"
          className={buttonClassName("primary", "md")}
        >
          <Icon name="monitoring" size={18} />
          See your normal zone
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
