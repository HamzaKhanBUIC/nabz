"use client";

import { Suspense, useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
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

  const [customCardId, setCustomCardId] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const listEndRef = useRef(null);
  const contextSelectId = useId();
  const questionInputId = useId();

  const selectedCardId = customCardId || queryCardId || today?.card?.id || "";

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [coachMessages.length, sending]);

  const activeCards = today?.cards || (today?.card ? [today.card] : []);

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
    <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <Icon name="smart_toy" size={20} className="text-accent" />
          <span className="text-sm font-semibold text-primary">
            Offline health coach
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeCards.length > 0 ? (
            <div className="flex items-center gap-2">
              <label htmlFor={contextSelectId} className="text-xs text-muted">
                Context card:
              </label>
              <select
                id={contextSelectId}
                value={selectedCardId}
                onChange={(e) => setCustomCardId(e.target.value)}
                className="max-w-[220px] rounded-md border border-line bg-canvas px-2.5 py-1.5 text-xs text-primary transition-colors focus:border-accent focus:outline-none"
              >
                {activeCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {coachMessages.length > 0 ? (
            <button
              type="button"
              onClick={clearCoachMessages}
              className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-secondary transition-colors hover:bg-hover hover:text-primary"
            >
              Clear thread
            </button>
          ) : null}
        </div>
      </div>

      <div className="h-[min(56dvh,460px)] space-y-4 overflow-y-auto p-4 sm:p-5">
        {coachMessages.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface p-5 text-sm text-secondary shadow-card">
            <p className="font-semibold text-primary">
              Ask about today&apos;s readings or advice
            </p>
            <p className="mt-1.5 text-xs leading-5 text-muted">
              Uses your open action card and mission medical notes. Works offline and flags urgent symptoms right away.
            </p>
          </div>
        ) : (
          coachMessages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}

        {sending ? <TypingIndicator /> : null}
        <div ref={listEndRef} />
      </div>

      <div className="space-y-3 border-t border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => submitQuestion(q)}
              disabled={sending}
              className="min-h-8 rounded-pill border border-line bg-raised px-3.5 py-1.5 text-xs font-medium text-secondary transition-[transform,background-color,border-color,color] duration-150 hover:border-line-strong hover:bg-hover hover:text-primary active:scale-[0.98] disabled:opacity-50"
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
          className="flex flex-wrap gap-2"
        >
          <label htmlFor={questionInputId} className="sr-only">
            Ask a question
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
            placeholder="Ask why your card appeared, what to watch, or when to recheck..."
            className="min-w-[200px] flex-1 rounded-md border border-line bg-canvas px-4 py-3 text-sm text-primary placeholder:text-muted transition-colors focus:border-accent focus:outline-none"
          />
          <Button type="submit" variant="primary" disabled={sending} className="w-full sm:w-auto">
            <Icon name="send" size={18} />
            {sending ? "Checking..." : "Ask coach"}
          </Button>
        </form>

        <p className="text-[11px] text-muted">{coachDisclaimer}</p>
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
