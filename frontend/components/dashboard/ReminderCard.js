"use client";

/**
 * Reminder card on the Today dashboard — driven by mission config, not
 * hardcoded strings scattered through the UI.
 */

import { AlarmClock, Info } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { reminders } from "@/lib/data/mission";

const TONE_MAP = {
  warn: "warn",
  info: "info",
  danger: "danger",
};

export default function ReminderCard() {
  return (
    <Card>
      <CardHeader
        title="Reminders"
        subtitle="Scheduled for this mission day"
        icon={AlarmClock}
      />
      <CardBody className="space-y-3">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="flex items-start gap-3 rounded-lg border border-line bg-canvas/70 px-3 py-3"
          >
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-muted"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-navy">{reminder.title}</p>
                {reminder.tone ? (
                  <StatusBadge tone={TONE_MAP[reminder.tone] || "neutral"} dot={false}>
                    {reminder.dueLabel}
                  </StatusBadge>
                ) : null}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {reminder.detail}
              </p>
              {!reminder.tone ? (
                <p className="mt-1 font-mono text-[10px] text-muted">
                  {reminder.dueLabel}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
