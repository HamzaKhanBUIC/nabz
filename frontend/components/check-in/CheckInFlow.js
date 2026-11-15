"use client";

import { useId, useState } from "react";
import BackLink from "@/components/ui/BackLink";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
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
        <h1 className="t-h1 mt-1 text-primary">3-minute reaction check-in</h1>
        <p className="mt-1 text-sm text-secondary">
          Tap as soon as each blue cue appears. Takes {Math.max(1, Math.round(protoDurationSec / 60))} minutes.
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
        <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="How the test works"
              subtitle={`3-minute PVT-B session · ${isiMinSec} to ${isiMaxSec} s random intervals`}
            />
            <CardBody>
              <div className="space-y-3">
                <InstructionStep number={1}>
                  Watch the reaction pad. Wait {isiMinSec} to {isiMaxSec} seconds between targets.
                </InstructionStep>
                <InstructionStep number={2}>
                  Tap anywhere inside the pad (or press Space) as soon as the blue cue appears.
                </InstructionStep>
                <InstructionStep number={3}>
                  Wait for the cue before tapping. Early taps and slow responses (&gt;= {protocol?.lapseMs ?? 355} ms) are tracked separately.
                </InstructionStep>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Last rest period (optional)"
              subtitle="Adds context to today's reaction score"
            />
            <CardBody>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitError("");
                  setStage("test");
                }}
                className="space-y-5"
              >
                <label
                  htmlFor={sleepToggleId}
                  className="flex min-h-11 cursor-pointer items-center gap-3"
                >
                  <input
                    id={sleepToggleId}
                    type="checkbox"
                    checked={includeSleep}
                    onChange={(e) => setIncludeSleep(e.target.checked)}
                    className="h-5 w-5 accent-[var(--color-accent)]"
                  />
                  <span className="text-sm font-medium text-primary">
                    Include hours slept before this check-in
                  </span>
                </label>

                {includeSleep ? (
                  <div>
                    <label
                      htmlFor={sleepInputId}
                      className="block text-xs font-medium text-secondary"
                    >
                      Hours slept (0 to 16 h)
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
                      className="mt-1.5 w-full max-w-[200px] rounded-md border border-line bg-canvas px-3.5 py-2.5 tabular-nums text-sm text-primary transition-colors focus:border-accent focus:outline-none"
                    />
                  </div>
                ) : null}

                <div className="pt-1">
                  <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">
                    <Icon name="play_arrow" size={20} />
                    Start 3-minute reaction test
                  </Button>
                </div>
              </form>
            </CardBody>
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
