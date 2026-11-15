"use client";

import { useEffect, useId, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";

function formatClock(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function StepTimer({ seconds }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || remaining <= 0) return undefined;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, remaining]);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span
        aria-live="polite"
        className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-canvas px-3 py-1 font-mono text-xs font-semibold text-primary"
      >
        <Icon name="timer" size={14} className="text-accent" />
        {remaining === 0 ? "Done" : formatClock(remaining)}
      </span>
      <button
        type="button"
        onClick={() => setRunning((r) => !r)}
        disabled={remaining === 0}
        className="rounded-md border border-line bg-raised px-2.5 py-1 text-xs font-medium text-primary hover:bg-hover disabled:opacity-50"
      >
        {running ? "Pause" : remaining === seconds ? "Start timer" : "Resume"}
      </button>
      {remaining !== seconds ? (
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setRemaining(seconds);
          }}
          className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-secondary hover:bg-hover"
        >
          Reset
        </button>
      ) : null}
    </div>
  );
}

export default function RoutineModal({ routine, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [doneIds, setDoneIds] = useState({});

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (routine) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }

    const handleClose = () => {
      dialog.returnValue = "";
      setDoneIds({});
      onClose?.();
    };
    dialog.addEventListener("close", handleClose);

    let pointerCleanup;
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      let pressedOutside = false;
      const isOutside = (e) => {
        const rect = dialog.getBoundingClientRect();
        return (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        );
      };
      const onDown = (e) => {
        pressedOutside = isOutside(e);
      };
      const onUp = (e) => {
        if (pressedOutside && isOutside(e)) dialog.close();
      };
      dialog.addEventListener("pointerdown", onDown);
      dialog.addEventListener("pointerup", onUp);
      pointerCleanup = () => {
        dialog.removeEventListener("pointerdown", onDown);
        dialog.removeEventListener("pointerup", onUp);
      };
    }

    return () => {
      dialog.removeEventListener("close", handleClose);
      pointerCleanup?.();
    };
  }, [routine, onClose]);

  const toggleStep = (id) => {
    setDoneIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby={titleId}
      className="m-auto w-[min(640px,calc(100vw-2rem))] max-h-[85vh] overflow-y-auto rounded-lg border border-line-strong bg-surface p-0 text-primary shadow-2xl"
    >
      {routine ? (
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="info" dot={false}>
                  {routine.category}
                </StatusBadge>
                <span className="text-xs text-muted">
                  ~{Math.max(1, Math.round((routine.durationSeconds || 60) / 60))} min
                </span>
              </div>
              <h2 id={titleId} className="t-h2 mt-2 text-primary">
                {routine.title}
              </h2>
              <p className="mt-1 text-sm text-secondary">{routine.summary}</p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close routine"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line bg-raised text-secondary hover:bg-hover hover:text-primary"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          <ol className="mt-5 space-y-3">
            {routine.steps.map((step, index) => {
              const checked = Boolean(doneIds[step.id]);
              return (
                <li
                  key={step.id}
                  className="rounded-md border border-line bg-raised p-4"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleStep(step.id)}
                      aria-pressed={checked}
                      aria-label={`Mark step ${index + 1} ${checked ? "incomplete" : "complete"}`}
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                        checked
                          ? "border-normal bg-normal text-on-status"
                          : "border-line-strong bg-canvas text-secondary hover:bg-hover"
                      }`}
                    >
                      {checked ? <Icon name="check" size={16} /> : index + 1}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          checked ? "text-muted line-through" : "text-primary"
                        }`}
                      >
                        {step.text}
                      </p>
                      {step.detail ? (
                        <p className="mt-1 text-xs leading-5 text-secondary">
                          {step.detail}
                        </p>
                      ) : null}
                      {step.timerSeconds ? (
                        <StepTimer
                          key={`${routine.id}:${step.id}:${step.timerSeconds}`}
                          seconds={step.timerSeconds}
                        />
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-5 border-t border-line pt-4">
            <p className="text-xs font-medium text-muted">{routine.disclaimer}</p>
            {Array.isArray(routine.sources) && routine.sources.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                {routine.sources.map((src) => (
                  <a
                    key={src.id}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline-offset-2 hover:underline"
                  >
                    {src.title}
                  </a>
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                variant="primary"
                onClick={() => dialogRef.current?.close()}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
