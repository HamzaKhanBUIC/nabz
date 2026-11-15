"use client";

import { Suspense, useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Icon from "@/components/ui/Icon";
import ChatMessage, { TypingIndicator } from "@/components/coach/ChatMessage";
import { useStore } from "@/lib/data/store";
import { coachDisclaimer } from "@/lib/data/mission";
import { makeId } from "@/lib/utils/format";

const DEFAULT_SUGGESTIONS = [
  "Why did this card show up?",
  "How serious is this right now?",
  "Should I rest or run a routine?",
  "What should I tell ground control?",
];

function ChatInterfaceInner() {
  const searchParams = useSearchParams();
  const queryCardId = searchParams.get("cardId");
  const {
    today,
    coachMessages,
    askCoach,
    addCoachMessage,
    clearCoachMessages,
  } = useStore();

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const listEndRef = useRef(null);
  const questionInputId = useId();

  const selectedCardId = queryCardId || today?.card?.id || "";

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [coachMessages.length, sending]);

  async function submitQuestion(text) {
    const trimmed = text.trim();
    if (trimmed.length < 2 || sending) {
      if (trimmed.length < 2) {
        setErrorMsg("Enter at least 2 characters to ask the coach.");
      }
      return;
    }

    setErrorMsg("");
    setInput("");
    addCoachMessage({
      id: makeId("msg"),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    });

    setSending(true);
    try {
      const response = await askCoach({
        question: trimmed,
        cardId: selectedCardId || undefined,
      });

      addCoachMessage({
        id: makeId("msg"),
        role: "assistant",
        content: response.answer,
        grounded: response.grounded,
        citations: response.citations,
        banner: response.banner,
        provider: response.provider,
        disclaimer: response.disclaimer,
        createdAt: new Date().toISOString(),
      });

      if (
        Array.isArray(response.suggestedQuestions) &&
        response.suggestedQuestions.length > 0
      ) {
        setSuggestions(response.suggestedQuestions);
      }
    } catch (err) {
      setErrorMsg(err?.message || "Coach request failed.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col">
      <div className="flex-1 space-y-4 pb-4">
        {coachMessages.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface p-5 text-sm text-secondary">
            <p className="font-semibold text-primary">
              Ask about today&apos;s readings or advice
            </p>
            <p className="mt-1.5 text-xs leading-5 text-muted">
              Uses your latest result and mission medical notes. Flags urgent symptoms right away.
            </p>
          </div>
        ) : (
          coachMessages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}

        {sending ? <TypingIndicator /> : null}
        <div ref={listEndRef} />
      </div>

      <div className="space-y-3 bg-canvas pt-2 pb-2 lg:sticky lg:bottom-0 lg:pb-6">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => submitQuestion(q)}
              disabled={sending}
              className="min-h-10 rounded-pill border border-line bg-surface px-4 py-2 text-sm font-medium text-primary transition-[transform,background-color,border-color] duration-150 hover:border-line-strong hover:bg-hover active:scale-95 disabled:opacity-60"
            >
              {q}
            </button>
          ))}
        </div>

        {errorMsg ? (
          <p role="alert" className="text-xs font-medium text-emergency">
            {errorMsg}
          </p>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitQuestion(input);
          }}
          className="flex items-center gap-2 rounded-lg border border-line bg-surface py-2 pr-2 pl-4 focus-within:border-accent"
        >
          <label htmlFor={questionInputId} className="sr-only">
            Ask your coach
          </label>
          <input
            id={questionInputId}
            name="question"
            type="text"
            maxLength={400}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && e.nativeEvent.isComposing) {
                e.preventDefault();
              }
            }}
            placeholder="Ask your coach..."
            className="min-w-0 flex-1 bg-transparent py-2 text-base text-primary placeholder:text-muted focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending}
            aria-label={sending ? "Checking" : "Send"}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-on-status transition-transform duration-150 hover:brightness-110 active:scale-95 disabled:opacity-60"
          >
            <Icon name={sending ? "hourglass_top" : "send"} size={20} />
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted">{coachDisclaimer}</p>
          {coachMessages.length > 0 ? (
            <button
              type="button"
              onClick={clearCoachMessages}
              className="text-xs font-medium text-secondary underline-offset-2 hover:text-primary hover:underline"
            >
              Clear chat
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ChatInterface() {
  return (
    <Suspense
      fallback={
        <div className="rounded-lg border border-line bg-surface p-6 text-sm text-muted">
          Loading offline coach...
        </div>
      }
    >
      <ChatInterfaceInner />
    </Suspense>
  );
}
