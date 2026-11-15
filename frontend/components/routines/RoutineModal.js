"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";

function formatClock(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

let supportsDisplayTransition;
function canTransitionDisplay() {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (!window.CSS?.supports?.("transition-behavior", "allow-discrete") || !document.body) {
    return false;
  }
  const probe = document.createElement("div");
  probe.style.cssText =
    "transition: display 1s allow-discrete !important; display: block;";
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = "none";
  supportsDisplayTransition = getComputedStyle(probe).display === "block";
  probe.remove();
  return supportsDisplayTransition;
}

function supportsTopLayerExit() {
  return Boolean(window.CSS?.supports?.("overlay", "auto") && canTransitionDisplay());
}

async function closeTopLayer(element) {
  if (!element || !element.open) return;
  if (!supportsTopLayerExit()) {
    element.setAttribute("data-closing", "");
    const animations = element.getAnimations({ subtree: true });
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((r) => setTimeout(r, 320)),
      ]);
    }
    if (!element.hasAttribute("data-closing")) return;
    element.removeAttribute("data-closing");
  }
  if (element.open) element.close();
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
    <div className="mt-2.5 flex flex-wrap items-center gap-2">
      <span
        aria-live="polite"
        className="inline-flex min-h-8 items-center gap-1.5 rounded-pill border border-line bg-canvas px-3 py-1 tabular-nums text-xs font-semibold text-primary tabular-nums"
      >
        <Icon name="timer" size={14} className="text-accent" />
        {remaining === 0 ? "Done" : formatClock(remaining)}
      </span>
      <button
        type="button"
        onClick={() => setRunning((r) => !r)}
        disabled={remaining === 0}
        className="min-h-8 rounded-md border border-line bg-raised px-3 py-1 text-xs font-medium text-primary transition-[transform,background-color] duration-150 hover:bg-hover active:scale-[0.97] disabled:opacity-50"
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
          className="min-h-8 rounded-md border border-line px-3 py-1 text-xs font-medium text-secondary transition-colors hover:bg-hover"
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

  const requestClose = useCallback(() => {
    closeTopLayer(dialogRef.current);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (routine) {
      dialog.removeAttribute("data-closing");
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      closeTopLayer(dialog);
    }

    const handleClose = () => {
      dialog.returnValue = "";
      setDoneIds({});
      onClose?.();
    };
    const handleCancel = (event) => {
      event.preventDefault();
      closeTopLayer(dialog);
    };

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("cancel", handleCancel);

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
        if (pressedOutside && isOutside(e)) closeTopLayer(dialog);
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
      dialog.removeEventListener("cancel", handleCancel);
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
      className="mx-auto mt-auto mb-0 w-full max-w-[640px] max-h-[88dvh] overflow-y-auto rounded-t-2xl border border-line-strong bg-surface p-0 text-primary shadow-2xl sm:my-auto sm:w-[min(640px,calc(100vw-2rem))] sm:rounded-lg"
    >
      {routine ? (
        <div
          className="p-5 sm:p-6"
          style={{
            paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
            <div className="min-w-0">
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
              onClick={requestClose}
              aria-label="Close routine"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line bg-raised text-secondary transition-[transform,background-color,color] duration-150 hover:bg-hover hover:text-primary active:scale-95"
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
                  className="rounded-md border border-line bg-raised p-4 transition-colors duration-150"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleStep(step.id)}
                      aria-pressed={checked}
                      aria-label={`Mark step ${index + 1} ${checked ? "incomplete" : "complete"}`}
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-[transform,background-color,border-color] duration-150 active:scale-95 ${
                        checked
                          ? "border-normal bg-normal text-on-status"
                          : "border-line-strong bg-canvas text-secondary hover:bg-hover"
                      }`}
                    >
                      {checked ? <Icon name="check" size={16} /> : index + 1}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium leading-6 ${
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
              <Button type="button" variant="primary" onClick={requestClose}>
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
