"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { buttonClassName } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import { iconNameForKey, statusToBadgeTone } from "@/lib/api";
import { useStore } from "@/lib/data/store";
import RoutineModal from "@/components/routines/RoutineModal";

export default function ClinicalActionCard({
  card,
  heading = "Today's focus",
  compact = false,
}) {
  const { routinesById } = useStore();
  const [activeRoutine, setActiveRoutine] = useState(null);

  if (!card) {
    return (
      <Card>
        <CardHeader
          title={heading}
          subtitle="Run a 3-minute check-in or blood pressure check to see what to focus on today."
        />
        <CardBody>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/check-in"
              className={buttonClassName("primary", "md")}
            >
              <Icon name="touch_app" size={18} />
              Start 3-min check-in
            </Link>
            <Link
              href="/measure/blood-pressure"
              className={buttonClassName("secondary", "md")}
            >
              <Icon name="monitor_heart" size={18} />
              Measure blood pressure
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  const badgeTone = statusToBadgeTone(card.status?.level || card.severity);
  const statusIcon = iconNameForKey(card.status?.iconKey);
  const linkedRoutine = card.links?.routineId
    ? routinesById?.[card.links.routineId]
    : null;

  return (
    <>
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-[min(100%,210px)] flex-1">
              <p className="t-label-md text-muted">{heading}</p>
              <h2 className="t-h2 mt-1 text-primary">{card.title}</h2>
            </div>

            <StatusBadge tone={badgeTone} dot={false} className="shrink-0 py-1.5 text-sm">
              <Icon name={statusIcon} size={16} />
              <span>{card.status?.label || "Status"}</span>
            </StatusBadge>
          </div>

          <div className={`mt-5 grid gap-3.5 sm:gap-4 ${compact ? "md:grid-cols-1" : "md:grid-cols-3"}`}>
            <div className="rounded-md border border-line bg-raised p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                What changed
              </p>
              <p className="mt-2 text-sm leading-6 text-primary">
                {card.whatChanged}
              </p>
            </div>

            <div className="rounded-md border border-line bg-raised p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Why it matters
              </p>
              <p className="mt-2 text-sm leading-6 text-secondary">
                {card.whyItMatters}
              </p>
            </div>

            <div className="rounded-md border border-line bg-raised p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                What to do
              </p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-primary">
                {card.whatToDo.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Icon name="arrow_right" size={18} className="mt-1 shrink-0 text-accent" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {linkedRoutine ? (
              <button
                type="button"
                onClick={() => setActiveRoutine(linkedRoutine)}
                className={buttonClassName("primary", "md")}
              >
                <Icon name="self_improvement" size={18} />
                Start routine: {linkedRoutine.title}
              </button>
            ) : null}

            {card.links?.emergencyProcedureId ? (
              <Link
                href={`/emergency?id=${encodeURIComponent(card.links.emergencyProcedureId)}`}
                className={buttonClassName("danger", "md")}
              >
                <Icon name="emergency" filled size={18} />
                Open Emergency Guide
              </Link>
            ) : null}

            {card.links?.measurement === "bp" ? (
              <Link
                href="/measure/blood-pressure"
                className={buttonClassName("secondary", "md")}
              >
                <Icon name="monitor_heart" size={18} />
                Measure blood pressure
              </Link>
            ) : null}

            <Link
              href={`/coach?cardId=${encodeURIComponent(card.id)}`}
              className={buttonClassName("secondary", "md")}
            >
              <Icon name="smart_toy" size={18} />
              Ask offline coach
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted">
            <span className="font-medium">{card.disclaimer}</span>
            {Array.isArray(card.sources) && card.sources.length > 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                <span>Sources:</span>
                {card.sources.map((src) => (
                  <a
                    key={src.id}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline-offset-2 hover:underline"
                  >
                    {src.title}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <RoutineModal
        routine={activeRoutine}
        onClose={() => setActiveRoutine(null)}
      />
    </>
  );
}
