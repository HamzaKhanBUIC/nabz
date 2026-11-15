"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import { statusToPill } from "@/lib/api";
import { useStore } from "@/lib/data/store";

function barFillForLevel(level) {
  if (level === "urgent") return "bg-emergency";
  if (level === "act") return "bg-attention";
  return "bg-accent";
}

function RadiationDoseBody({ radiation }) {
  const pill = statusToPill(radiation.status);
  const tracked = radiation.doseToDateMsv !== null && radiation.doseToDateMsv !== undefined;
  const barWidthPct = tracked
    ? Math.max(0, Math.min(100, Number(radiation.percentOfCareerLimit ?? 0)))
    : 0;
  const sources = Array.isArray(radiation.sources) ? radiation.sources : [];

  return (
    <div className="space-y-4">
      {tracked ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="t-metric text-primary">
                {radiation.doseToDateMsv} mSv
              </span>
              <span className="inline-flex items-center gap-1 rounded-pill border border-line-strong bg-raised px-2.5 py-0.5 text-xs font-semibold text-secondary">
                Estimate
              </span>
            </div>
            <span className="text-sm font-medium text-secondary">
              {radiation.percentOfCareerLimit}% of {radiation.careerLimitMsv} mSv career limit
            </span>
          </div>

          <div
            role="progressbar"
            aria-label="Estimated mission radiation dose against NASA career limit"
            aria-valuemin={0}
            aria-valuemax={radiation.careerLimitMsv}
            aria-valuenow={radiation.doseToDateMsv}
            className="h-3.5 w-full overflow-hidden rounded-pill border border-line bg-raised"
          >
            <div
              className={`h-full rounded-pill transition-[width] duration-300 ${barFillForLevel(pill.level)}`}
              style={{ width: `${barWidthPct}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>0 mSv</span>
            <span>Career limit: {radiation.careerLimitMsv} mSv</span>
          </div>

          {radiation.daysUntilLimit !== null && radiation.daysUntilLimit !== undefined ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-raised px-3.5 py-2.5 text-sm text-primary">
              <Icon name="schedule" size={18} className="shrink-0 text-accent" />
              <span className="font-medium">
                At this rate: {radiation.daysUntilLimit} days until the career limit
              </span>
              {radiation.dailyRateMsv !== null && radiation.dailyRateMsv !== undefined ? (
                <span className="text-xs text-muted">
                  ({radiation.dailyRateMsv} mSv/day published rate)
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="text-sm leading-relaxed text-secondary">{radiation.note}</p>

      {sources.length > 0 ? (
        <div className="border-t border-line pt-3 text-xs text-muted">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="font-medium text-secondary">Sources:</span>
            {sources.map((src) => (
              <a
                key={src.id}
                href={src.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-accent underline-offset-2 hover:underline"
              >
                <span>{src.title}</span>
                <Icon name="open_in_new" size={13} />
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function RadiationDoseCard({ embedded = false }) {
  const { radiation, refreshRadiation } = useStore();
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    setRetrying(true);
    try {
      await refreshRadiation();
    } catch {
      // Ignore retry error; card stays in unavailable state.
    } finally {
      setRetrying(false);
    }
  }

  if (!radiation) {
    const emptyBody = (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-secondary">
          <Icon name="info" size={18} className="shrink-0 text-muted" />
          <span>Radiation dose estimate is unavailable offline.</span>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleRetry}
          disabled={retrying}
        >
          <Icon name="refresh" size={16} />
          {retrying ? "Checking..." : "Retry"}
        </Button>
      </div>
    );

    if (embedded) {
      return (
        <div className="mt-4 rounded-xl border border-line bg-raised/60 p-4">
          <p className="t-label-md mb-2 text-muted">Mission radiation dose</p>
          {emptyBody}
        </div>
      );
    }

    return (
      <Card>
        <CardHeader
          title="Mission radiation dose"
          subtitle="Estimated against NASA's 600 mSv career limit"
        />
        <CardBody>{emptyBody}</CardBody>
      </Card>
    );
  }

  const pill = statusToPill(radiation.status);
  const envName = radiation.environment?.name || "Mission environment";
  const subtitle = `${envName} · Day ${radiation.missionDay}`;
  const statusBadge = (
    <StatusBadge tone={pill.badgeTone} dot={false} className="shrink-0 py-1.5 text-sm">
      <Icon name={pill.iconName} size={16} />
      <span>{pill.label}</span>
    </StatusBadge>
  );

  if (embedded) {
    return (
      <div className="mt-4 rounded-xl border border-line bg-raised/60 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="t-label-md text-muted">Mission radiation dose</p>
            <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
          </div>
          {statusBadge}
        </div>
        <RadiationDoseBody radiation={radiation} />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Mission radiation dose"
        subtitle={subtitle}
        action={statusBadge}
      />
      <CardBody>
        <RadiationDoseBody radiation={radiation} />
      </CardBody>
    </Card>
  );
}
