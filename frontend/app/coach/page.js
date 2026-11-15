"use client";

import BackLink from "@/components/ui/BackLink";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import ChatInterface from "@/components/coach/ChatInterface";
import ClinicalActionCard from "@/components/dashboard/ClinicalActionCard";
import { useStore } from "@/lib/data/store";
import { coachDisclaimer } from "@/lib/data/mission";
import { getLatestPoint, getOverallStatus, getTrendBand } from "@/lib/data/selectors";
import { METRICS, formatMetricValue, pointStatus } from "@/lib/utils/health";

const CONTEXT_KEYS = ["reaction-speed", "sleep-hours", "bp-systolic"];

export default function CoachPage() {
  const store = useStore();
  const overall = getOverallStatus(store.today);

  return (
    <div className="space-y-6">
      <BackLink href="/">Today</BackLink>

      <div>
        <p className="t-label-md text-muted">Offline handbook Q&amp;A</p>
        <h1 className="t-h1 mt-1 text-primary">CrewPulse coach</h1>
        <p className="mt-1 text-sm text-secondary">{coachDisclaimer}</p>
      </div>

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1fr_360px]">
        <ChatInterface />

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Current snapshot"
              subtitle={`Day ${store.today?.missionDay ?? store.mission?.missionDay ?? 1}`}
              action={
                <StatusBadge tone={overall.badgeTone} dot={false}>
                  <Icon name={overall.iconName} size={14} />
                  <span>{overall.label}</span>
                </StatusBadge>
              }
            />

            <CardBody>
              <ul className="space-y-2.5">
                {CONTEXT_KEYS.map((code) => {
                  const metric = METRICS[code];
                  const latest = getLatestPoint(code, store);
                  const band = getTrendBand(code, store);
                  const st = pointStatus(latest, band);
                  return (
                    <li
                      key={code}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-raised px-3.5 py-2.5"
                    >
                      <div className="min-w-[min(100%,140px)] flex-1">
                        <p className="text-xs font-medium text-secondary">
                          {metric.shortLabel}
                        </p>
                        <p className="font-mono text-sm font-semibold text-primary">
                          {latest
                            ? `${formatMetricValue(code, latest.value)} ${metric.unit}`
                            : "—"}
                        </p>
                      </div>
                      <StatusBadge tone={st.badgeTone} dot={false} className="shrink-0">
                        <Icon name={st.iconName} size={14} />
                        <span>{st.label}</span>
                      </StatusBadge>
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>

          <ClinicalActionCard
            card={store.today?.card}
            heading="Active card"
            compact
          />
        </div>
      </div>
    </div>
  );
}
