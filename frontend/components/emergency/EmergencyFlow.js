"use client";

/**
 * EMERGENCY MODE — screens 10 → 11 → 12/12b → 13.
 *
 * The red `Emergency bar`, the absence of a sidebar and the full-width step
 * indicator are provided by `AppShell`. This component owns the four steps.
 *
 * Safety notes (frontend-only phase):
 *   - Nothing leaves the device. "Alert medical officer" writes a local,
 *     clearly-labelled record to the CrewPulse store and moves to step 13.
 *   - Steps come from fixed data below (no AI, no network). Chest pain and
 *     "Something else" are verbatim from the handoff `screens.md`; the three
 *     remaining conditions reuse the protocol steps that already shipped with
 *     CrewPulse. No new medical procedure is invented here.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import BackLink from "@/components/ui/BackLink";
import StepIndicator from "@/components/ui/StepIndicator";
import InstructionStep from "@/components/ui/InstructionStep";
import { useStore } from "@/lib/data/store";
import { crewProfile } from "@/lib/data/mission";

const SUBJECTS = [
  { id: "me", label: "Me", icon: "person" },
  { id: "crewmate", label: "A crewmate", icon: "group" },
];

const CONDITIONS = [
  { id: "chest-pain", label: "Chest pain", icon: "cardiology" },
  { id: "breathing", label: "Trouble breathing", icon: "pulmonology" },
  { id: "collapsed", label: "Collapsed", icon: "falling" },
  { id: "bleeding", label: "Bleeding or injury", icon: "bloodtype" },
  { id: "other", label: "Something else", icon: "help" },
];

/** Verbatim from the handoff (screens.md §12 / §12b). */
const HANDOFF_STEPS = {
  "chest-pain": [
    "Alert the medical officer now",
    "Help them sit down and rest. Loosen tight clothing",
    "Give medicine only if the medical officer says so",
    "Stay with them and watch their breathing.",
  ],
  other: [
    "Alert the medical officer now",
    "Make sure the area is safe for you",
    "Check they are awake and breathing",
    "Stay with them until help arrives.",
  ],
};

/** Protocol steps already present in CrewPulse — reused, never re-written. */
const EXISTING_PROTOCOL_STEPS = [
  "Ensure the scene is safe — check for hazards, electrical or pressure risks.",
  "Stay with the patient. Monitor breathing and responsiveness.",
  "Note the time of onset and any changes in condition.",
  "Keep the medical officer informed of every change.",
];

function stepsFor(conditionId) {
  return HANDOFF_STEPS[conditionId] || EXISTING_PROTOCOL_STEPS;
}

function headingFor(conditionId) {
  if (conditionId === "other") return "Do this now";
  const condition = CONDITIONS.find((entry) => entry.id === conditionId);
  return `Do this now: ${condition ? condition.label.toLowerCase() : ""}`;
}

