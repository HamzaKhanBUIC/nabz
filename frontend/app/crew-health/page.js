"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import BackLink from "@/components/ui/BackLink";
import Button, { buttonClassName } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import * as api from "@/lib/api";
import { formatDateTime } from "@/lib/utils/format";
import { formatBpCategory, severityStatus } from "@/lib/utils/health";

export default function CrewHealthPage() {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [overview, setOverview] = useState(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    setErrorMsg("");
    try {
      const data = await api.getCrewOverview();
      setOverview(data);
    } catch (err) {
      if (err?.status === 403 || err?.code === "forbidden") {
        setForbidden(true);
      } else {
        setErrorMsg(err?.message || "Unable to load crew health overview.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api
      .getCrewOverview()
      .then((data) => {
        if (!active) return;
        setOverview(data);
        setForbidden(false);
        setErrorMsg("");
      })
      .catch((err) => {
        if (!active) return;
        if (err?.status === 403 || err?.code === "forbidden") {
          setForbidden(true);
        } else {
          setErrorMsg(err?.message || "Unable to load crew health overview.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (forbidden) {
    return (
      <div className="space-y-6">
        <BackLink href="/">Today</BackLink>

        <Card>
          <CardHeader
            title="Access restricted"
            subtitle="Crew health overview"
          />
          <CardBody className="space-y-4">
            <div className="flex items-start gap-3 rounded-md border border-attention/40 bg-attention/10 p-4 text-sm text-primary">
              <Icon
                name="lock"
                size={20}
                className="mt-0.5 shrink-0 text-attention"
              />
              <p className="font-medium">
                Only the crew Medical Officer can see this page.
              </p>
            </div>
            <Link href="/" className={buttonClassName("primary", "md")}>
              Back to Today
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  const crewEntries = overview?.crew || [];

  return (
    <div className="space-y-6">
      <BackLink href="/">Today</BackLink>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="t-label-md text-muted">
            {overview?.missionDay
              ? `Day ${overview.missionDay} · Medical officer view`
              : "Medical officer view"}
          </p>
          <h1 className="t-h1 mt-1 text-primary">Crew health</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-secondary">
            Daily summaries from crewmates who have turned on sharing. Every view is logged in their Privacy log.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={loadOverview}
          disabled={loading}
        >
          <Icon name="refresh" size={16} />
          <span>{loading ? "Refreshing..." : "Refresh"}</span>
        </Button>
      </div>

      {errorMsg ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emergency/50 bg-emergency/10 px-4 py-3 text-sm text-primary"
        >
          <span>{errorMsg}</span>
          <Button type="button" variant="secondary" size="sm" onClick={loadOverview}>
            Retry
          </Button>
        </div>
      ) : null}

      {loading && !overview ? (
        <div className="rounded-lg border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          Loading crew health summaries...
        </div>
      ) : crewEntries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          No crewmates found in mission roster.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {crewEntries.map((member) => {
            const summary = member.shared ? member.summary : null;
            const reaction = summary?.reaction
              ? api.statusToPill(summary.reaction)
              : null;
            const cardSeverity = summary?.primaryCard?.severity
              ? severityStatus(summary.primaryCard.severity)
              : null;

            return (
              <Card key={member.id}>
                <CardHeader
                  title={member.name}
                  subtitle={member.role}
                  action={
                    member.shared ? (
                      <StatusBadge tone="ok" dot={false}>
                        <Icon name="check_circle" size={14} />
                        <span>Shared</span>
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral" dot={false}>
                        <Icon name="lock" size={14} />
                        <span>Not shared</span>
                      </StatusBadge>
                    )
                  }
                />

                <CardBody>
                  {!member.shared || !summary ? (
                    <div className="rounded-md border border-dashed border-line bg-raised p-4 text-sm text-muted">
                      Not shared
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-raised px-3.5 py-3">
                        <span className="text-xs font-medium text-muted">
                          Reaction status
                        </span>
                        {reaction ? (
                          <StatusBadge tone={reaction.badgeTone} dot={false}>
                            <Icon name={reaction.iconName} size={14} />
                            <span>{reaction.label}</span>
                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="neutral" dot={false}>
                            <Icon name="info" size={14} />
                            <span>No check-in yet</span>
                          </StatusBadge>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-md border border-line bg-raised p-3.5">
                          <p className="text-xs text-muted">Blood pressure</p>
                          <p className="mt-1 text-sm font-semibold text-primary">
                            {formatBpCategory(summary.bpCategory)}
                          </p>
                        </div>

                        <div className="rounded-md border border-line bg-raised p-3.5">
                          <p className="text-xs text-muted">Last check-in day</p>
                          <p className="mt-1 font-mono text-sm font-semibold text-primary">
                            {summary.lastCheckinDay != null
                              ? `Day ${summary.lastCheckinDay}`
                              : "None yet"}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-md border border-line bg-raised p-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs text-muted">Primary card</p>
                          {cardSeverity ? (
                            <StatusBadge
                              tone={cardSeverity.badgeTone}
                              dot={false}
                            >
                              <Icon name={cardSeverity.iconName} size={14} />
                              <span>{cardSeverity.label}</span>
                            </StatusBadge>
                          ) : null}
                        </div>
                        <p className="mt-1.5 text-sm font-semibold text-primary">
                          {summary.primaryCard?.title || "No active card"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
                        <span>Next check due</span>
                        <span className="font-mono font-medium text-secondary">
                          {summary.nextDue
                            ? formatDateTime(summary.nextDue)
                            : "Not scheduled"}
                        </span>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
