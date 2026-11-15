"use client";

/**
 * "Latest action" card — shows the most recent recorded activity.
 */

import Link from "next/link";
import { Activity, ArrowRight, Bell, ClipboardList, HeartPulse, Send } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { DemoBadge } from "@/components/ui/StatusBadge";
import { useStore } from "@/lib/data/store";
import { getLatestActivity } from "@/lib/data/selectors";
import { relativeTime } from "@/lib/utils/format";

const TYPE_ICONS = {
  "check-in": Activity,
  measurement: HeartPulse,
  mood: ClipboardList,
  report: Send,
};

export default function ActionCard() {
  const store = useStore();
  const activity = getLatestActivity(store);

  if (!activity) {
    return (
      <Card>
        <CardHeader title="Latest action" subtitle="Your most recent activity" icon={Bell} />
        <CardBody>
          <EmptyState
            compact
            icon={ClipboardList}
            title="No activity yet"
            description="Recorded check-ins, moods and measurements show up here."
            actionLabel="Start check-in"
            actionHref="/check-in"
          />
        </CardBody>
      </Card>
    );
  }

  const Icon = TYPE_ICONS[activity.type] || ClipboardList;

  return (
    <Card>
      <CardHeader
        title="Latest action"
        subtitle="Your most recent activity"
        icon={Bell}
        action={
          activity.source === "demo" ? <DemoBadge /> : undefined
        }
      />
      <CardBody>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-nasa-blue-soft text-nasa-blue">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy">{activity.label}</p>
            <p className="mt-0.5 truncate font-mono text-xs text-muted">
              {activity.detail}
            </p>
            <p className="mt-1 text-xs text-muted">
              {relativeTime(activity.timestamp)}
            </p>
          </div>
        </div>

        <Link
          href={activity.href}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-nasa-blue hover:underline"
        >
          View in context
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </CardBody>
    </Card>
  );
}
