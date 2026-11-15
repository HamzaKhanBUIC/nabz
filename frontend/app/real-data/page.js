"use client";

import { useCallback, useEffect, useId, useState } from "react";
import BackLink from "@/components/ui/BackLink";
import Button from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import NasaTrendChart from "@/components/analytics/NasaTrendChart";
import * as api from "@/lib/api";
import { useSession } from "@/lib/data/session";
import { pointStatus } from "@/lib/utils/health";

function formatStat(value, unit) {
  if (value == null || Number.isNaN(Number(value))) return "Not available";
  const num = Number(value);
  const formatted =
    Math.abs(num) >= 100
      ? num.toFixed(1).replace(/\.0$/, "")
      : num.toFixed(2).replace(/0$/, "").replace(/\.$/, "");
  return unit ? `${formatted} ${unit}` : formatted;
}

export default function RealDataPage() {
  const { isAuthenticated } = useSession();
  const [catalog, setCatalog] = useState(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  const [selectedCrew, setSelectedCrew] = useState("");
  const [selectedAnalyte, setSelectedAnalyte] = useState("");
  const [trend, setTrend] = useState(null);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [trendError, setTrendError] = useState("");

  const analyteSelectId = useId();

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    setCatalogError("");
    try {
      const data = await api.getNasaCatalog();
      setCatalog(data);
      const defaultCrew = data?.crew?.[0] || "C001";
      const defaultAnalyte =
        data?.analytes?.find((a) => a.key === "hemoglobin")?.key ||
        data?.analytes?.[0]?.key ||
        "";
      setSelectedCrew((prev) => prev || defaultCrew);
      setSelectedAnalyte((prev) => prev || defaultAnalyte);
    } catch (err) {
      setCatalogError(
        err?.message || "Unable to load NASA OSD-569 catalog right now.",
      );
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api
      .getNasaCatalog()
      .then((data) => {
        if (!active) return;
        setCatalog(data);
        setCatalogError("");
        const defaultCrew = data?.crew?.[0] || "C001";
        const defaultAnalyte =
          data?.analytes?.find((a) => a.key === "hemoglobin")?.key ||
          data?.analytes?.[0]?.key ||
          "";
        setSelectedCrew((prev) => prev || defaultCrew);
        setSelectedAnalyte((prev) => prev || defaultAnalyte);
      })
      .catch((err) => {
        if (!active) return;
        setCatalogError(
          err?.message || "Unable to load NASA OSD-569 catalog right now.",
        );
      })
      .finally(() => {
        if (active) setLoadingCatalog(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCrew || !selectedAnalyte) return undefined;
    let active = true;

    async function fetchTrend() {
      setLoadingTrend(true);
      setTrendError("");
      try {
        const res = await api.getNasaTrend(selectedCrew, selectedAnalyte);
        if (active) setTrend(res);
      } catch (err) {
        if (active) {
          setTrendError(
            err?.message || "Unable to load blood measure trend right now.",
          );
        }
      } finally {
        if (active) setLoadingTrend(false);
      }
    }

    fetchTrend();
    return () => {
      active = false;
    };
  }, [selectedCrew, selectedAnalyte]);

  const activeAnalyte =
    catalog?.analytes?.find((a) => a.key === selectedAnalyte) || null;
  const points = trend?.points || [];
  const latest = points.length > 0 ? points[points.length - 1] : null;
  const latestStatus = pointStatus(latest, trend?.band);
  const band = trend?.band;
  const referenceRange = trend?.referenceRange;
  const unit = trend?.unit || activeAnalyte?.unit || "";

  return (
    <div className="space-y-6">
      <BackLink href={isAuthenticated ? "/" : "/sign-in"}>
        {isAuthenticated ? "Today" : "Sign in"}
      </BackLink>

      <div className="space-y-2">
        <p className="t-label-md text-muted">Open NASA blood count dataset</p>
        <h1 className="t-h1 text-primary">Real astronaut data</h1>
        <p className="max-w-2xl text-sm leading-6 text-secondary">
          The same engine that watches Sara, run on real astronauts.
        </p>
      </div>

      {catalogError ? (
        <div
          role="alert"
          className="space-y-3 rounded-lg border border-emergency/50 bg-emergency/10 p-4 text-sm text-primary"
        >
          <p>{catalogError}</p>
          <Button type="button" variant="secondary" size="sm" onClick={loadCatalog}>
            <Icon name="refresh" size={16} />
            <span>Retry</span>
          </Button>
        </div>
      ) : null}

      <Card>
        <CardBody className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="t-label-md text-secondary">Crew member</p>
              <div className="flex flex-wrap gap-2">
                {(catalog?.crew || ["C001", "C002", "C003", "C004"]).map(
                  (crewId) => {
                    const active = selectedCrew === crewId;
                    return (
                      <button
                        key={crewId}
                        type="button"
                        disabled={loadingCatalog}
                        onClick={() => setSelectedCrew(crewId)}
                        aria-pressed={active}
                        className={`min-h-11 cursor-pointer rounded-md border px-4 py-2 font-mono text-sm font-semibold transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-smooth)] active:scale-95 ${
                          active
                            ? "border-accent bg-accent text-on-accent shadow-xs"
                            : "border-line bg-raised text-secondary hover:border-line-strong hover:bg-hover hover:text-primary"
                        }`}
                      >
                        {crewId}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor={analyteSelectId}
                className="t-label-md block text-secondary"
              >
                Blood measure
              </label>
              <select
                id={analyteSelectId}
                value={selectedAnalyte}
                disabled={loadingCatalog || !catalog?.analytes?.length}
                onChange={(e) => setSelectedAnalyte(e.target.value)}
                className="h-11 w-full rounded-md border border-line bg-canvas px-3.5 text-sm text-primary transition-colors focus:border-accent focus:outline-none"
              >
                {(catalog?.analytes || []).map((analyte) => (
                  <option key={analyte.key} value={analyte.key}>
                    {analyte.label} ({analyte.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {trendError ? (
        <div
          role="alert"
          className="rounded-lg border border-emergency/50 bg-emergency/10 px-4 py-3 text-sm text-primary"
        >
          {trendError}
        </div>
      ) : null}

      <Card>
        <CardHeader
          title={
            activeAnalyte
              ? `${selectedCrew}: ${activeAnalyte.label}`
              : "Blood measure trend"
          }
          subtitle={
            loadingTrend
              ? "Updating chart..."
              : `Each sample compared with the samples taken before it (${unit || "unit"})`
          }
          action={
            <StatusBadge tone={latestStatus.badgeTone} dot={false}>
              <Icon name={latestStatus.iconName} size={14} />
              <span>{latestStatus.label}</span>
            </StatusBadge>
          }
        />

        <CardBody>
          {loadingCatalog || (loadingTrend && !trend) ? (
            <div className="flex h-[320px] items-center justify-center rounded-md border border-dashed border-line bg-raised text-sm text-muted">
              Loading NASA OSD-569 trend...
            </div>
          ) : (
            <NasaTrendChart
              trend={trend}
              timepoints={catalog?.timepoints || []}
              analyteLabel={activeAnalyte?.label || selectedAnalyte}
              height={320}
            />
          )}

          <div className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border border-line bg-raised p-3.5">
              <p className="text-xs text-muted">Latest sample</p>
              <p className="mt-1 font-mono text-base font-semibold tabular-nums text-primary">
                {latest ? formatStat(latest.value, unit) : "Not available"}
              </p>
            </div>
            <div className="rounded-md border border-line bg-raised p-3.5">
              <p className="text-xs text-muted">Personal mean</p>
              <p className="mt-1 font-mono text-base font-semibold tabular-nums text-primary">
                {band?.ready && band.mean != null
                  ? formatStat(band.mean, unit)
                  : "Building"}
              </p>
            </div>
            <div className="rounded-md border border-line bg-raised p-3.5">
              <p className="text-xs text-muted">Watch threshold</p>
              <p className="mt-1 font-mono text-base font-semibold tabular-nums text-primary">
                {band?.ready && band.watchAt != null
                  ? formatStat(band.watchAt, unit)
                  : "Not ready"}
              </p>
            </div>
            <div className="rounded-md border border-line bg-raised p-3.5">
              <p className="text-xs text-muted">Lab reference range</p>
              <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-primary">
                {referenceRange
                  ? `${formatStat(referenceRange.low)} to ${formatStat(referenceRange.high, unit)}`
                  : "Not provided"}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted">
            <div>
              <span>Source: </span>
              {catalog?.url ? (
                <a
                  href={catalog.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-accent underline-offset-2 hover:underline"
                >
                  NASA OSDR OSD-569, SpaceX Inspiration4
                </a>
              ) : (
                <span>NASA OSDR OSD-569, SpaceX Inspiration4</span>
              )}
              {catalog?.citation ? (
                <p className="mt-1 text-muted">{catalog.citation}</p>
              ) : null}
            </div>
            <span className="font-medium">
              Decision support, not a diagnosis.
            </span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
