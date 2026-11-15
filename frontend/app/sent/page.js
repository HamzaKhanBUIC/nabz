"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BackLink from "@/components/ui/BackLink";
import { buttonClassName } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useStore } from "@/lib/data/store";
import { formatTime } from "@/lib/utils/format";

function addSeconds(iso, seconds) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t) || seconds == null) return null;
  return new Date(t + seconds * 1000);
}

/** Arrival on Earth = sent time + the active environment's one-way signal delay. */
function arrivalWindow(queuedAt, delay) {
  if (!queuedAt || delay?.minSeconds == null || delay?.maxSeconds == null) return null;
  const earliest = addSeconds(queuedAt, delay.minSeconds);
  const latest = addSeconds(queuedAt, delay.maxSeconds);
  if (!earliest || !latest) return null;
  const a = formatTime(earliest);
  const b = formatTime(latest);
  return a === b ? a : `${a} to ${b}`;
}

function roundTripText(delay) {
  if (delay?.minSeconds == null) return "depends on the signal link";
  const mins = (delay.minSeconds * 2) / 60;
  if (mins < 1) return "a few seconds or more";
  return `at least ${Math.round(mins)} min round trip`;
}

function Step({ state, title, detail }) {
  const done = state === "done";
  const current = state === "current";
  return (
    <li className="flex items-start gap-3.5">
      <span
        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
          done
            ? "border-ok bg-ok/15 text-ok"
            : current
              ? "border-accent bg-accent text-on-status"
              : "border-line text-muted"
        }`}
        aria-hidden="true"
      >
        {done ? <Icon name="check" size={14} /> : current ? <span className="size-2 rounded-full bg-current" /> : null}
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${done || current ? "text-primary" : "text-secondary"}`}>
          {title}
          <span className="sr-only">{done ? " (done)" : current ? " (now)" : " (waiting)"}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted">{detail}</p>
      </div>
    </li>
  );
}

function SentPageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { outbox, environment } = useStore();

  const record = outbox.find((item) => item.id === id) || outbox[0] || null;
  const delay = environment?.active?.oneWayDelay || null;
  const sentAt = record?.queuedAt ? formatTime(record.queuedAt) : null;
  const arrival = arrivalWindow(record?.queuedAt, delay);

  return (
    <div className="space-y-6">
      <BackLink href="/">Today</BackLink>

      <div>
        <h1 className="t-h1 mt-1 text-primary">
          {record ? "Sent to Earth" : "Nothing sent yet"}
        </h1>
        <p className="mt-1 text-sm text-secondary">
          {record
            ? "Your summary is on its way. You can keep using the app."
            : "Summaries you send to Earth show up here."}
        </p>
      </div>

      {record ? (
        <>
          <div
            role="status"
            className="inline-flex max-w-full items-start gap-2.5 rounded-lg bg-ok px-4 py-3 text-sm font-semibold text-on-status"
          >
            <Icon name="check_circle" size={20} className="shrink-0" />
            <span>
              Sent at {sentAt}.
              {arrival ? ` Arrives on Earth around ${arrival}.` : delay?.text ? ` Signal: ${delay.text.toLowerCase()}.` : ""}
            </span>
          </div>

          <ol className="space-y-5">
            <Step state="done" title="Sent from the ship" detail={sentAt} />
            <Step
              state="current"
              title={delay?.text ? `In transit · ${delay.text.toLowerCase()} delay` : "In transit"}
              detail="now"
            />
            <Step
              state="waiting"
              title="Delivered to Mission Control"
              detail={arrival ? `~${arrival}` : "when the link allows"}
            />
            <Step state="waiting" title="Reply from flight surgeon" detail={roundTripText(delay)} />
          </ol>

          <p className="max-w-xl text-xs text-muted">
            Urgent symptoms: alert a crewmate or the medical officer now. Do not wait for Earth.
          </p>
        </>
      ) : (
        <Card>
          <CardBody>
            <p className="text-sm text-muted">No summaries have been sent in this session yet.</p>
          </CardBody>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/" className={buttonClassName("primary", "md")}>
          Back to Today
        </Link>
        <Link href="/coach" className={buttonClassName("ghost", "md")}>
          Ask the coach
        </Link>
      </div>
    </div>
  );
}

export default function SentPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">Loading...</div>}>
      <SentPageInner />
    </Suspense>
  );
}
