"use client";

import { useEffect, useState } from "react";
import BackLink from "@/components/ui/BackLink";
import Button from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import { useSession } from "@/lib/data/session";
import { useStore } from "@/lib/data/store";

const COMMANDER_ONLY_MESSAGE =
  "Only the Commander can change the mission environment.";

export default function EnvironmentPage() {
  const { crew } = useSession();
  const {
    hydrated,
    environment,
    refreshEnvironment,
    switchEnvironment,
  } = useStore();

  const [draftId, setDraftId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!hydrated || environment) return undefined;
    let activeFlag = true;

    refreshEnvironment().catch((err) => {
      if (activeFlag) {
        setLoadError(err?.message || "Unable to load mission environment.");
      }
    });

    return () => {
      activeFlag = false;
    };
  }, [hydrated, environment, refreshEnvironment]);

  const activeEnv = environment?.active || null;
  const options = Array.isArray(environment?.options) ? environment.options : [];
  const isCommander = crew?.role === "Commander";
  const selectedId = draftId ?? activeEnv?.id ?? "";
  // The API resolves the active environment's sources (content/sources.json); the client keeps no copy.
  const resolvedSources = Array.isArray(environment?.sources) ? environment.sources : [];

  async function handleRetry() {
    setRetrying(true);
    setLoadError("");
    try {
      await refreshEnvironment();
    } catch (err) {
      setLoadError(err?.message || "Unable to load mission environment.");
    } finally {
      setRetrying(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!selectedId || saving) return;
    setSaving(true);
    setSaveError("");
    setSaveMessage("");
    try {
      const updated = await switchEnvironment(selectedId);
      setDraftId(null);
      setSaveMessage(
        `Mission environment updated to ${updated?.active?.name || selectedId}.`,
      );
    } catch (err) {
      if (err?.status === 403) {
        setSaveError(COMMANDER_ONLY_MESSAGE);
      } else {
        setSaveError(err?.message || "Unable to save mission environment.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <BackLink href="/">Today</BackLink>

      <div className="space-y-2">
        <p className="t-label-md text-muted">Mission profile</p>
        <h1 className="t-h1 text-primary">Mission environment</h1>
        <p className="max-w-2xl text-sm leading-6 text-secondary">
          Communication delay, gravity, time to care, radiation estimates, and who to
          contact depend on where the crew is stationed.
        </p>
      </div>

      {!activeEnv ? (
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
                Loading active mission environment...
              </p>
            )}
          </CardBody>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader
              title={activeEnv.name}
              subtitle="Active mission profile"
              action={
                <StatusBadge tone="info" dot={false} className="py-1.5 text-sm">
                  <Icon name="satellite_alt" size={16} />
                  <span>Active</span>
                </StatusBadge>
              }
            />
            <CardBody className="space-y-5">
              <div className="flex items-start gap-3 rounded-lg border border-attention/40 bg-attention/10 px-4 py-3">
                <Icon
                  name="contact_phone"
                  size={20}
                  className="mt-0.5 shrink-0 text-attention"
                />
                <div className="min-w-0">
                  <p className="t-label-md text-secondary">Escalation rule</p>
                  <p className="mt-0.5 text-sm font-semibold text-primary">
                    {activeEnv.escalation}
                  </p>
                </div>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-line bg-raised p-3.5">
                  <dt className="t-label-md text-muted">One-way Earth delay</dt>
                  <dd className="mt-1 text-base font-semibold text-primary">
                    {activeEnv.oneWayDelay?.text || "Unknown"}
                  </dd>
                </div>
                <div className="rounded-lg border border-line bg-raised p-3.5">
                  <dt className="t-label-md text-muted">Time to definitive care</dt>
                  <dd className="mt-1 text-base font-semibold text-primary">
                    {activeEnv.timeToCare}
                  </dd>
                </div>
                <div className="rounded-lg border border-line bg-raised p-3.5">
                  <dt className="t-label-md text-muted">Care lead</dt>
                  <dd className="mt-1 text-base font-semibold text-primary">
                    {activeEnv.careLead}
                  </dd>
                </div>
                <div className="rounded-lg border border-line bg-raised p-3.5">
                  <dt className="t-label-md text-muted">Gravity</dt>
                  <dd className="mt-1 text-base font-semibold text-primary">
                    {activeEnv.gravity}
                  </dd>
                </div>
                <div className="rounded-lg border border-line bg-raised p-3.5">
                  <dt className="t-label-md text-muted">Day length</dt>
                  <dd className="mt-1 text-base font-semibold text-primary">
                    {activeEnv.dayLengthHours} h
                  </dd>
                </div>
              </dl>

              {activeEnv.blackoutNote ? (
                <div className="flex items-start gap-2.5 rounded-lg border border-line bg-raised px-4 py-3 text-sm text-secondary">
                  <Icon
                    name="info"
                    size={18}
                    className="mt-0.5 shrink-0 text-accent"
                  />
                  <div>
                    <p className="t-label-md text-secondary">Comms blackout note</p>
                    <p className="mt-0.5 text-primary">{activeEnv.blackoutNote}</p>
                  </div>
                </div>
              ) : null}

              {resolvedSources.length > 0 ? (
                <div className="border-t border-line pt-4 text-xs text-muted">
                  <p className="t-label-md mb-2 text-secondary">Sources</p>
                  <ul className="space-y-1.5">
                    {resolvedSources.map((src) => (
                      <li key={src.id}>
                        {src.url ? (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-accent underline-offset-2 hover:underline"
                          >
                            <span>{src.title}</span>
                            <Icon name="open_in_new" size={13} />
                          </a>
                        ) : (
                          <span>{src.title}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Available environments"
              subtitle="All 5 mission profiles supported by CrewPulse"
            />
            <CardBody className="space-y-4">
              {isCommander ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <fieldset className="space-y-2.5">
                    <legend className="sr-only">Select mission environment</legend>
                    {options.map((opt) => {
                      const isSelected = selectedId === opt.id;
                      const isActive = activeEnv.id === opt.id;
                      return (
                        <label
                          key={opt.id}
                          className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors ${
                            isSelected
                              ? "border-accent bg-accent/10 text-primary"
                              : "border-line bg-raised text-secondary hover:border-line-strong hover:bg-hover hover:text-primary"
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <input
                              type="radio"
                              name="mission-environment"
                              value={opt.id}
                              checked={isSelected}
                              onChange={() => {
                                setDraftId(opt.id);
                                setSaveMessage("");
                                setSaveError("");
                              }}
                              className="h-4 w-4 shrink-0 accent-accent"
                            />
                            <span className="text-sm font-medium text-primary">
                              {opt.name}
                            </span>
                          </span>
                          {isActive ? (
                            <span className="shrink-0 rounded-pill border border-accent/40 bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                              Current
                            </span>
                          ) : null}
                        </label>
                      );
                    })}
                  </fieldset>

                  {saveMessage ? (
                    <div
                      role="status"
                      className="flex items-center gap-2 rounded-lg border border-normal/40 bg-normal/10 px-4 py-3 text-sm font-medium text-primary"
                    >
                      <Icon name="check_circle" size={18} className="shrink-0 text-normal" />
                      <span>{saveMessage}</span>
                    </div>
                  ) : null}

                  {saveError ? (
                    <div
                      role="alert"
                      className="flex items-center gap-2 rounded-lg border border-emergency/50 bg-emergency/10 px-4 py-3 text-sm font-medium text-primary"
                    >
                      <Icon name="warning" size={18} className="shrink-0 text-emergency" />
                      <span>{saveError}</span>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={saving || !selectedId}
                    >
                      <Icon name="tune" size={18} />
                      {saving ? "Saving..." : "Save environment"}
                    </Button>
                    {crew?.role ? (
                      <span className="text-xs text-muted">
                        Signed in as {crew.name} ({crew.role})
                      </span>
                    ) : null}
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <ul className="space-y-2.5" aria-label="Mission environment options">
                    {options.map((opt) => {
                      const isActive = activeEnv.id === opt.id;
                      return (
                        <li
                          key={opt.id}
                          className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
                            isActive
                              ? "border-accent bg-accent/10 text-primary"
                              : "border-line bg-raised text-secondary"
                          }`}
                        >
                          <span className="text-sm font-medium text-primary">
                            {opt.name}
                          </span>
                          {isActive ? (
                            <span className="shrink-0 rounded-pill border border-accent/40 bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                              Current
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>

                  <div className="flex items-center gap-2.5 rounded-lg border border-line bg-raised px-4 py-3 text-sm text-secondary">
                    <Icon name="lock" size={18} className="shrink-0 text-muted" />
                    <span>{COMMANDER_ONLY_MESSAGE}</span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
