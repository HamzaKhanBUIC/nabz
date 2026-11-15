"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import BackLink from "@/components/ui/BackLink";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { REPORT_SECTIONS } from "@/lib/data/reportSections";
import { useStore } from "@/lib/data/store";

/** One-way delay to Earth as plain words, from the active mission environment. */
function delayLine(env) {
  const delay = env?.oneWayDelay;
  if (!delay?.text) return null;
  if (delay.minSeconds == null && delay.maxSeconds == null) {
    return `Signal: ${delay.text.toLowerCase()}.`;
  }
  return `Arrives in ${delay.text.toLowerCase()}. A reply takes at least twice that.`;
}

export default function SendToEarthPage() {
  const router = useRouter();
  const { environment, sendShare } = useStore();

  const [selection, setSelection] = useState({
    includeReaction: false,
    includeSleep: false,
    includeBp: false,
    includeCards: false,
  });
  const [days, setDays] = useState(7);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const baseId = useId();
  const daysId = useId();
  const noteId = useId();

  const anySelected = Object.values(selection).some(Boolean);
  const arrival = delayLine(environment?.active);

  async function handleSend(e) {
    e.preventDefault();
    if (!anySelected) {
      setErrorMsg("Tick at least one thing to share.");
      return;
    }
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
      setErrorMsg(err?.message || "Could not send. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSend} className="space-y-6">
      <BackLink href="/">Today</BackLink>

      <div>
        <h1 className="t-h1 mt-1 text-primary">Send to Earth</h1>
        <p className="mt-1 text-sm text-secondary">
          You choose what leaves the ship. Nothing is sent without you.
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

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <fieldset className="space-y-2.5">
          <legend className="mb-2.5 text-xs font-semibold tracking-wide text-muted uppercase">
            What to share
          </legend>
          {REPORT_SECTIONS.map((sec) => {
            const cid = `${baseId}-${sec.key}`;
            const checked = Boolean(selection[sec.key]);
            return (
              <label
                key={sec.key}
                htmlFor={cid}
                className={`interactive-surface flex min-h-16 cursor-pointer items-center gap-4 rounded-lg border px-4 py-3.5 ${
                  checked
                    ? "border-accent bg-raised text-primary"
                    : "border-line bg-surface text-secondary hover:bg-hover"
                }`}
              >
                <input
                  id={cid}
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    setSelection((prev) => ({ ...prev, [sec.key]: e.target.checked }))
                  }
                  className="h-5 w-5 shrink-0 accent-[var(--color-accent)]"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary">{sec.label}</p>
                  <p className="text-xs text-muted">{sec.description}</p>
                </div>
              </label>
            );
          })}

          <div className="pt-2">
            <label htmlFor={daysId} className="block text-xs font-medium text-secondary">
              How far back
            </label>
            <select
              id={daysId}
              name="days"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm text-primary transition-colors focus:border-accent focus:outline-none sm:w-60"
            >
              <option value={3}>Last 3 days</option>
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>
        </fieldset>

        <div className="space-y-5">
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">To</p>
            <p className="mt-2 text-base font-semibold text-primary">
              Flight surgeon, Mission Control
            </p>
            {arrival ? (
              <p className="mt-2 text-sm leading-6 text-secondary">{arrival}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor={noteId} className="block text-sm font-medium text-secondary">
              Note (optional)
            </label>
            <textarea
              id={noteId}
              name="note"
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything the flight surgeon should know"
              className="mt-1.5 w-full rounded-md border border-line bg-surface p-3.5 text-sm text-primary placeholder:text-muted transition-colors focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="primary" size="lg" disabled={sending || !anySelected}>
              {sending ? "Sending..." : "Send to Earth"}
              <Icon name="arrow_forward" size={18} />
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => router.push("/")}>
              Not now
            </Button>
          </div>
          {!anySelected ? (
            <p className="text-xs text-muted">Tick at least one thing to share.</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
