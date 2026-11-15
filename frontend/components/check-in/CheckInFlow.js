"use client";

import { useId, useState } from "react";
import BackLink from "@/components/ui/BackLink";
import { Card, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import InstructionStep from "@/components/ui/InstructionStep";
import StepIndicator from "@/components/ui/StepIndicator";
import ReactionPad from "@/components/check-in/ReactionPad";
import CheckInResult from "@/components/check-in/CheckInResult";
import { useStore } from "@/lib/data/store";

export default function CheckInFlow() {
  const { protocol, submitCheckin } = useStore();
  const [stage, setStage] = useState("intro"); // intro | test | result
  const [includeSleep, setIncludeSleep] = useState(true);
  const [sleepHours, setSleepHours] = useState("7.5");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null);

  const sleepToggleId = useId();
  const sleepInputId = useId();

  const protoDurationSec = protocol?.durationMs
    ? Math.round(protocol.durationMs / 1000)
    : 180;
  const isiMinSec = ((protocol?.isiMinMs ?? 1000) / 1000).toFixed(0);
  const isiMaxSec = ((protocol?.isiMaxMs ?? 4000) / 1000).toFixed(0);

  async function handleComplete(payload) {
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await submitCheckin(payload);
      setResult(response);
      setStage("result");
    } catch (err) {
      setSubmitError(err?.message || "Could not submit check-in.");
      setStage("intro");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <BackLink href="/">Today</BackLink>

      <div>
        <p className="t-label-md text-muted">Daily readiness · PVT-B + Sleep</p>
        <h1 className="t-h1 mt-1 text-primary">3-minute reaction check-in</h1>
        <p className="mt-1 text-sm text-secondary">
          Captures raw inter-stimulus gaps and millisecond reaction times for server scoring.
        </p>
      </div>

      <StepIndicator
        step={stage === "intro" ? 1 : stage === "test" ? 2 : 3}
        total={3}
      />

      {submitError ? (
        <div
          role="alert"
          className="rounded-lg border border-emergency/50 bg-emergency/10 px-4 py-3 text-sm text-primary"
        >
          {submitError}
        </div>
      ) : null}

      {stage === "intro" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Protocol rules"
              subtitle={`Loaded from ${protocol ? "backend protocol" : "PVT-B defaults"} (${protoDurationSec}s session)`}
            />
            <div className="mt-4 space-y-3">
              <InstructionStep number={1}>
                Keep focus on the reaction box. Wait between {isiMinSec}–{isiMaxSec} s for each blue target.
              </InstructionStep>
              <InstructionStep number={2}>
                Tap the pad or press Spacebar as quickly as possible after the target appears.
              </InstructionStep>
              <InstructionStep number={3}>
                Avoid tapping early before the cue; false starts and lapses (&gt;= {protocol?.lapseMs ?? 355} ms) are logged.
              </InstructionStep>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Sleep before check-in (optional)"
              subtitle="Helps the backend explain reaction speed shifts"
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitError("");
                setStage("test");
              }}
              className="mt-4 space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <input
                  id={sleepToggleId}
                  type="checkbox"
                  checked={includeSleep}
                  onChange={(e) => setIncludeSleep(e.target.checked)}
                  className="h-5 w-5 accent-[var(--color-accent)]"
                />
                <label htmlFor={sleepToggleId} className="text-sm font-medium text-primary">
                  Include hours slept last rest period
                </label>
              </div>

              {includeSleep ? (
                <div>
                  <label htmlFor={sleepInputId} className="block text-xs font-medium text-secondary">
                    Hours slept (0 – 16 h)
                  </label>
                  <input
                    id={sleepInputId}
                    name="sleepHours"
                    type="number"
                    min={0}
                    max={16}
                    step={0.5}
                    required
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    className="mt-1.5 w-full max-w-[200px] rounded-md border border-line bg-canvas px-3 py-2 text-sm text-primary"
                  />
                </div>
              ) : null}

              <div className="pt-2">
                <Button type="submit" variant="primary" size="lg">
                  <Icon name="play_arrow" size={20} />
                  Start 3-minute reaction test
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      {stage === "test" ? (
        <ReactionPad
          protocol={protocol}
          sleepHours={includeSleep ? sleepHours : undefined}
          submitting={submitting}
          onComplete={handleComplete}
          onCancel={() => setStage("intro")}
        />
      ) : null}

      {stage === "result" ? (
        <CheckInResult
          record={result}
          onReset={() => {
            setResult(null);
            setStage("intro");
          }}
        />
      ) : null}
    </div>
  );
}
