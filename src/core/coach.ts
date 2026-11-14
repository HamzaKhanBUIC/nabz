import type {
  Card,
  CoachIntent,
  CoachKnowledgeSnippet,
  Routine,
  SourceRef,
  Status,
} from "../schemas";
import {
  COACH_NO_SOURCE_REPLY,
  COACH_RED_FLAG_TERMS,
  COACH_URGENT_BANNER_LABEL,
} from "./constants";

export interface CoachContext {
  card: Card;
  question: string;
  snippets: readonly CoachKnowledgeSnippet[];
  linkedRoutine?: Routine;
  sourceMap: ReadonlyMap<string, SourceRef>;
}

export interface CoachAnswer {
  answer: string;
  grounded: boolean;
  citations: SourceRef[];
  banner?: Status;
  suggestedQuestions: string[];
}

const UNCOVERED_TOPIC_TERMS = [
  "ibuprofen",
  "acetaminophen",
  "paracetamol",
  "tylenol",
  "antibiotic",
  "antibiotics",
  "aspirin",
  "insulin",
  "medication",
  "medicine",
  "drug",
  "drugs",
  "pill",
  "pills",
  "prescription",
  "prescribe",
  "dosage",
  "dose",
  "toothache",
  "dental",
  "cavity",
  "tooth pain",
  "painkiller",
  "fracture",
  "broken bone",
  "sprain",
  "appendicitis",
  "pneumonia",
  "infection",
  "covid",
  "malaria",
  "cancer",
  "rash",
  "fever",
  "cough",
  "nausea",
  "vomiting",
  "diarrhea",
  "ultrasound",
  "x-ray",
  "xray",
  "mri",
  "surgery",
  "stitches",
  "headache",
  "migraine",
  "weather",
  "stock",
  "recipe",
  "capital",
  "football",
  "bread",
] as const;

const DOMAIN_CUE_TERMS = [
  "reaction",
  "speed",
  "slow",
  "slower",
  "sleep",
  "slept",
  "lapse",
  "lapses",
  "false start",
  "baseline",
  "normal",
  "zone",
  "band",
  "blood pressure",
  "bp",
  "systolic",
  "diastolic",
  "hypertension",
  "hypotension",
  "cuff",
  "retest",
  "recheck",
  "card",
  "result",
  "score",
  "serious",
  "worse",
  "worsen",
  "earth",
  "flight surgeon",
  "delay",
  "mars",
  "routine",
  "test",
  "pvt",
  "number",
  "numbers",
  "mean",
  "sd",
  "z-score",
  "dizzy",
  "faint",
  "fainting",
  "chest pain",
  "breathe",
  "breathing",
  "alert",
  "crewmate",
  "today",
  "this",
] as const;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsTerm(normalizedLower: string, term: string): boolean {
  const escaped = escapeRegex(term);
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i").test(normalizedLower);
}

/**
 * Scans the question and active card for red-flag emergency triggers.
 * Fixed deterministic code always owns urgent escalation banners.
 */
export function detectCoachRedFlag(question: string, card: Card): Status | undefined {
  const qLower = question.toLowerCase();
  if (card.severity === "urgent") {
    return {
      level: "urgent",
      label: COACH_URGENT_BANNER_LABEL,
      iconKey: "alert",
    };
  }
  for (const term of COACH_RED_FLAG_TERMS) {
    if (containsTerm(qLower, term)) {
      return {
        level: "urgent",
        label: COACH_URGENT_BANNER_LABEL,
        iconKey: "alert",
      };
    }
  }
  return undefined;
}

/** Deterministic intent parser over Sara's question text. */
export function classifyCoachIntents(question: string): Set<CoachIntent> {
  const intents = new Set<CoachIntent>();
  if (/\b(why|cause|reason|happened|dropped|slow|slower|high|low|shifted|different|change|changed|explain)\b/i.test(question)) {
    intents.add("why");
  }
  if (/\b(serious|severe|danger|dangerous|worry|worried|critical|emergency|safe|okay|concern)\b/i.test(question)) {
    intents.add("seriousness");
  }
  if (/\b(worse|worsen|worsening|tomorrow|persist|persistent|keeps?|continues?|happen\s+if|escalat)\b/i.test(question)) {
    intents.add("worsening");
  }
  if (/\b(earth|flight\s*surgeon|tell|send|share|delay|mars|report|wait|comms)\b/i.test(question)) {
    intents.add("earth");
  }
  if (/\b(what\s+should|what\s+to\s+do|should\s+i\s+do|help|recommend|next\s+step|what\s+now|steps?)\b/i.test(question)) {
    intents.add("action");
  }
  if (/\b(number|numbers|metric|metrics|z-?score|sd|lapse|lapses|systolic|diastolic|mean|means|show|summary|range|mmhg|score)\b/i.test(question)) {
    intents.add("numbers");
  }
  if (/\b(baseline|normal|band|window|calibrat|personal|in-flight|iss)\b/i.test(question)) {
    intents.add("baseline");
  }
  if (/\b(sleep|slept|nap|rest|tired|fatigue|hours?)\b/i.test(question)) {
    intents.add("sleep");
  }
  if (/\b(bp|blood\s*pressure|cuff|retest|recheck|hypertension|hypotension|stage\s*[12])\b/i.test(question)) {
    intents.add("bp");
  }
  if (/\b(routine|microbreak|wind-?down|relax|breathing|stretch|exercise)\b/i.test(question)) {
    intents.add("routine");
  }
  const qLower = question.toLowerCase();
  if (COACH_RED_FLAG_TERMS.some((term) => containsTerm(qLower, term)) || /\b(symptom|red\s*flag|alert)\b/i.test(question)) {
    intents.add("safety");
  }
  return intents;
}

