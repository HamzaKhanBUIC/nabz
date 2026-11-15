"use client";

/**
 * Current health status card on the Today dashboard.
 * Derived entirely from recorded readings vs personal baselines.
 */

import { useMemo } from "react";
import { Activity, HeartPulse, ShieldCheck } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { useStore } from "@/lib/data/store";
import { getOverallStatus } from "@/lib/data/selectors";
import { METRICS, metricStatus } from "@/lib/utils/health";

const METRIC_ICONS = {
  reaction: Activity,
  sleep: Activity,
  mood: ShieldCheck,
  bloodPressure: HeartPulse,
};

export default function HealthSummary() {
  const store = useStore();
  const overall = useMemo(() => getOverallStatus(store), [store]);

  return (
    <Card>
      <CardHeader
        title="Current health status"
        subtitle="Compared against your personal Normal Zone"
        icon={ShieldCheck}
        action={<StatusBadge tone={overall.tone}>{overall.title}</StatusBadge>}
      />
      <CardBody>
        <p className="text-sm leading-relaxed text-muted">{overall.detail}</p>

        {overall.readings.length > 0 ? (
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {overall.readings.map(({ key, latest, baseline }) => {
              const metric = METRICS[key];
              const status = metricStatus(key, latest.value, baseline);
              const Icon = METRIC_ICONS[key];
              return (
                <li
                  key={key}
                  className="rounded-lg border border-line bg-canvas/70 px-3 py-2.5"
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                    <span className="truncate text-[11px] font-medium text-muted">
                      {metric.shortLabel}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-lg font-medium leading-none text-navy">
                    {metric.integer
                      ? Math.round(latest.value)
                      : latest.value.toFixed(1)}
                    <span className="ml-1 text-[11px] font-normal text-muted">
                      {metric.unit}
                    </span>
                  </p>
                  <div className="mt-1.5">
                    <StatusBadge tone={status.tone} dot={false} className="text-[10px]">
                      {status.label}
                    </StatusBadge>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-line bg-canvas/60 px-4 py-5 text-center">
            <p className="text-sm text-muted">
              No readings recorded yet. Your status appears here once baselines
              can be computed from your first check-ins.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
