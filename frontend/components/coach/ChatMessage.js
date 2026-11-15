"use client";

/**
 * Chat message bubble (user right / coach left).
 * Coach replies carry a clear "placeholder" marker when mock.
 */

import { Bot, User } from "lucide-react";
import { formatTime } from "@/lib/utils/format";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";
  const isPlaceholder = message.placeholder === true;

  return (
    <li
      className={`flex w-full gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser ? (
        <span
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nasa-blue-soft text-nasa-blue"
          aria-hidden="true"
        >
          <Bot className="h-4 w-4" />
        </span>
      ) : null}

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${
          isUser
            ? "rounded-tr-sm bg-nasa-blue text-white"
            : isPlaceholder
              ? "rounded-tl-sm border border-line bg-raised"
              : "rounded-tl-sm border border-line bg-surface shadow-card"
        }`}
      >
        {isPlaceholder && !isUser ? (
          <p className="mb-1.5 inline-flex items-center gap-1 rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
            Placeholder response
          </p>
        ) : null}

        <p
          className={`text-sm leading-relaxed ${
            isUser ? "text-white" : "text-ink"
          }`}
        >
          {message.content}
        </p>

        <p
          className={`mt-1.5 text-right font-mono text-[10px] ${
            isUser ? "text-white/60" : "text-muted"
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>

      {isUser ? (
        <span
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-raised text-secondary"
          aria-hidden="true"
        >
          <User className="h-4 w-4" />
        </span>
      ) : null}
    </li>
  );
}

/** Typing indicator shown while a mock reply is "thinking". */
export function TypingIndicator() {
  return (
    <li className="flex w-full gap-3">
      <span
        className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nasa-blue-soft text-nasa-blue"
        aria-hidden="true"
      >
        <Bot className="h-4 w-4" />
      </span>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-line bg-surface px-4 py-4 shadow-card">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-nasa-blue"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: "1s" }}
            aria-hidden="true"
          />
        ))}
        <span className="sr-only">Coach is typing</span>
      </div>
    </li>
  );
}
