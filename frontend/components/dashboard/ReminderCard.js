"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import { useStore } from "@/lib/data/store";
import { formatDateTime } from "@/lib/utils/format";

export default function ReminderCard() {
  const { reminders, saveReminders } = useStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [enabled, setEnabled] = useState(true);
  const [checkinTimeUtc, setCheckinTimeUtc] = useState("08:00");
  const [bpIntervalDays, setBpIntervalDays] = useState(7);
  const [bpTimeUtc, setBpTimeUtc] = useState("08:30");

  const enabledId = useId();
  const checkinId = useId();
  const bpDaysId = useId();
  const bpTimeId = useId();

  function handleToggleEditing() {
    if (!editing && reminders?.schedule) {
      setEnabled(reminders.schedule.enabled);
      setCheckinTimeUtc(reminders.schedule.checkinTimeUtc);
      setBpIntervalDays(reminders.schedule.bpIntervalDays);
      setBpTimeUtc(reminders.schedule.bpTimeUtc);
    }
    setEditing((prev) => !prev);
    setErrorMessage("");
    setStatusMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      await saveReminders({
        enabled: Boolean(enabled),
        checkinTimeUtc,
        bpIntervalDays: Number(bpIntervalDays),
        bpTimeUtc,
      });
      setStatusMessage("Reminder schedule saved.");
      setEditing(false);
    } catch (err) {
      setErrorMessage(err?.message || "Failed to update reminders.");
    } finally {
      setSaving(false);
    }
  }

  const items = reminders?.items || [];

  return (
    <Card>
      <CardHeader
        title="Check-up schedule"
        subtitle={
          reminders?.nextDue
            ? `Next due ${formatDateTime(reminders.nextDue)}`
            : reminders?.schedule?.enabled === false
              ? "Reminders paused"
              : "Syncing reminder schedule"
        }
        action={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleToggleEditing}
            aria-expanded={editing}
          >
            <Icon name={editing ? "close" : "edit_calendar"} size={16} />
            {editing ? "Close" : "Schedule"}
          </Button>
        }
      />

      <CardBody>
        {statusMessage ? (
          <p role="status" className="mb-3 text-xs font-medium text-normal">
            {statusMessage}
          </p>
        ) : null}

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-line bg-raised p-4">
            <label htmlFor={enabledId} className="flex min-h-11 cursor-pointer items-center gap-2.5">
              <input
                id={enabledId}
                name="enabled"
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-5 w-5 accent-[var(--color-accent)]"
              />
              <span className="text-sm font-medium text-primary">
                Enable mission check-up reminders
              </span>
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor={checkinId} className="block text-xs font-medium text-secondary">
                  Daily check-in (UTC)
                </label>
                <input
                  id={checkinId}
                  name="checkinTimeUtc"
                  type="text"
                  required
                  pattern="^(?:[01]\d|2[0-3]):[0-5]\d$"
                  value={checkinTimeUtc}
                  onChange={(e) => setCheckinTimeUtc(e.target.value)}
                  placeholder="08:00"
                  className="mt-1.5 w-full rounded-md border border-line bg-canvas px-3.5 py-2.5 font-mono text-sm text-primary transition-colors focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor={bpDaysId} className="block text-xs font-medium text-secondary">
                  BP interval (1 to 30 d)
                </label>
                <input
                  id={bpDaysId}
                  name="bpIntervalDays"
                  type="number"
                  required
                  min={1}
                  max={30}
                  value={bpIntervalDays}
                  onChange={(e) => setBpIntervalDays(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-line bg-canvas px-3.5 py-2.5 font-mono text-sm text-primary transition-colors focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor={bpTimeId} className="block text-xs font-medium text-secondary">
                  BP time (UTC)
                </label>
                <input
                  id={bpTimeId}
                  name="bpTimeUtc"
                  type="text"
                  required
                  pattern="^(?:[01]\d|2[0-3]):[0-5]\d$"
                  value={bpTimeUtc}
                  onChange={(e) => setBpTimeUtc(e.target.value)}
                  placeholder="08:30"
                  className="mt-1.5 w-full rounded-md border border-line bg-canvas px-3.5 py-2.5 font-mono text-sm text-primary transition-colors focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {errorMessage ? (
              <p role="alert" className="text-xs font-medium text-emergency">
                {errorMessage}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={saving}>
                {saving ? "Saving..." : "Save schedule"}
              </Button>
            </div>
          </form>
        ) : (
          <ul className="space-y-2.5">
            {items.length === 0 ? (
              <li className="rounded-md border border-line bg-raised p-4 text-sm text-muted">
                No scheduled check-up items active.
              </li>
            ) : (
              items.map((item) => {
                const href = item.kind === "bp" ? "/measure/blood-pressure" : "/check-in";
                return (
                  <li key={item.kind}>
                    <Link
                      href={href}
                      className="interactive-surface flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-raised p-4 hover:border-line-strong hover:bg-hover"
                    >
                      <div className="min-w-[min(100%,210px)] flex-1">
                        <div className="flex items-center gap-2">
                          <Icon
                            name={item.kind === "bp" ? "monitor_heart" : "touch_app"}
                            size={18}
                            className="shrink-0 text-accent"
                          />
                          <p className="text-sm font-semibold text-primary">
                            {item.label}
                          </p>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-secondary">{item.reason}</p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge tone={item.overdue ? "warn" : "ok"} dot={false}>
                          {item.overdue ? "Due now" : formatDateTime(item.dueAt)}
                        </StatusBadge>
                        <Icon name="chevron_right" size={18} className="text-muted" />
                      </div>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
