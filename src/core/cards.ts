import type {
  BpCategory,
  Card,
  CardTemplate,
  Facts,
  Level,
  LowSymptom,
  SevereSymptom,
  SourceRef,
  Status,
  Zone,
} from "../schemas";
import {
  BP_RETEST_MINUTES,
  BP_SUSTAINED_DAYS,
  BP_Z_WATCH,
  CARD_DISCLAIMER,
  PERSISTENT_ACT_DAYS,
  SHORT_SLEEP_HOURS,
} from "./constants";

export interface CardCatalog {
  templates: readonly CardTemplate[];
  sources: readonly SourceRef[];
}

export interface ReactionRuleInput {
  kind: "reaction";
  qcFlags: readonly string[];
  zone: Zone;
  z: number | null;
  lapses: number;
  sleepHours: number | null;
  consecutiveActDays: number;
}

export interface BpRuleInput {
  kind: "bp";
  systolic: number;
  diastolic: number;
  category: BpCategory;
  severeSymptoms: readonly SevereSymptom[];
  lowSymptoms: readonly LowSymptom[];
  isRetest: boolean;
  sustainedHigh: boolean;
  sustainedDays?: number;
  z: number | null;
}

export type CardRuleInput = ReactionRuleInput | BpRuleInput;

interface RuleMatch {
  ruleId: string;
  templateId: string;
  severity: Level;
  status: Status;
  facts: Facts;
}

const UNFILLED_PLACEHOLDER_RE = /\{([A-Za-z0-9_]+)\}/g;

