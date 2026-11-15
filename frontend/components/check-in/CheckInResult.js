"use client";

/**
 * SCREENS 04 / 04b — Check-in result (outside / inside normal).
 *
 *   04  : Normal zone widget (Outside) + 2 metric tiles + Action card
 *         (What changed / Why it matters / What to do).
 *   04b : Normal zone widget (Inside) + 1 metric tile + status pill.
 *
 * The classification comes from the real personal band (mean ± 1 SD of the
 * recorded series) — when there is not enough history yet the screen says so
 * instead of claiming the crew is inside their normal.
 */

import { useMemo } from "react";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import MetricTile from "@/components/ui/MetricTile";
import { StatusPill } from "@/components/ui/StatusBadge";
import NormalZoneWidget from "@/components/dashboard/NormalZoneWidget";
import { useStore } from "@/lib/data/store";
import { getBaseline } from "@/lib/data/selectors";
import { classifyValue } from "@/lib/utils/health";
import { formatTime } from "@/lib/utils/format";

const REACTION = "reaction";

function ActionCard({ average, baseline, classification }) {
  const slower = classification === "above";

  const cards = [
    {
      title: "What changed",
      body: `Your reaction time averaged ${average} ms today. Your normal is ${Math.round(baseline.lower)}–${Math.round(baseline.upper)} ms.`,
    },
    {
      title: "Why it matters",
      body: slower
        ? "Reaction time shifts with sleep, workload and stress. One slower reading is information about today, not a diagnosis."
        : "Reaction time shifts with sleep, workload and stress. One faster reading is information about today, not a diagnosis.",
    },
    {
      title: "What to do",
      body: "Keep to your usual routine, rest well, and compare again at your next check-in before changing anything.",
    },
  ];

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-4">
        <StatusPill status="attention">Act today</StatusPill>
        <p className="t-body-sm text-muted">
          Supports your decisions. It is not a diagnosis.
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} className="min-h-[166px]">
            <CardBody>
              <h3 className="t-label-lg text-primary">{card.title}</h3>
              <p className="mt-2 t-body-sm text-secondary">{card.body}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function CheckInResult({ record }) {
  const store = useStore();

  const baseline = useMemo(
    () => getBaseline(REACTION, store),
    [store]
  );

  const average = record?.average ?? null;
  const classification =
    average != null && baseline
      ? classifyValue(average, baseline)
      : "unknown";

  const inside = classification === "in-range";
  const hasBaseline = Boolean(baseline) && classification !== "unknown";

  const feelingLabel = record?.feelingLabel || "not recorded";
  const helperText =
    classification === "above"
      ? "Feeling fine but slower is common with short sleep."
      : "Feeling fine but faster is common after good rest.";

  const dateLine = `Today, ${formatTime(record?.timestamp)} · compared with your own normal, not an Earth average.`;

  return (
    <div>
      <h1 className="t-h1 text-primary">Your check-in result</h1>
      <p className="mt-2 t-body-md text-muted">{dateLine}</p>

      <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,560px)_minmax(0,520px)]">
        <NormalZoneWidget />

        <div className="flex min-w-0 flex-col gap-6">
          <MetricTile
            label="Reaction time"
            value={average ?? "—"}
            unit="ms"
            helper={
              baseline
                ? `Your normal: ${Math.round(baseline.lower)}–${Math.round(baseline.upper)} ms`
                : "Your normal: building after 3 check-ins"
            }
          />

          {hasBaseline && !inside ? (
            <MetricTile
              label="You said you feel"
              value={feelingLabel}
              helper={helperText}
            />
          ) : null}

          {hasBaseline && inside ? (
            <div className="flex flex-col gap-4">
              <StatusPill status="normal" className="self-start">
                Normal
              </StatusPill>
              <p className="t-body-md text-primary">
                You are inside your normal. Nothing to act on today.
              </p>
            </div>
          ) : null}

          {!hasBaseline ? (
            <div className="flex flex-col gap-4">
              <StatusPill status="attention" className="self-start">
                Building baseline
              </StatusPill>
              <p className="t-body-md text-primary">
                Not enough check-ins yet to compare this result with your own
                normal.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {hasBaseline && !inside ? (
        <ActionCard
          average={average}
          baseline={baseline}
          classification={classification}
        />
      ) : null}

      <div className="mt-6 flex flex-wrap gap-4">
        {hasBaseline && !inside ? (
          <>
            <Button href="/" variant="primary" size="lg" arrow>
              Got it
            </Button>
            <Button href="/measure" variant="secondary" size="lg">
              Take a measurement
            </Button>
          </>
        ) : (
          <Button href="/" variant="primary" size="lg" arrow>
            Done
          </Button>
        )}
      </div>
    </div>
  );
}