/** Selects verified knowledge snippets matching the active card and user question. */
export function selectCoachSnippets(
  card: Card,
  question: string,
  allSnippets: readonly CoachKnowledgeSnippet[],
): CoachKnowledgeSnippet[] {
  const qLower = question.toLowerCase();
  const hasRedFlag = COACH_RED_FLAG_TERMS.some((term) => containsTerm(qLower, term));
  const hasUncoveredTopic = UNCOVERED_TOPIC_TERMS.some((term) => containsTerm(qLower, term));

  // Uncovered medical/external requests without red-flag emergency triggers must abstain.
  if (hasUncoveredTopic && !hasRedFlag) {
    return [];
  }

  const intents = classifyCoachIntents(question);
  const hasDomainCue = DOMAIN_CUE_TERMS.some((term) => containsTerm(qLower, term));
  if (!hasRedFlag && !hasDomainCue) {
    return [];
  }

  const scored: Array<{ snippet: CoachKnowledgeSnippet; score: number }> = [];
  for (const snippet of allSnippets) {
    const matchesRule =
      snippet.ruleIds.includes(card.ruleId) || snippet.ruleIds.includes("*");
    const keywordHits = snippet.keywords.filter((kw) => containsTerm(qLower, kw)).length;
    const intentHits = snippet.intents.filter((intent) => intents.has(intent)).length;

    let score = 0;
    if (matchesRule) {
      score += intentHits * 3 + keywordHits * 4;
      if (snippet.ruleIds.includes(card.ruleId) && (intentHits > 0 || keywordHits > 0)) {
        score += 2;
      }
    } else if (keywordHits >= 2) {
      // Cross-card verified lookup (e.g. asking about BP numbers on a reaction card)
      score += keywordHits * 3;
    }

    if (score > 0) {
      scored.push({ snippet, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.snippet.id.localeCompare(b.snippet.id));
  return scored.slice(0, 3).map((item) => item.snippet);
}

/** Deterministic follow-up suggestions shown in the Wireframe Screen 7 Coach panel. */
export function buildSuggestedQuestions(card: Card): string[] {
  if (card.ruleId.startsWith("BP-")) {
    return [
      "What do my blood pressure numbers mean?",
      "Is this serious?",
      "What if it gets worse?",
      "Should I tell Earth?",
    ];
  }
  return [
    "Why is my reaction slower?",
    "Is this serious?",
    "What if it gets worse?",
    "Should I tell Earth?",
  ];
}

function formatFactsSentence(card: Card): string {
  const f = card.facts;
  const parts: string[] = [];
  if (typeof f.zAbs === "number") parts.push(`${f.zAbs} SD from your personal normal`);
  if (typeof f.sleepHours === "number") parts.push(`${f.sleepHours} hours of sleep`);
  if (typeof f.lapses === "number") parts.push(`${f.lapses} lapses`);
  if (typeof f.days === "number") parts.push(`${f.days} days`);
  if (typeof f.systolic === "number" && typeof f.diastolic === "number") {
    parts.push(`average BP ${f.systolic}/${f.diastolic} mmHg`);
  }
  if (typeof f.retestMinutes === "number") {
    parts.push(`retest wait ${f.retestMinutes} minutes`);
  }
  return parts.length > 0 ? `Card facts (${card.ruleId}): ${parts.join(", ")}.` : "";
}

/**
 * Pure deterministic explanation builder grounded solely in the active Card
 * and retrieved verified snippets. Zero LLM calls, zero hallucinations.
 */
export function buildDeterministicCoachAnswer(ctx: CoachContext): CoachAnswer {
  const { card, question, linkedRoutine, sourceMap } = ctx;
  const suggestedQuestions = buildSuggestedQuestions(card);
  const banner = detectCoachRedFlag(question, card);
  const qLower = question.toLowerCase();
  const hasUncovered = UNCOVERED_TOPIC_TERMS.some((term) => containsTerm(qLower, term));

  if (banner && hasUncovered) {
    // Urgent safety symptoms combined with an uncovered drug/topic still elevate safety first without inventing drug advice.
    const safetyRef = sourceMap.get("aha-first-aid-2024");
    return {
      answer: `${COACH_URGENT_BANNER_LABEL} Open Emergency procedures right away, and do not wait for Earth. I cannot advise on medications outside verified mission medical cards.`,
      grounded: true,
      citations: safetyRef ? [safetyRef] : [],
      banner,
      suggestedQuestions,
    };
  }

  if (ctx.snippets.length === 0) {
    return {
      answer: COACH_NO_SOURCE_REPLY,
      grounded: false,
      citations: [],
      ...(banner ? { banner } : {}),
      suggestedQuestions,
    };
  }

  const intents = classifyCoachIntents(question);
  const segments: string[] = [];

  if (banner) {
    segments.push(
      `${COACH_URGENT_BANNER_LABEL} Stop precision work and open the Emergency guide immediately.`,
    );
  }

  if (intents.has("earth")) {
    segments.push(
      "On Mars transit, one-way light time is 3 to 22 minutes, so never wait for Earth if symptoms are urgent. You can preview and queue non-urgent entries for the flight surgeon in Send to Earth.",
    );
  }

  if (intents.has("seriousness")) {
    const levelDesc =
      card.severity === "urgent"
        ? "This is marked urgent (`alert crew now`)."
        : card.severity === "act"
          ? `This is an action-level flag (${card.status.label}), meaning safety-critical tasks that can wait should be postponed and a crewmate asked to double-check key steps.`
          : card.severity === "watch"
            ? "This is an early watch heads-up before reaching action thresholds."
            : "Current card status is informational or within your personal normal.";
    segments.push(levelDesc);
  }

  if (intents.has("worsening")) {
    segments.push(
      card.ruleId.startsWith("RT-")
        ? "If slow scores continue for 3 consecutive days (RT-PERSISTENT), crewpulse escalates priority and advises delaying critical work and checking blood pressure. If new symptoms appear, alert a crewmate immediately."
        : "If readings stay at or above 140/90 mmHg across 3 days (BP-SUSTAINED-HIGH), stay above 180/120 mmHg on retest, or pair with red-flag symptoms, alert a crewmate immediately.",
    );
  }

  if (intents.has("why") || intents.has("numbers") || intents.has("baseline") || intents.has("sleep") || intents.has("bp")) {
    segments.push(card.whatChanged);
    const factsLine = formatFactsSentence(card);
    if (factsLine && !intents.has("seriousness")) {
      segments.push(factsLine);
    }
  }

  if (intents.has("routine") && linkedRoutine) {
    segments.push(
      `Linked routine: "${linkedRoutine.title}" (${Math.round(linkedRoutine.durationSeconds / 60)} min) — ${linkedRoutine.summary}`,
    );
  } else if (intents.has("action") || segments.length === 0) {
    segments.push(`Next steps: ${card.whatToDo.join(" ")}`);
  }

  // Always ground explanation in top verified snippet evidence text.
  const leadSnippet = ctx.snippets[0];
  if (leadSnippet) {
    segments.push(leadSnippet.text);
  }

  const citationsMap = new Map<string, SourceRef>();
  for (const snippet of ctx.snippets) {
    const ref = sourceMap.get(snippet.sourceId);
    if (ref) citationsMap.set(ref.id, ref);
  }
  for (const cardSource of card.sources) {
    citationsMap.set(cardSource.id, cardSource);
  }

  return {
    answer: segments.join(" "),
    grounded: true,
    citations: [...citationsMap.values()],
    ...(banner ? { banner } : {}),
    suggestedQuestions,
  };
}

/**
 * Fallback card object used only when no check-in or BP measurement has been
 * recorded yet today and the user opens the Coach tab first.
 */
export function buildEmptyDayFallbackCard(sources: readonly SourceRef[]): Card {
  const preferredIds = ["basner-2011-pvtb", "cognition-iss-pmc11614644", "cdc-bp-measure"];
  const picked = preferredIds
    .map((id) => sources.find((s) => s.id === id))
    .filter((s): s is SourceRef => Boolean(s));
  return {
    id: "baseline-overview",
    ruleId: "RT-OK",
    severity: "info",
    status: { level: "info", label: "No check-in today yet", iconKey: "info" },
    title: "Ready for today's check-in",
    whatChanged: "No reaction check-in or blood pressure measurement has been recorded today yet.",
    whyItMatters:
      "The 3-minute PVT-B tracks vigilant attention against your own personal normal band, and CDC resting steps keep blood pressure checks consistent.",
    whatToDo: [
      "Run today's 3-minute PVT-B check-in when settled.",
      "Take a guided blood pressure measurement if due.",
    ],
    facts: {},
    sources: picked.length > 0 ? picked : sources.slice(0, 1),
    disclaimer: "Decision support, not a diagnosis.",
  };
}
