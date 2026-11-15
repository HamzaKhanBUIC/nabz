"use client";

/**
 * SCREEN 00 — Sign in and profile selection.
 *
 * No app shell: a single centred card (520 wide, radius-lg, padding 48).
 * Offline crew sign-in — profile + 4-digit PIN, no email/password.
 * The session is stored in localStorage by `lib/data/session`.
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { CREW_PROFILES, PIN_LENGTH, useSession } from "@/lib/data/session";

function LogoMark() {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent"
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="M3 12h3.6l1.7-4.2 2.6 8.4 1.8-5.1 1.1 2.4H21"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function ProfileOption({ profile, selected, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex w-full items-center gap-4 rounded-lg border-2 p-4 text-left transition-colors ${
        selected
          ? "border-accent bg-raised"
          : "border-line bg-surface hover:bg-hover"
      }`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-raised text-muted">
        <Icon name="person" size={24} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-semibold leading-6 text-primary">
          {profile.name}
        </span>
        <span className="block truncate text-sm leading-5 text-muted">
          {profile.role}
        </span>
      </span>
      {selected ? (
        <Icon name="check_circle" filled size={24} className="text-accent" />
      ) : null}
    </button>
  );
}

function PinField({ value, onChange, error }) {
  const inputRef = useRef(null);
  const digits = Array.from({ length: PIN_LENGTH }, (_, i) => value[i] || "");

  return (
    <div>
      <label
        htmlFor="crew-pin"
        className="mb-2.5 block t-label-md text-secondary"
      >
        Crew PIN
      </label>
      <div
        className="flex gap-3 rounded-md focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus"
        onClick={() => inputRef.current?.focus()}
      >
        {digits.map((digit, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={`flex h-[72px] w-12 sm:w-16 flex-1 max-w-16 items-center justify-center rounded-md border bg-surface text-2xl font-semibold text-primary ${
              error ? "border-emergency" : "border-line"
            }`}
          >
            {digit ? "•" : ""}
          </span>
        ))}
      </div>
      <input
        ref={inputRef}
        id="crew-pin"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        pattern="[0-9]*"
        maxLength={PIN_LENGTH}
        value={value}
        onChange={(event) =>
          onChange(event.target.value.replace(/[^0-9]/g, "").slice(0, PIN_LENGTH))
        }
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? "crew-pin-error" : undefined}
        className="sr-only"
      />
      {error ? (
        <p id="crew-pin-error" role="alert" className="mt-2 text-sm text-emergency">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useSession();

  const [selectedId, setSelectedId] = useState(CREW_PROFILES[0].id);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(null);

  const canSubmit = pin.length === PIN_LENGTH;

  const submit = (event) => {
    event.preventDefault();
    if (!canSubmit) {
      setError(`Enter your ${PIN_LENGTH}-digit crew PIN to continue.`);
      return;
    }
    signIn(selectedId);
    router.push("/");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      {/* The shell has no top bar on screen 00, so the theme control lives
          here to keep it reachable everywhere in the app. */}
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <form
        onSubmit={submit}
        noValidate
        className="flex w-full max-w-[520px] flex-col gap-6 rounded-lg border border-line bg-surface p-6 sm:p-12"
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <LogoMark />
          <span className="t-h3 text-primary">CrewPulse</span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="t-h1 text-primary">Who is checking in?</h1>
          <p className="t-body-md text-muted">
            This device is shared by the crew and works offline.
          </p>
        </div>

        <div role="radiogroup" aria-label="Select your profile" className="flex flex-col gap-3">
          {CREW_PROFILES.map((profile) => (
            <ProfileOption
              key={profile.id}
              profile={profile}
              selected={profile.id === selectedId}
              onSelect={() => setSelectedId(profile.id)}
            />
          ))}
        </div>

        <PinField
          value={pin}
          onChange={(next) => {
            setPin(next);
            if (error) setError(null);
          }}
          error={error}
        />

        <div className="flex flex-col gap-3">
          <Button type="submit" variant="primary" size="lg" arrow className="w-full">
            Sign in
          </Button>
          <p className="t-caption text-center text-muted">
            Forgot your PIN? The medical officer can reset it.
          </p>
        </div>
      </form>
    </div>
  );
}
