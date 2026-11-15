"use client";

/**
 * AI Health Coach conversation interface.
 *
 * Frontend only: replies come from a clearly-labelled mock response mechanism
 * (lib/data/demo.js). The message pipeline is structured so a real
 * backend/LLM API can replace `generateMockReply` later without UI changes.
 *
 * Never presents itself as a medical diagnosis.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  RefreshCcw,
  SendHorizonal,
} from "lucide-react";
import ChatMessage, { TypingIndicator } from "@/components/coach/ChatMessage";
import { buttonClassName } from "@/components/ui/Button";
import { useStore } from "@/lib/data/store";
import { DEMO_COACH_RESPONSES } from "@/lib/data/demo";
import { coachDisclaimer, crewProfile } from "@/lib/data/mission";

const SUGGESTED_QUESTIONS = [
  "Is this serious?",
  "What if it gets worse?",
  "Should I tell Earth?",
];

/**
 * Mock reply routing — the single integration point for a future API.
 * All replies are explicitly marked as placeholders.
 */
function generateMockReply(text) {
  const normalized = text.toLowerCase();
  if (normalized.includes("serious")) return DEMO_COACH_RESPONSES.serious;
  if (
    normalized.includes("worse") ||
    normalized.includes("get worse") ||
    normalized.includes("worsen")
  ) {
    return DEMO_COACH_RESPONSES.worse;
  }
  if (
    normalized.includes("earth") ||
    normalized.includes("tell") ||
    normalized.includes("share")
  ) {
    return DEMO_COACH_RESPONSES.earth;
  }
  return DEMO_COACH_RESPONSES.default;
}

export default function ChatInterface() {
  const router = useRouter();
  const store = useStore();
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef(null);
  const pendingTimerRef = useRef(null);

  // Seed conversation once when empty.
  const seededRef = useRef(false);
  useEffect(() => {
    if (store.hydrated && !seededRef.current && store.coachMessages.length === 0) {
      seededRef.current = true;
      store.addCoachMessage({
        role: "coach",
        content: `Hi ${crewProfile.firstName} — I'm your AI Health Coach. Ask me about your readings, sleep, mood or reaction time. I can only give general guidance until the medical backend is connected.`,
        placeholder: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.hydrated]);

  // Keep scrolled to the newest message.
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [store.coachMessages.length, pending]);

  useEffect(() => () => clearTimeout(pendingTimerRef.current), []);

  const canSend = input.trim().length > 0 && !pending;

  const send = (text) => {
    const content = (text ?? input).trim();
    if (!content || pending) return;

    store.addCoachMessage({ role: "user", content });
    setInput("");
    setPending(true);

    // Simulated latency for the mock response.
    pendingTimerRef.current = setTimeout(() => {
      store.addCoachMessage({
        role: "coach",
        content: generateMockReply(content),
        placeholder: true,
      });
      setPending(false);
    }, 1100);
  };

  // Suggested questions from the context panel dispatch this event.
  useEffect(() => {
    const onCoachQuestion = (event) => {
      const question = event.detail?.question;
      if (question) send(question);
    };
    window.addEventListener("crewpulse:coach-question", onCoachQuestion);
    return () => window.removeEventListener("crewpulse:coach-question", onCoachQuestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const suggestionList = useMemo(
    () =>
      SUGGESTED_QUESTIONS.filter(
        (question) =>
          !store.coachMessages.some((m) => m.role === "user" && m.content === question)
      ),
    [store.coachMessages]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Conversation */}
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-line bg-surface shadow-card">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-nasa-blue text-white">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy">AI Health Coach</p>
              <p className="flex items-center gap-1.5 text-[11px] text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-warn" aria-hidden="true" />
                Demo mode — mock responses
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => store.resetCoachMessages()}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-medium text-muted transition-colors hover:bg-canvas hover:text-navy"
              title="Clear conversation"
            >
              <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Clear</span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-medium text-navy transition-colors hover:bg-canvas"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Back to dashboard</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="min-h-[320px] flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5"
          style={{ maxHeight: "min(58vh, 560px)" }}
          aria-live="polite"
        >
          <ul className="space-y-4">
            {store.coachMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {pending ? <TypingIndicator /> : null}
          </ul>
        </div>

        {/* Suggested prompts */}
        {suggestionList.length > 0 && !pending ? (
          <div className="border-t border-line px-4 py-3 sm:px-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestionList.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => send(question)}
                  className="rounded-lg border border-accent/40 bg-accent-subtle px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-hover"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Input */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
          className="border-t border-line px-4 py-3 sm:px-5"
        >
          <label htmlFor="coach-input" className="sr-only">
            Message the AI Health Coach
          </label>
          <div className="flex items-center gap-2">
            <input
              id="coach-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your sleep, mood or reaction time…"
              autoComplete="off"
              className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3.5 text-sm text-navy outline-none transition-colors placeholder:text-muted/70 focus:border-nasa-blue focus:bg-surface"
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Send message"
              className={`${buttonClassName("primary", "icon")} shrink-0`}
            >
              <SendHorizonal className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {coachDisclaimer}
          </p>
        </form>
      </div>
    </div>
  );
}
