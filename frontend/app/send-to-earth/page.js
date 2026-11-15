"use client";

/**
 * ROUTE `/send-to-earth` — Send to Earth (secondary screen).
 *
 * Checkbox selection → preview of the exact content → submit. The submit is a
 * frontend-only state machine (idle → sending → confirmation on `/sent`): the
 * report is written to the local store as `queued-simulated` and nothing is
 * transmitted anywhere.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/ui/PageTransition";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import ReportPreview from "@/components/reports/ReportPreview";
import { useStore } from "@/lib/data/store";
import { getEarthDelayLabel, mission } from "@/lib/data/mission";
import { REPORT_SECTIONS as SECTIONS } from "@/lib/data/reportSections";
import { formatDateTime, makeId } from "@/lib/utils/format";

function CheckBox({ checked }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border-2 transition-colors ${
        checked ? "border-accent bg-accent" : "border-line-strong bg-canvas"
      }`}
      aria-hidden="true"
    >
      {checked ? <Icon name="check" filled size={16} className="text-white" /> : null}
    </span>
  );
}

export default function SendToEarthPage() {
  const router = useRouter();
  const store = useStore();

  const [sections, setSections] = useState({
    reaction: true,
    sleep: true,
    mood: true,
    bloodPressure: false,
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const toggle = (key) =>
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const selectedCount = Object.values(sections).filter(Boolean).length;

  function queueReport() {
    if (selectedCount === 0 || sending) return;
    setSending(true);
    setError(null);

    try {
      // Timestamps are computed inside the event handler so render stays pure
      // (Cache Components forbids reading the clock during prerender).
      const queuedAt = Date.now();
      store.addReport({
        id: makeId("rep"),
        sections: { ...sections },
        status: "queued-simulated",
        queuedAt: new Date(queuedAt).toISOString(),
        etaAt: new Date(
          queuedAt + mission.earthDelayMinutes * 60_000
        ).toISOString(),
        deliveryNote:
          "Simulated queue — no communication service is connected in this build.",
      });
      router.push("/sent");
    } catch {
      setSending(false);
      setError("This report could not be queued. Try again.");
    }
  }

  const recentReports = useMemo(
    () =>
      [...store.reports].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      ),
    [store.reports]
  );

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Downlink"
        title="Send to Earth"
        description="Choose what to share with the ground team. You review the exact content before anything is queued."
        actions={
          <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-2">
            <Icon name="schedule" size={18} className="text-accent" />
            <div>
              <p className="t-caption uppercase tracking-wider text-muted">
                Communication delay
              </p>
              <p className="text-sm font-medium text-primary">
                {getEarthDelayLabel()} one-way
              </p>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Selection */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="What should Earth receive?"
              subtitle={`${selectedCount} of ${SECTIONS.length} sections selected`}
            />
            <CardBody className="flex flex-col gap-3">
              {SECTIONS.map((section) => {
                const active = sections[section.key];
                return (
                  <button
                    key={section.key}
                    type="button"
                    role="checkbox"
                    aria-checked={active}
                    onClick={() => toggle(section.key)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors ${
                      active
                        ? "border-accent/60 bg-accent-subtle"
                        : "border-line bg-surface hover:bg-hover"
                    }`}
                  >
                    <CheckBox checked={active} />
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                        active ? "bg-accent text-white" : "bg-raised text-muted"
                      }`}
                    >
                      <Icon name={section.icon} size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-primary">
                        {section.label}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {section.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-start gap-3 p-6">
              <Icon name="verified_user" size={20} className="mt-0.5 shrink-0 text-normal" />
              <div>
                <p className="text-sm font-medium text-primary">
                  You stay in control
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Only the sections you tick are included. Data never leaves this
                  device in the current build — sharing is simulated until the
                  mission communication service is connected.
                </p>
              </div>
            </CardBody>
          </Card>

          {recentReports.length > 0 ? (
            <Card>
              <CardHeader
                title="Outbox"
                subtitle="Reports prepared on this device"
              />
              <CardBody>
                <ul className="flex flex-col gap-2">
                  {recentReports.slice(0, 5).map((report) => (
                    <li
                      key={report.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs text-primary">
                          {report.id}
                        </p>
                        <p className="font-mono text-[10px] text-muted">
                          {formatDateTime(report.queuedAt || report.timestamp)}
                        </p>
                      </div>
                      <StatusBadge tone="warn" dot={false} className="shrink-0">
                        Queued (simulated)
                      </StatusBadge>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}
        </div>

        {/* Preview + actions */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Report preview"
              subtitle="Exactly what will be included"
              action={
                <StatusBadge tone="info" dot={false}>
                  {selectedCount} section{selectedCount === 1 ? "" : "s"}
                </StatusBadge>
              }
            />
            <CardBody>
              <ReportPreview sections={sections} store={store} />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-col gap-3 p-6">
              <Button
                size="lg"
                onClick={queueReport}
                disabled={selectedCount === 0 || sending}
                className="w-full"
                aria-busy={sending}
              >
                <Icon name={sending ? "hourglass_top" : "send"} size={20} />
                {sending ? "Sending…" : "Send summary"}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                href="/"
                className="w-full"
              >
                Not now
              </Button>

              <p className="text-center text-xs text-muted" aria-live="polite">
                {selectedCount === 0
                  ? "Tick at least one section to send."
                  : error || "Simulated — nothing leaves this device."}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
