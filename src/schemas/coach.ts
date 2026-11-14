import { z } from "zod";
import { Disclaimer, SourceRef, Status } from "./common";

export const CoachIntent = z.enum([
  "why",
  "seriousness",
  "worsening",
  "earth",
  "action",
  "numbers",
  "baseline",
  "sleep",
  "bp",
  "routine",
  "safety",
]);
export type CoachIntent = z.infer<typeof CoachIntent>;

export const CoachKnowledgeSnippet = z.strictObject({
  id: z.string().min(1),
  ruleIds: z.array(z.string().min(1)).min(1),
  intents: z.array(CoachIntent).min(1),
  keywords: z.array(z.string().min(1)).min(1),
  sourceId: z.string().min(1),
  text: z.string().min(1),
});
export type CoachKnowledgeSnippet = z.infer<typeof CoachKnowledgeSnippet>;

export const CoachKnowledgeFile = z.strictObject({
  version: z.number().int().positive(),
  snippets: z.array(CoachKnowledgeSnippet).min(1),
});
export type CoachKnowledgeFile = z.infer<typeof CoachKnowledgeFile>;

export const CoachAskInput = z.strictObject({
  question: z.string().trim().min(2).max(400),
  cardId: z.string().min(1).optional(),
});
export type CoachAskInput = z.infer<typeof CoachAskInput>;

export const CoachProviderKind = z.enum(["deterministic", "ollama"]);
export type CoachProviderKind = z.infer<typeof CoachProviderKind>;

export const CoachAskResponse = z.object({
  cardId: z.string().nullable(),
  ruleId: z.string().nullable(),
  answer: z.string().min(1),
  grounded: z.boolean(),
  citations: z.array(SourceRef),
  banner: Status.optional(),
  suggestedQuestions: z.array(z.string().min(1)),
  disclaimer: Disclaimer,
  provider: CoachProviderKind,
});
export type CoachAskResponse = z.infer<typeof CoachAskResponse>;
