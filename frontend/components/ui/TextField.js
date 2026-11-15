"use client";

/**
 * Text field — handoff components.md (added for sign in and profile):
 *   "Text field | state: Default, Focused | Label, Value
 *    | 420px, 56px input, focus-ring 2px when focused"
 *
 * Measured on screen 15: label 14/500 above a 420px field, 8px gap, focus
 * state drawn as a 2px `--color-focus` ring inside the border so the field
 * never changes size.
 */

import { useId } from "react";

export default function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  type = "text",
  inputMode,
  autoComplete,
  autoFocus,
  name,
  className = "",
  ...rest
}) {
  const id = useId();

  return (
    <div className={`flex w-full flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="t-label-md text-secondary">
        {label}
      </label>
      <input
        id={id}
        name={name || id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        value={value}
        onChange={onChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-14 w-full rounded-md border bg-surface px-4 text-base text-primary outline-none transition-colors placeholder:text-muted focus:border-focus focus:shadow-[inset_0_0_0_1px_var(--color-focus)] ${
          error ? "border-emergency" : "border-line"
        }`}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="t-caption text-emergency">
          {error}
        </p>
      ) : hint ? (
        <p className="t-caption text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
