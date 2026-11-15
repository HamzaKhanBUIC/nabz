"use client";

import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { formatDateTime, formatTime } from "@/lib/utils/format";

/**
 * Today's two checks as a short list: what is done, what is next.
 * State comes from the API (today.checkin, today.bp, reminders); nothing is scored here.
 */

const STATE = {
  done: { label: "Done", icon: "check_circle", tone: "text-normal" },
  todo: { label: "To do", icon: "radio_button_unchecked", tone: "text-secondary" },
  due: { label: "Due now", icon: "schedule", tone: "text-attention" },
  redo: { label: "Not scored", icon: "error", tone: "text-attention" },
  later: { label: "Not due", icon: "event", tone: "text-muted" },
};

function checkinStep(checkin) {
  if (!checkin) {
    return {
      state: "todo",
      detail: "Reaction test and sleep, about 3 minutes.",
      action: "Start check-in",
    };
  }
  if ((checkin.qcFlags?.length ?? 0) > 0) {
    return {
      state: "redo",
      detail: "Today's session didn't pass the quality checks, so it wasn't scored.",
      action: "Run it again",
    };
  }
  const speed = checkin.metrics?.meanSpeed;
  return {
    state: "done",
    detail: `At ${formatTime(checkin.effectiveDateTime)}${
      speed != null ? ` · ${speed.toFixed(2)} responses per second` : ""
    }`,
    action: null,
  };
}

function bpStep(bp, reminder) {
  if (bp) {
    return {
      state: "done",
      detail: `At ${formatTime(bp.effectiveDateTime)} · ${bp.average.systolic}/${bp.average.diastolic} mmHg`,
      action: null,
    };
  }
  if (reminder?.overdue) {
    return { state: "due", detail: "Guided cuff check, 8 short steps.", action: "Measure" };
  }
  return {
    state: "later",
    detail: reminder?.dueAt
      ? `Next due ${formatDateTime(reminder.dueAt)}. You can measure any time.`
      : "Guided cuff check, 8 short steps.",
    action: "Measure",
  };
}

function CheckRow({ title, href, step, primary }) {
  const s = STATE[step.state];
  return (
    <li className="flex items-start gap-3.5 py-4 first:pt-0 last:pb-0">
      <Icon name={s.icon} filled={step.state === "done"} size={24} className={`mt-0.5 shrink-0 ${s.tone}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-2 text-base font-semibold text-primary">
            <span>{title}</span>
            <span className={`text-xs font-medium ${s.tone}`}>{s.label}</span>
          </p>
          <p className="mt-0.5 text-sm text-secondary">{step.detail}</p>
        </div>
        {step.action ? (
          <Link
            href={href}
            className={buttonClassName(primary ? "primary" : "secondary", "md", "shrink-0 self-start sm:self-auto")}
          >
            <span>{step.action}</span>
            <Icon name="arrow_forward" size={18} />
          </Link>
        ) : null}
      </div>
    </li>
  );
}

export default function TodayChecks({ checkin, bp, reminders }) {
  const bpReminder = reminders?.items?.find((item) => item.kind === "bp");
  const checkinS = checkinStep(checkin);
  const bpS = bpStep(bp, bpReminder);

  // One primary button: the first step still waiting. A not-due BP check never takes it.
  const checkinOpen = checkinS.state !== "done";
  const bpOpen = bpS.state === "due";
  const allDone = !checkinOpen && !bpOpen;

  return (
    <section aria-labelledby="today-checks-title" className="rounded-lg border border-line bg-surface p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="today-checks-title" className="t-h3 text-primary">
          Today&apos;s checks
        </h2>
        {allDone ? (
          <p className="flex items-center gap-1.5 text-sm font-medium text-normal">
            <Icon name="task_alt" size={18} />
            <span>All done for today</span>
          </p>
        ) : null}
      </div>

      <ul className="divide-y divide-line">
        <CheckRow title="Daily check-in" href="/check-in" step={checkinS} primary={checkinOpen} />
        <CheckRow
          title="Blood pressure"
          href="/measure/blood-pressure"
          step={bpS}
          primary={!checkinOpen && bpOpen}
        />
      </ul>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
        <Link href="/coach" className={buttonClassName("ghost", "sm")}>
          <Icon name="smart_toy" size={18} />
          <span>Ask the coach</span>
        </Link>
        <Link href="/send-to-earth" className={buttonClassName("ghost", "sm")}>
          <Icon name="send" size={18} />
          <span>Send a summary to Earth</span>
        </Link>
      </div>
    </section>
  );
}
