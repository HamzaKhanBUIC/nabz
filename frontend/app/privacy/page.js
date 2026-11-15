"use client";

import { useCallback, useEffect, useId, useState } from "react";
import BackLink from "@/components/ui/BackLink";
import Button from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import * as api from "@/lib/api";
import { formatDateTime } from "@/lib/utils/format";

export default function PrivacyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [shareWithMedicalOfficer, setShareWithMedicalOfficer] = useState(false);
  const [accessLog, setAccessLog] = useState([]);

  const switchId = useId();

  const loadConsent = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.getConsent();
      setShareWithMedicalOfficer(Boolean(res?.shareWithMedicalOfficer));
      setAccessLog(Array.isArray(res?.accessLog) ? res.accessLog : []);
    } catch (err) {
      setErrorMsg(err?.message || "Unable to load privacy settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api
      .getConsent()
      .then((res) => {
        if (!active) return;
        setShareWithMedicalOfficer(Boolean(res?.shareWithMedicalOfficer));
        setAccessLog(Array.isArray(res?.accessLog) ? res.accessLog : []);
        setErrorMsg("");
      })
      .catch((err) => {
        if (!active) return;
        setErrorMsg(err?.message || "Unable to load privacy settings.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleToggle() {
    if (loading || saving) return;
    const nextValue = !shareWithMedicalOfficer;
    setSaving(true);
    setErrorMsg("");
    setStatusMsg("");
    try {
      const updated = await api.setConsent(nextValue);
      setShareWithMedicalOfficer(Boolean(updated?.shareWithMedicalOfficer));
      setAccessLog(Array.isArray(updated?.accessLog) ? updated.accessLog : []);
      setStatusMsg(
        updated?.shareWithMedicalOfficer
          ? "Summary sharing turned on."
          : "Summary sharing turned off.",
      );
    } catch (err) {
      setErrorMsg(err?.message || "Unable to update sharing preference.");
    } finally {
      setSaving(false);
    }
  }

  const orderedLog = [...accessLog].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

  return (
    <div className="space-y-6">
      <BackLink href="/">Today</BackLink>

      <div>
        <p className="t-label-md text-muted">Crew data control</p>
        <h1 className="t-h1 mt-1 text-primary">Privacy</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-secondary">
          Control whether the crew Medical Officer can see your daily summary. Sharing is off by default.
        </p>
      </div>

      {errorMsg ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emergency/50 bg-emergency/10 px-4 py-3 text-sm text-primary"
        >
          <span>{errorMsg}</span>
          <Button type="button" variant="secondary" size="sm" onClick={loadConsent}>
            Retry
          </Button>
        </div>
      ) : null}

      <Card>
        <CardHeader
          title="Medical Officer sharing"
          subtitle="Only high-level daily status is shared. Raw taps, readings, notes, and coach questions stay private."
          action={
            <StatusBadge
              tone={shareWithMedicalOfficer ? "ok" : "neutral"}
              dot={false}
            >
              <Icon
                name={shareWithMedicalOfficer ? "check_circle" : "lock"}
                size={14}
              />
              <span>
                {loading
                  ? "Checking..."
                  : shareWithMedicalOfficer
                    ? "Sharing on"
                    : "Sharing off"}
              </span>
            </StatusBadge>
          }
        />

        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-line bg-raised p-4">
            <label
              htmlFor={switchId}
              className="min-w-[min(100%,220px)] flex-1 cursor-pointer text-sm font-semibold text-primary"
            >
              Share my daily summary with the crew Medical Officer
            </label>

            <button
              id={switchId}
              type="button"
              role="switch"
              aria-checked={shareWithMedicalOfficer}
              disabled={loading || saving}
              onClick={handleToggle}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-pill border transition-colors duration-200 disabled:opacity-50 ${
                shareWithMedicalOfficer
                  ? "border-accent bg-accent"
                  : "border-line-strong bg-canvas"
              }`}
            >
              <span className="sr-only">
                Share my daily summary with the crew Medical Officer
              </span>
              <span
                className={`inline-block h-6 w-6 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                  shareWithMedicalOfficer ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {statusMsg ? (
            <p role="status" className="text-xs font-medium text-normal">
              {statusMsg}
            </p>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Access log"
          subtitle="Record of every time the Medical Officer viewed the crew overview while your sharing was on"
        />

        <CardBody>
          {loading ? (
            <p className="text-sm text-muted">Loading access log...</p>
          ) : orderedLog.length === 0 ? (
            <p className="rounded-md border border-dashed border-line bg-raised p-4 text-sm text-muted">
              No one has viewed your summary.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {orderedLog.map((entry, idx) => (
                <li
                  key={`${entry.viewerId}-${entry.at}-${idx}`}
                  className="flex items-start gap-2.5 rounded-md border border-line bg-raised px-4 py-3 text-sm text-primary"
                >
                  <Icon
                    name="visibility"
                    size={18}
                    className="mt-0.5 shrink-0 text-accent"
                  />
                  <span>
                    {entry.viewerName} viewed your summary on{" "}
                    {formatDateTime(entry.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