function EmergencyTile({ icon, label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex h-[160px] w-full max-w-[248px] sm:w-[248px] shrink-0 flex-col items-center justify-center gap-4 rounded-lg border transition-colors ${
        selected
          ? "border-transparent bg-emergency text-white"
          : "border-line-strong bg-surface text-primary hover:bg-hover"
      }`}
    >
      <Icon
        name={icon}
        filled
        size={32}
        className={selected ? "text-white" : "text-emergency"}
      />
      <span className="t-h3">{label}</span>
    </button>
  );
}

export default function EmergencyFlow() {
  const router = useRouter();
  const store = useStore();

  const [step, setStep] = useState(1);
  const [subject, setSubject] = useState(null);
  const [condition, setCondition] = useState(null);
  const [doneSteps, setDoneSteps] = useState([]);
  const [alertedAt, setAlertedAt] = useState(null);

  const subjectOption = SUBJECTS.find((entry) => entry.id === subject);
  const conditionOption = CONDITIONS.find((entry) => entry.id === condition);
  const steps = condition ? stepsFor(condition) : [];

  function chooseSubject(id) {
    setSubject(id);
    setStep(2);
  }

  function chooseCondition(id) {
    setCondition(id);
    setDoneSteps([]);
    setStep(3);
  }

  function toggleStep(index) {
    setDoneSteps((current) =>
      current.includes(index)
        ? current.filter((entry) => entry !== index)
        : [...current, index]
    );
  }

  function alertMedicalOfficer() {
    const now = new Date();
    setAlertedAt(now);
    setDoneSteps((current) =>
      current.includes(0) ? current : [...current, 0]
    );

    const conditionLabel = conditionOption ? conditionOption.label : "Unknown";
    store.addEmergencyLog({
      subjectId: subject,
      subject: subject === "me" ? crewProfile.fullName : "Crewmate",
      subjectRole: subject === "me" ? crewProfile.role : "Crew",
      situationId: condition,
      situation: conditionLabel,
      severity: "critical",
      status: "alerted",
      startedAt: now.toISOString(),
      endedAt: now.toISOString(),
      notified: [],
      events: [
        {
          at: now.toISOString(),
          message: `SIMULATED: medical officer alerted for ${conditionLabel.toLowerCase()} (no external service is contacted).`,
        },
      ],
    });

    setStep(4);
  }

  const rootClass = "flex min-h-[calc(100vh-112px)] flex-col";
  const indicator = <StepIndicator step={step} total={4} variant="full" />;

  /* ---------------------------------------------------------------- 10 / 11 */
  if (step === 1 || step === 2) {
    const isWho = step === 1;
    const body = isWho
      ? "Tap one. Help steps change depending on who needs it."
      : `For: ${subject === "me" ? "you" : "a crewmate"}. Pick the closest match. No typing needed.`;

    return (
      <div className={rootClass}>
        {indicator}

        <div className="mt-10 min-h-[20px]">
          {isWho ? null : (
            <BackLink onClick={() => setStep(1)}>Back</BackLink>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center">
          <div className="my-auto flex w-full flex-col items-center text-center">
            <h1 className="t-display text-primary">
              {isWho ? "Who is this for?" : "What is happening?"}
            </h1>
            <p className="mt-4 max-w-[560px] t-body-md text-muted">{body}</p>

            <div className="mt-8 flex w-full flex-wrap justify-center gap-4">
              {isWho
                ? SUBJECTS.map((entry) => (
                    <EmergencyTile
                      key={entry.id}
                      icon={entry.icon}
                      label={entry.label}
                      selected={subject === entry.id}
                      onClick={() => chooseSubject(entry.id)}
                    />
                  ))
                : CONDITIONS.map((entry) => (
                    <EmergencyTile
                      key={entry.id}
                      icon={entry.icon}
                      label={entry.label}
                      selected={condition === entry.id}
                      onClick={() => chooseCondition(entry.id)}
                    />
                  ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------- 12 */
  if (step === 3) {
    return (
      <div className={rootClass}>
        {indicator}

        <div className="mt-10 min-h-[20px]">
          <BackLink onClick={() => setStep(2)}>Back</BackLink>
        </div>

        <div className="mt-10">
          <h1 className="t-display text-primary">{headingFor(condition)}</h1>
          <p className="mt-4 t-body-md text-muted">
            Tap each step when it is done.
          </p>

          <div className="mt-8 flex flex-col gap-8 xl:flex-row xl:justify-between">
            <ol className="flex w-full max-w-[640px] flex-col gap-3">
              {steps.map((text, index) => (
                <li key={text}>
                  <InstructionStep
                    number={index + 1}
                    done={doneSteps.includes(index)}
                    onToggle={() => toggleStep(index)}
                  >
                    {text}
                  </InstructionStep>
                </li>
              ))}
            </ol>

            <div className="flex w-full max-w-[360px] flex-col gap-4">
              <Button
                variant="danger"
                size="lg"
                icon="emergency"
                iconFilled
                onClick={alertMedicalOfficer}
              >
                Alert medical officer
              </Button>
              <Button variant="secondary" size="lg" href="/measure">
                Check heart rate &amp; oxygen
              </Button>
              <p className="text-sm leading-4 text-muted">
                Draft steps. Check them against the crew medical checklist
                before the demo.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------- 13 */
  const alertTime = alertedAt
    ? alertedAt.toTimeString().slice(0, 5)
    : "--:--";

  return (
    <div className={rootClass}>
      {indicator}

      <div className="mt-8">
        <h1 className="t-display text-primary">Help is on the way</h1>
        <p className="mt-4 t-body-md text-muted">
          Keep following the steps until the medical officer takes over.
        </p>

        <div className="mt-8 inline-flex min-h-[56px] w-fit max-w-full items-center gap-3 rounded-lg bg-normal px-6 py-4 text-on-status">
          <Icon name="check_circle" filled size={24} />
          <span className="text-base font-medium leading-6">
            Medical officer alerted at {alertTime}.{" "}
            {subject === "me"
              ? "Stay where you are until help arrives."
              : "Stay with your crewmate."}
          </span>
        </div>

        <ol className="mt-8 flex max-w-[640px] flex-col gap-3">
          {steps.map((text, index) => (
            <li key={text}>
              <InstructionStep
                number={index + 1}
                done={doneSteps.includes(index)}
                onToggle={() => toggleStep(index)}
              >
                {text}
              </InstructionStep>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap gap-4">
          <Button size="lg" href="/">
            Close emergency mode
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setStep(3)}>
            Back to steps
          </Button>
        </div>

        <p className="mt-4 t-caption text-muted">
          Simulated alert — nothing is transmitted from this device.
        </p>
      </div>
    </div>
  );
}
