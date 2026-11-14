import {
  buildDeterministicCoachAnswer,
  type CoachAnswer,
  type CoachContext,
} from "../../core";
import type { CoachProviderKind } from "../../schemas";

export type { CoachAnswer, CoachContext };

export interface CoachResult extends CoachAnswer {
  provider: CoachProviderKind;
}

export interface CoachProvider {
  readonly kind: CoachProviderKind;
  explain(ctx: CoachContext): Promise<CoachResult>;
}

/**
 * Default zero-dependency deterministic explanation provider.
 * Uses only the active card facts and verified content snippets; never invents thresholds.
 */
export class DeterministicCoachProvider implements CoachProvider {
  readonly kind: CoachProviderKind = "deterministic";

  async explain(ctx: CoachContext): Promise<CoachResult> {
    return {
      ...buildDeterministicCoachAnswer(ctx),
      provider: "deterministic",
    };
  }
}

export interface OllamaCoachOptions {
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
}

/**
 * Optional local Ollama explanation provider (e.g. qwen3:4b per research/CHECKS.md R7).
 * Safety invariant: deterministic retrieval & red-flag detection run first in `buildDeterministicCoachAnswer`;
 * Ollama never runs on ungrounded questions and automatically falls back to deterministic offline text if unreachable.
 */
export class OllamaCoachProvider implements CoachProvider {
  readonly kind: CoachProviderKind = "ollama";
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly fallback = new DeterministicCoachProvider();

  constructor(options: OllamaCoachOptions = {}) {
    this.baseUrl = (options.baseUrl ?? process.env.OLLAMA_URL ?? "http://127.0.0.1:11434").replace(
      /\/$/,
      "",
    );
    this.model = options.model ?? process.env.OLLAMA_MODEL ?? "qwen3:4b";
    this.timeoutMs = options.timeoutMs ?? 4_000;
  }

  async explain(ctx: CoachContext): Promise<CoachResult> {
    const baseline = await this.fallback.explain(ctx);
    // Out-of-scope queries or ungrounded safety warnings are handled strictly by deterministic rules.
    if (!baseline.grounded) {
      return baseline;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const systemPrompt = [
        "You are crewpulse's onboard explanation assistant on a Mars transit ship.",
        "Explain ONLY using the provided Action Card facts and Verified Snippets.",
        "Never diagnose, invent numbers, or contradict the card severity.",
        "Keep the answer to 2-3 concise, practical sentences.",
      ].join(" ");

      const userPrompt = JSON.stringify({
        question: ctx.question,
        card: {
          ruleId: ctx.card.ruleId,
          severity: ctx.card.severity,
          title: ctx.card.title,
          whatChanged: ctx.card.whatChanged,
          whyItMatters: ctx.card.whyItMatters,
          whatToDo: ctx.card.whatToDo,
          facts: ctx.card.facts,
        },
        verifiedSnippets: ctx.snippets.map((s) => ({ sourceId: s.sourceId, text: s.text })),
      });

      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          stream: false,
          options: { temperature: 0 },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!res.ok) return baseline;
      const data = (await res.json()) as { message?: { content?: string } };
      const text = data.message?.content?.trim();
      if (!text) return baseline;

      return {
        ...baseline,
        answer: text,
        provider: "ollama",
      };
    } catch {
      return baseline;
    } finally {
      clearTimeout(timer);
    }
  }
}

export function createCoachProvider(): CoachProvider {
  if (process.env.COACH_PROVIDER === "ollama") {
    return new OllamaCoachProvider();
  }
  return new DeterministicCoachProvider();
}
