"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button, { buttonClassName } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import * as api from "@/lib/api";
import { getCrewInitials, useSession } from "@/lib/data/session";

const IS_DEMO_BUILD = process.env.NEXT_PUBLIC_DEMO === "1";

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useSession();

  const [crewList, setCrewList] = useState([]);
  const [loadingCrew, setLoadingCrew] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedCrewId, setSelectedCrewId] = useState("");
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lockouts, setLockouts] = useState({});
  const [nowMs, setNowMs] = useState(0);

  const codeInputId = useId();
  const codeErrorId = useId();
  const codeInputRef = useRef(null);

  const loadCrew = useCallback(async () => {
    setLoadingCrew(true);
    setLoadError("");
    try {
      const data = await api.listCrew();
      const list = Array.isArray(data?.crew) ? data.crew : [];
      setCrewList(list);
    } catch (err) {
      setLoadError(
        err?.message || "Unable to load crew list from the local server.",
      );
    } finally {
      setLoadingCrew(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api
      .listCrew()
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data?.crew) ? data.crew : [];
        setCrewList(list);
        setLoadError("");
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(
          err?.message || "Unable to load crew list from the local server.",
        );
      })
      .finally(() => {
        if (active) setLoadingCrew(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const hasActiveLockout = Object.values(lockouts).some(
    (until) => until > nowMs,
  );

  useEffect(() => {
    if (!hasActiveLockout) return undefined;
    const id = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [hasActiveLockout]);

  const selectedCrew =
    crewList.find((member) => member.id === selectedCrewId) || null;
  const lockedUntil = selectedCrewId ? lockouts[selectedCrewId] || 0 : 0;
  const lockoutRemaining =
    lockedUntil > nowMs ? Math.ceil((lockedUntil - nowMs) / 1000) : 0;

  const activeError =
    lockoutRemaining > 0
      ? `Too many tries. Wait ${lockoutRemaining} seconds`
      : errorMessage;

  function handleSelectCrew(member) {
    setSelectedCrewId(member.id);
    setErrorMessage("");
    setCode("");
    setTimeout(() => {
      codeInputRef.current?.focus();
    }, 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || lockoutRemaining > 0) return;

    if (!selectedCrewId) {
      setErrorMessage("Pick a crew member first.");
      return;
    }

    if (!/^\d{4,8}$/.test(code)) {
      setErrorMessage("Enter a 4 to 8 digit numeric code.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      await signIn(selectedCrewId, code);
      router.replace("/");
    } catch (err) {
      if (err?.code === "invalid_code") {
        setErrorMessage("That code didn't match. Try again.");
      } else if (err?.code === "locked") {
        const seconds = Math.max(1, Number(err?.retryAfterSeconds) || 60);
        const startMs = Date.now();
        setNowMs(startMs);
        setLockouts((prev) => ({
          ...prev,
          [selectedCrewId]: startMs + seconds * 1000,
        }));
      } else {
        setErrorMessage(err?.message || "Unable to sign in right now.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="rounded-lg border border-emergency/50 bg-emergency/10 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Icon
              name="emergency"
              filled
              size={24}
              className="mt-0.5 shrink-0 text-emergency"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">
                Need help right now?
              </p>
              <p className="mt-0.5 text-xs leading-5 text-secondary">
                Emergency guides open immediately with no sign-in needed.
              </p>
            </div>
          </div>
          <Link
            href="/emergency"
            className={buttonClassName("danger", "md", "shrink-0")}
          >
            <Icon name="emergency" filled size={18} />
            <span>Emergency</span>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Crew sign in"
          titleAs="h1"
          subtitle="Pick your name and enter your numeric crew code to view your own health records."
        />

        <CardBody className="space-y-6">
          {loadingCrew ? (
            <div className="rounded-md border border-dashed border-line bg-raised p-6 text-center text-sm text-muted">
              Loading crew roster...
            </div>
          ) : loadError ? (
            <div
              role="alert"
              className="space-y-3 rounded-md border border-emergency/50 bg-emergency/10 p-4 text-sm text-primary"
            >
              <p>{loadError}</p>
              <Button type="button" variant="secondary" size="sm" onClick={loadCrew}>
                <Icon name="refresh" size={16} />
                <span>Retry</span>
              </Button>
            </div>
          ) : (
            <fieldset className="space-y-2.5">
              <legend className="t-label-md text-secondary">
                1. Pick your name
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {crewList.map((member) => {
                  const selected = selectedCrewId === member.id;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleSelectCrew(member)}
                      aria-pressed={selected}
                      className={`interactive-surface flex min-h-14 cursor-pointer items-center gap-3 rounded-md border p-3.5 text-left ${
                        selected
                          ? "border-accent bg-raised"
                          : "border-line bg-canvas hover:border-line-strong hover:bg-hover"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                          selected
                            ? "bg-accent text-on-accent"
                            : "bg-raised text-primary"
                        }`}
                      >
                        {getCrewInitials(member.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-primary">
                          {member.name}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {member.role}
                        </p>
                      </div>
                      {selected ? (
                        <Icon
                          name="check_circle"
                          filled
                          size={20}
                          className="shrink-0 text-accent"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor={codeInputId} className="t-label-md block text-secondary">
                {selectedCrew
                  ? `2. Enter code for ${selectedCrew.name}`
                  : "2. Enter your 4 to 8 digit code"}
              </label>

              <div className="flex items-stretch gap-2">
                <input
                  ref={codeInputRef}
                  id={codeInputId}
                  name="code"
                  type={showCode ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]{4,8}"
                  maxLength={8}
                  autoComplete="one-time-code"
                  placeholder="4 to 8 digits"
                  value={code}
                  disabled={!selectedCrew || loadingCrew}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 8);
                    setCode(digitsOnly);
                    if (errorMessage) setErrorMessage("");
                  }}
                  aria-invalid={activeError ? true : undefined}
                  aria-describedby={activeError ? codeErrorId : undefined}
                  className={`h-14 min-w-0 flex-1 rounded-md border bg-surface px-4 tabular-nums text-base tracking-[0.2em] text-primary outline-none transition-colors placeholder:font-sans placeholder:tracking-normal placeholder:text-muted focus:border-focus focus:shadow-[inset_0_0_0_1px_var(--color-focus)] disabled:opacity-50 ${
                    activeError ? "border-emergency" : "border-line"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCode((v) => !v)}
                  aria-label={showCode ? "Hide code" : "Show code"}
                  className="inline-flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-md border border-line bg-surface text-secondary transition-colors hover:bg-hover hover:text-primary"
                >
                  <Icon name={showCode ? "visibility_off" : "visibility"} size={20} />
                </button>
              </div>

              {activeError ? (
                <p
                  id={codeErrorId}
                  role="alert"
                  className="flex items-center gap-1.5 text-sm font-medium text-emergency"
                >
                  <Icon name="warning" size={16} className="shrink-0" />
                  <span>{activeError}</span>
                </p>
              ) : null}
            </div>

            {IS_DEMO_BUILD ? (
              <p className="rounded-md border border-line bg-raised px-3.5 py-2.5 text-xs text-secondary">
                Demo build: crew codes are listed in the project README.
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/real-data"
                  className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent underline-offset-2 hover:underline"
                >
                  <Icon name="biotech" size={18} />
                  <span>Real astronaut data</span>
                </Link>
                <Link
                  href="/hazards"
                  className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent underline-offset-2 hover:underline"
                >
                  <Icon name="health_and_safety" size={18} />
                  <span>5 hazards</span>
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={
                  submitting ||
                  loadingCrew ||
                  !selectedCrew ||
                  lockoutRemaining > 0
                }
                className="w-full sm:w-auto"
              >
                <Icon name="login" size={18} />
                <span>{submitting ? "Signing in..." : "Sign in"}</span>
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <p className="px-1 text-center text-xs leading-5 text-muted">
        Nabz is a NASA Space Apps Challenge 2026 project built with public NASA data. It is
        not affiliated with or endorsed by NASA.
      </p>
    </div>
  );
}