const LEVEL_RANK: Record<Level, number> = {
  in_zone: 0,
  info: 1,
  watch: 2,
  act: 3,
  urgent: 4,
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function indexCatalog(catalog: CardCatalog): {
  templates: Map<string, CardTemplate>;
  sources: Map<string, SourceRef>;
} {
  const templates = new Map<string, CardTemplate>();
  for (const template of catalog.templates) {
    if (templates.has(template.id)) {
      throw new Error(`Duplicate card template id: ${template.id}`);
    }
    templates.set(template.id, template);
  }

  const sources = new Map<string, SourceRef>();
  for (const source of catalog.sources) {
    if (sources.has(source.id)) {
      throw new Error(`Duplicate source id: ${source.id}`);
    }
    sources.set(source.id, source);
  }

  return { templates, sources };
}

/**
 * Verifies at startup or in tests that every template has valid source refs.
 * Throws if any template references a missing source ID.
 */
export function validateCardCatalog(catalog: CardCatalog): void {
  const { sources } = indexCatalog(catalog);
  for (const template of catalog.templates) {
    for (const sourceId of template.sourceIds) {
      if (!sources.has(sourceId)) {
        throw new Error(
          `Card template "${template.id}" references missing source "${sourceId}".`,
        );
      }
    }
  }
}

function interpolate(text: string, facts: Facts, templateId: string): string {
  return text.replace(UNFILLED_PLACEHOLDER_RE, (_full, key: string) => {
    const val = facts[key];
    if (val === undefined) {
      throw new Error(
        `Missing fact for placeholder "{${key}}" in card template "${templateId}".`,
      );
    }
    return String(val);
  });
}

function materializeCard(match: RuleMatch, catalog: CardCatalog): Card {
  const { templates, sources } = indexCatalog(catalog);
  const template = templates.get(match.templateId);
  if (!template) {
    throw new Error(`Missing card template: "${match.templateId}".`);
  }

  const resolvedSources: SourceRef[] = template.sourceIds.map((sourceId) => {
    const ref = sources.get(sourceId);
    if (!ref) {
      throw new Error(
        `Card template "${template.id}" references missing source "${sourceId}".`,
      );
    }
    return ref;
  });

  const title = interpolate(template.title, match.facts, template.id);
  const whatChanged = interpolate(template.whatChanged, match.facts, template.id);
  const whyItMatters = interpolate(template.whyItMatters, match.facts, template.id);
  const whatToDo = template.whatToDo.map((step) =>
    interpolate(step, match.facts, template.id),
  );

  return {
    id: template.id,
    ruleId: match.ruleId,
    severity: match.severity,
    status: match.status,
    title,
    whatChanged,
    whyItMatters,
    whatToDo,
    facts: { ...match.facts },
    sources: resolvedSources,
    disclaimer: CARD_DISCLAIMER,
    ...(template.links ? { links: { ...template.links } } : {}),
  };
}

function matchReactionRule(input: ReactionRuleInput): RuleMatch {
  const zAbs = input.z === null ? 0 : round1(Math.abs(input.z));

  if (input.qcFlags.length > 0) {
    return {
      ruleId: "RT-RETAKE",
      templateId: "checkin-retake",
      severity: "info",
      status: { level: "info", label: "Not scored", iconKey: "info" },
      facts: { qcFlagsCount: input.qcFlags.length },
    };
  }

  if (input.zone === "building") {
    return {
      ruleId: "RT-BUILDING",
      templateId: "baseline-building",
      severity: "info",
      status: { level: "info", label: "Learning your normal", iconKey: "hourglass" },
      facts: { lapses: input.lapses },
    };
  }

  if (input.zone === "act" && input.consecutiveActDays >= PERSISTENT_ACT_DAYS) {
    return {
      ruleId: "RT-PERSISTENT",
      templateId: "reaction-slow-persistent",
      severity: "act",
      status: { level: "act", label: "Below your normal", iconKey: "alert" },
      facts: {
        days: input.consecutiveActDays,
        zAbs,
        lapses: input.lapses,
      },
    };
  }

  if (
    input.zone === "act" &&
    input.sleepHours !== null &&
    input.sleepHours <= SHORT_SLEEP_HOURS
  ) {
    return {
      ruleId: "RT-SHORT-SLEEP",
      templateId: "reaction-slow-short-sleep",
      severity: "act",
      status: { level: "act", label: "Below your normal", iconKey: "alert" },
      facts: {
        zAbs,
        sleepHours: input.sleepHours,
        lapses: input.lapses,
      },
    };
  }

  if (input.zone === "act") {
    return {
      ruleId: "RT-SLOW",
      templateId: "reaction-slow",
      severity: "act",
      status: { level: "act", label: "Below your normal", iconKey: "alert" },
      facts: { zAbs, lapses: input.lapses },
    };
  }

  if (input.zone === "watch") {
    return {
      ruleId: "RT-WATCH",
      templateId: "reaction-watch",
      severity: "watch",
      status: { level: "watch", label: "Slightly below your normal", iconKey: "eye" },
      facts: { zAbs, lapses: input.lapses },
    };
  }

  return {
    ruleId: "RT-OK",
    templateId: "all-normal",
    severity: "in_zone",
    status: { level: "in_zone", label: "Within your normal", iconKey: "check" },
    facts: { lapses: input.lapses },
  };
}

function matchBpRule(input: BpRuleInput): RuleMatch {
  const { systolic, diastolic, category, severeSymptoms, lowSymptoms, isRetest } = input;
  const baseFacts: Facts = { systolic, diastolic };

  if (category === "severe" && severeSymptoms.length > 0) {
    return {
      ruleId: "BP-SEVERE-SYMPTOMS",
      templateId: "bp-severe-symptoms",
      severity: "urgent",
      status: { level: "urgent", label: "Alert crew now", iconKey: "siren" },
      facts: baseFacts,
    };
  }

  if (category === "low" && lowSymptoms.length > 0) {
    return {
      ruleId: "BP-LOW-SYMPTOMS",
      templateId: "bp-low-symptoms",
      severity: "urgent",
      status: { level: "urgent", label: "Alert crew now", iconKey: "siren" },
      facts: baseFacts,
    };
  }

  if (category === "severe" && isRetest) {
    return {
      ruleId: "BP-SEVERE-CONFIRMED",
      templateId: "bp-severe-confirmed",
      severity: "act",
      status: { level: "act", label: "Alert crew now", iconKey: "alert" },
      facts: baseFacts,
    };
  }

  if (category === "severe" && !isRetest) {
    return {
      ruleId: "BP-SEVERE-RETEST",
      templateId: "bp-severe-retest",
      severity: "act",
      status: { level: "act", label: "Check again", iconKey: "alert" },
      facts: { ...baseFacts, retestMinutes: BP_RETEST_MINUTES },
    };
  }

  if (input.sustainedHigh) {
    return {
      ruleId: "BP-SUSTAINED-HIGH",
      templateId: "bp-sustained-high",
      severity: "act",
      status: { level: "act", label: "Sustained high", iconKey: "alert" },
      facts: {
        ...baseFacts,
        days: input.sustainedDays ?? BP_SUSTAINED_DAYS,
      },
    };
  }

  if (category === "stage2") {
    return {
      ruleId: "BP-STAGE2",
      templateId: "bp-high",
      severity: "watch",
      status: { level: "watch", label: "Stage 2 range", iconKey: "eye" },
      facts: baseFacts,
    };
  }

  if (category === "low") {
    return {
      ruleId: "BP-LOW",
      templateId: "bp-low",
      severity: "watch",
      status: { level: "watch", label: "Below 90/60", iconKey: "eye" },
      facts: baseFacts,
    };
  }

  if (input.z !== null && Math.abs(input.z) >= BP_Z_WATCH) {
    return {
      ruleId: "BP-OFF-NORMAL",
      templateId: "bp-off-normal",
      severity: "watch",
      status: { level: "watch", label: "Different from your normal", iconKey: "eye" },
      facts: {
        ...baseFacts,
        zAbs: round1(Math.abs(input.z)),
      },
    };
  }

  if (category === "elevated" || category === "stage1") {
    return {
      ruleId: "BP-ABOVE-IDEAL",
      templateId: "bp-above-ideal",
      severity: "info",
      status: { level: "info", label: "Above ideal range", iconKey: "info" },
      facts: baseFacts,
    };
  }

  return {
    ruleId: "BP-OK",
    templateId: "bp-normal",
    severity: "in_zone",
    status: { level: "in_zone", label: "Within normal range", iconKey: "check" },
    facts: baseFacts,
  };
}

/** Selects and populates the reaction check-in card for the given rule inputs. */
export function selectReactionCard(input: ReactionRuleInput, catalog: CardCatalog): Card {
  return materializeCard(matchReactionRule(input), catalog);
}

/** Selects and populates the blood-pressure action card for the given rule inputs. */
export function selectBpCard(input: BpRuleInput, catalog: CardCatalog): Card {
  return materializeCard(matchBpRule(input), catalog);
}

/** Selects one action card from either reaction or BP rule inputs. */
export function selectCard(input: CardRuleInput, catalog: CardCatalog): Card {
  return input.kind === "reaction"
    ? selectReactionCard(input, catalog)
    : selectBpCard(input, catalog);
}

/** Returns the highest-severity card (urgent > act > watch > info > in_zone), or null. */
export function pickMostSevereCard(cards: readonly Card[]): Card | null {
  let best: Card | null = null;
  for (const card of cards) {
    if (!best || LEVEL_RANK[card.severity] > LEVEL_RANK[best.severity]) {
      best = card;
    }
  }
  return best;
}
