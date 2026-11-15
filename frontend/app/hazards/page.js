"use client";

import { useEffect, useState } from "react";
import BackLink from "@/components/ui/BackLink";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import RadiationDoseCard from "@/components/hazards/RadiationDoseCard";
import { useSession } from "@/lib/data/session";
import { useStore } from "@/lib/data/store";
import { hazardIcon } from "@/lib/utils/hazards";

export default function HazardsPage() {
  const { isAuthenticated } = useSession();
  const { hydrated, hazards, refreshHazards } = useStore();
  const [retrying, setRetrying] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!hydrated || hazards.length > 0) return undefined;
    let active = true;

    refreshHazards().catch((err) => {
      if (active) {
        setLoadError(err?.message || "Unable to load NASA hazard guides right now.");
      }
    });

    return () => {
      active = false;
    };
  }, [hydrated, hazards.length, refreshHazards]);

  useEffect(() => {
    if (hazards.length === 0 || typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hazards.length]);

  async function handleRetry() {
    setRetrying(true);
    setLoadError("");
    try {
      await refreshHazards();
    } catch (err) {
      setLoadError(err?.message || "Unable to load NASA hazard guides right now.");
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="space-y-6">
      <BackLink href={isAuthenticated ? "/" : "/sign-in"}>
        {isAuthenticated ? "Today" : "Sign in"}
      </BackLink>

      <div className="space-y-2">
        <p className="t-label-md text-muted">NASA Human Research Program</p>
        <h1 className="t-h1 text-primary">5 hazards of human spaceflight</h1>
        <p className="max-w-2xl text-sm leading-6 text-secondary">
          NASA groups the health risks of deep-space flight into five hazards. Each
          CrewPulse action card names the hazard it relates to.
        </p>
      </div>

      {hazards.length > 0 ? (
        <nav
          aria-label="Jump to a hazard"
          className="flex flex-wrap items-center gap-2"
        >
          {hazards.map((hazard) => (
            <a
              key={hazard.id}
              href={`#${hazard.id}`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-pill border border-line bg-surface px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-line-strong hover:bg-hover hover:text-primary"
            >
              <Icon
                name={hazardIcon(hazard.id)}
                size={15}
                className="text-accent"
              />
              <span>{hazard.name}</span>
            </a>
          ))}
        </nav>
      ) : null}

      {hazards.length === 0 ? (
        <Card>
          <CardBody className="space-y-3">
            {loadError ? (
              <div role="alert" className="space-y-3">
                <p className="text-sm text-primary">{loadError}</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleRetry}
                  disabled={retrying}
                >
                  <Icon name="refresh" size={16} />
                  {retrying ? "Loading..." : "Retry"}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-secondary">
                Loading NASA hazard guides...
              </p>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-5">
          {hazards.map((hazard) => {
            const risks = Array.isArray(hazard.hrpRiskIds)
              ? hazard.hrpRiskIds
              : [];

            return (
              <Card
                key={hazard.id}
                id={hazard.id}
                className="scroll-mt-28 sm:scroll-mt-24"
              >
                <CardBody className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-raised text-accent">
                      <Icon name={hazardIcon(hazard.id)} size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="t-h2 text-primary">{hazard.name}</h2>
                    </div>
                  </div>

                  <blockquote className="rounded-lg border-l-4 border-accent bg-raised px-4 py-3 text-sm leading-relaxed text-primary">
                    <p>&ldquo;{hazard.summary}&rdquo;</p>
                    <footer className="mt-1.5 text-xs font-medium text-muted">
                      NASA Human Research Program
                    </footer>
                  </blockquote>

                  <div className="rounded-lg border border-line bg-raised px-4 py-3 text-sm">
                    <p className="t-label-md text-secondary">
                      What CrewPulse watches:
                    </p>
                    <p className="mt-1 leading-relaxed text-primary">
                      {hazard.watches}
                    </p>
                  </div>

                  {hazard.id === "space-radiation" ? (
                    <RadiationDoseCard embedded />
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                    {risks.length > 0 ? (
                      <span className="text-xs font-medium text-secondary">
                        NASA HRP risks: {risks.join(", ")}
                      </span>
                    ) : (
                      <span />
                    )}

                    {hazard.url ? (
                      <a
                        href={hazard.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-accent underline-offset-2 hover:underline"
                      >
                        <span>Read NASA&apos;s page</span>
                        <Icon name="open_in_new" size={16} />
                      </a>
                    ) : null}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
