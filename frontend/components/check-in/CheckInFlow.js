"use client";

/**
 * DAILY CHECK-IN flow — screens 02 (Get ready) → 03 (Test) → 04 / 04b.
 *
 * 02 : instructions + "I'm ready"
 * 03 : 3 rounds on the reaction pad, then the average is recorded and the
 *      result screen opens automatically (the Primary button gets you there
 *      straight away).
 */

import { useEffect, useRef, useState } from "react";
import BackLink from "@/components/ui/BackLink";
import Button from "@/components/ui/Button";
import InstructionStep from "@/components/ui/InstructionStep";
import { Card } from "@/components/ui/Card";
import ReactionPad from "@/components/check-in/ReactionPad";
import CheckInResult from "@/components/check-in/CheckInResult";
import { feelingById } from "@/components/dashboard/FeelingChips";
import { useStore } from "@/lib/data/store";

const ROUNDS = 3;

const INSTRUCTIONS = [
  "Sit somewhere stable and hold the screen at arm's length.",
  "Use the same hand as every day.",
  "When the circle turns blue, tap it as fast as you can.",
];

export default function CheckInFlow() {
  const store = useStore();

  const [phase, setPhase] = useState("ready");
  const [round, setRound] = useState(1);
  const [results, setResults] = useState([]);
  const [record, setRecord] = useState(null);

  const advanceTimer = useRef(null);

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    []
  );

  const finish = (rounds) => {
    const average = Math.round(
      rounds.reduce((sum, value) => sum + value, 0) / rounds.length
    );
    const latestMood = store.moodLogs[0] || null;
    const feeling = latestMood?.feeling ? feelingById(latestMood.feeling) : null;
    const timestamp = new Date().toISOString();

    store.addCheckIn({
      timestamp,
      reactionTimeMs: average,
      reactionRounds: rounds,
      mood: latestMood?.mood ?? null,
      feeling: feeling?.id ?? null,
      feelingLabel: feeling?.label ?? null,
    });

    setRecord({
      timestamp,
      average,
      rounds,
      feelingLabel: feeling?.label || "not recorded",
    });
    setPhase("result");
  };

  const handleResult = (ms) => {
    const next = [...results, ms];
    setResults(next);

    if (next.length >= ROUNDS) {
      advanceTimer.current = setTimeout(() => finish(next), 1400);
    } else {
      setRound(next.length + 1);
    }
  };

  const seeResult = () => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    if (results.length >= ROUNDS) finish(results);
  };

  const restart = () => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    setResults([]);
    setRound(1);
    setPhase("test");
  };

  const allDone = results.length >= ROUNDS;

  /* ---------------- 04 / 04b ---------------- */
  if (phase === "result" && record) {
    return <CheckInResult record={record} />;
  }

  /* ---------------- 02 · Get ready ---------------- */
  if (phase === "ready") {
    return (
      <div>
        <BackLink href="/">Today</BackLink>
        <h1 className="mt-6 t-h1 text-primary">Reaction check-in</h1>
        <p className="mt-2 t-body-md text-muted">
          Three short rounds, about 2 minutes. The test starts only when you say
          you are ready.
        </p>

        <div className="mt-9 flex flex-col gap-3">
          {INSTRUCTIONS.map((text, index) => (
            <InstructionStep key={text} number={index + 1}>
              {text}
            </InstructionStep>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Button
            variant="primary"
            size="lg"
            arrow
            onClick={() => setPhase("test")}
          >
            I&rsquo;m ready
          </Button>
          <Button href="/" variant="ghost" size="lg">
            Not now
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------- 03 · Test ---------------- */
  return (
    <div>
      <BackLink href="/check-in" onClick={() => setPhase("ready")}>
        Reaction check-in
      </BackLink>
      <h1 className="mt-6 t-h1 text-primary">Round {round} of {ROUNDS}</h1>
      <p className="mt-2 t-body-md text-muted">
        Tap the circle to start the round.
      </p>

      <Card className="mt-9 overflow-hidden">
        <ReactionPad
          key={round}
          round={round}
          rounds={results}
          onResult={handleResult}
        />
      </Card>

      <div className="mt-8 flex flex-wrap gap-4">
        <Button
          variant="primary"
          size="lg"
          arrow
          disabled={!allDone}
          onClick={seeResult}
        >
          See my result
        </Button>
        <Button variant="ghost" size="lg" onClick={restart}>
          Restart
        </Button>
      </div>
    </div>
  );
}
