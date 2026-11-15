"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import BackLink from "@/components/ui/BackLink";
import Button from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import ReportPreview from "@/components/reports/ReportPreview";
import { REPORT_SECTIONS } from "@/lib/data/reportSections";
import { useStore } from "@/lib/data/store";
import { getEarthDelayLabel } from "@/lib/data/mission";

export default function SendToEarthPage() {
  const router = useRouter();
  const { mission, previewShare, sendShare } = useStore();

  const [selection, setSelection] = useState({
    includeReaction: true,
    includeSleep: true,
    includeBp: true,
    includeCards: true,
  });
  const [days, setDays] = useState(7);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const baseId = useId();
  const daysId = useId();
  const noteId = useId();

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoadingPreview(true);
      setErrorMsg("");
      try {
        const res = await previewShare({
          ...selection,
          days: Number(days),
          ...(note.trim() ? { note: note.trim() } : {}),
        });
        if (active) setPreview(res);
      } catch (err) {
        if (active) setErrorMsg(err?.message || "Failed to generate preview.");
      } finally {
        if (active) setLoadingPreview(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [selection, days, note, previewShare]);

  async function handleSend(e) {
    e.preventDefault();
    setSending(true);
    setErrorMsg("");
    try {
      const queued = await sendShare({
        ...selection,
        days: Number(days),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      router.push(`/sent?id=${encodeURIComponent(queued.id)}`);
    } catch (err) {
      setErrorMsg(err?.message || "Failed to queue downlink package.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <BackLink href="/">Today</BackLink>

      <div>
        <p className="t-label-md text-muted">
          Voluntary downlink · {getEarthDelayLabel(mission)}
        </p>
        <h1 className="t-h1 mt-1 text-primary">Send summary to Earth</h1>
        <p className="mt-1 text-sm text-secondary">
          Review every line first. Nothing is queued until you confirm.
        </p>
      </div>

      {errorMsg ? (
        <div
          role="alert"
          className="rounded-lg border border-emergency/50 bg-emergency/10 px-4 py-3 text-sm text-primary"
        >
          {errorMsg}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader
            title="Select contents"
            subtitle="Choose what to share with mission medical support"
          />

          <CardBody>
            <form onSubmit={handleSend} className="space-y-5">
              <fieldset className="space-y-2.5">
                <legend className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Included sections
                </legend>
                {REPORT_SECTIONS.map((sec) => {
                  const cid = `${baseId}-${sec.key}`;
                  const checked = Boolean(selection[sec.key]);
                  return (
                    <label
                      key={sec.key}
                      htmlFor={cid}
                      className={`interactive-surface flex min-h-12 cursor-pointer items-start gap-3 rounded-md border p-3.5 ${
                        checked
                          ? "border-accent bg-raised text-primary"
                          : "border-line bg-canvas text-secondary hover:bg-hover"
                      }`}
                    >
                      <input
                        id={cid}
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setSelection((prev) => ({
                            ...prev,
                            [sec.key]: e.target.checked,
                          }))
                        }
                        className="mt-0.5 h-5 w-5 accent-[var(--color-accent)]"
                      />
                      <div>
                        <p className="text-sm font-semibold">{sec.label}</p>
                        <p className="text-xs text-muted">{sec.description}</p>
                      </div>
                    </label>
                  );
                })}
              </fieldset>

              <div>
                <label htmlFor={daysId} className="block text-xs font-medium text-secondary">
                  Time window
                </label>
                <select
                  id={daysId}
                  name="days"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-md border border-line bg-canvas px-3.5 py-2.5 text-sm text-primary transition-colors focus:border-accent focus:outline-none"
                >
                  <option value={3}>Last 3 days</option>
                  <option value={7}>Last 7 days</option>
                  <option value={14}>Last 14 days</option>
                  <option value={30}>Last 30 days</option>
                </select>
              </div>

              <div>
                <label htmlFor={noteId} className="block text-xs font-medium text-secondary">
                  Optional crew note (max 500 chars)
                </label>
                <textarea
                  id={noteId}
                  name="note"
                  rows={3}
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Context for flight surgeon..."
                  className="mt-1.5 w-full rounded-md border border-line bg-canvas p-3.5 text-sm text-primary placeholder:text-muted transition-colors focus:border-accent focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full justify-center"
                disabled={sending}
              >
                <Icon name="send" size={18} />
                {sending ? "Queuing downlink..." : "Confirm & queue summary"}
              </Button>
            </form>
          </CardBody>
        </Card>

        <ReportPreview preview={preview} loading={loadingPreview} />
      </div>
    </div>
  );
}
