import { readFileSync } from "node:fs";
import path from "node:path";
import { validateCardCatalog, type CardCatalog } from "../core";
import {
  BpGuide,
  BpGuideFile,
  CardTemplateFile,
  CoachKnowledgeFile,
  EnvironmentFile,
  HazardFile,
  Procedure,
  ProcedureFile,
  Routine,
  RoutineFile,
  SourceFile,
  type CoachKnowledgeSnippet,
  type Environment,
  type Hazard,
  type SourceRef,
} from "../schemas";

const SELF_PROCEDURE_IDS = [
  "bleeding",
  "burn",
  "eye",
  "allergic-reaction",
  "near-fainting",
] as const;

const CREWMATE_PROCEDURE_IDS = [
  "crewmate-collapse",
  "crewmate-cpr",
  "crewmate-seizure",
  "crewmate-low-blood-sugar",
] as const;

const ALL_PROCEDURE_IDS = [...SELF_PROCEDURE_IDS, ...CREWMATE_PROCEDURE_IDS] as const;

const ROUTINE_IDS = [
  "hands-microbreak",
  "tension-winddown",
  "bp-quiet-rest",
] as const;

export interface LoadedContent {
  catalog: CardCatalog;
  sourceMap: ReadonlyMap<string, SourceRef>;
  bpGuide: BpGuide;
  procedures: Procedure[];
  proceduresVersion: number;
  routines: Routine[];
  routinesVersion: number;
  coachSnippets: CoachKnowledgeSnippet[];
  /** E03 */
  hazards: Hazard[];
  /** E06 */
  environments: Environment[];
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8")) as unknown;
}

function resolveSources(
  sourceIds: readonly string[],
  byId: ReadonlyMap<string, SourceRef>,
  context: string,
): SourceRef[] {
  return sourceIds.map((id) => {
    const ref = byId.get(id);
    if (!ref) {
      throw new Error(`Content "${context}" references unknown source "${id}".`);
    }
    return ref;
  });
}

/** Loads and validates verified cards, BP guide, sources, emergency procedures, routines, and coach snippets. */
export function loadContentBundle(contentDir: string): LoadedContent {
  const { sources } = SourceFile.parse(readJson(path.join(contentDir, "sources.json")));
  const sourceMap = new Map<string, SourceRef>(sources.map((s) => [s.id, s]));

  const { hazards } = HazardFile.parse(readJson(path.join(contentDir, "hazards.json")));
  const { templates } = CardTemplateFile.parse(readJson(path.join(contentDir, "cards.json")));
  const catalog: CardCatalog = { templates, sources, hazards: hazards.map((h) => ({ id: h.id, name: h.name })) };
  validateCardCatalog(catalog);

  const guideRaw = BpGuideFile.parse(readJson(path.join(contentDir, "bp-guide.json")));
  const bpGuide = BpGuide.parse({
    version: guideRaw.version,
    steps: guideRaw.steps,
    severeSymptoms: guideRaw.severeSymptoms,
    lowSymptoms: guideRaw.lowSymptoms,
    disclaimer: guideRaw.disclaimer,
    sources: resolveSources(guideRaw.sourceIds, sourceMap, "bp-guide.json"),
  });

  const procedures: Procedure[] = ALL_PROCEDURE_IDS.map((id) => {
    const raw = ProcedureFile.parse(
      readJson(path.join(contentDir, "emergency", `${id}.json`)),
    );
    return Procedure.parse({
      id: raw.id,
      version: raw.version,
      for: raw.for,
      title: raw.title,
      whenToUse: raw.whenToUse,
      steps: raw.steps,
      redFlags: raw.redFlags,
      escalation: raw.escalation,
      disclaimer: raw.disclaimer,
      sources: resolveSources(raw.sourceIds, sourceMap, `emergency/${id}.json`),
    });
  });

  const routines: Routine[] = ROUTINE_IDS.map((id) => {
    const raw = RoutineFile.parse(readJson(path.join(contentDir, "routines", `${id}.json`)));
    return Routine.parse({
      id: raw.id,
      version: raw.version,
      category: raw.category,
      title: raw.title,
      summary: raw.summary,
      durationSeconds: raw.durationSeconds,
      steps: raw.steps,
      disclaimer: raw.disclaimer,
      sources: resolveSources(raw.sourceIds, sourceMap, `routines/${id}.json`),
    });
  });

  // Verify every card link targets an existing procedure or routine.
  const procedureIds = new Set(procedures.map((p) => p.id));
  const routineIds = new Set(routines.map((r) => r.id));
  for (const tpl of templates) {
    if (tpl.links?.emergencyProcedureId && !procedureIds.has(tpl.links.emergencyProcedureId)) {
      throw new Error(
        `Card template "${tpl.id}" links missing procedure "${tpl.links.emergencyProcedureId}".`,
      );
    }
    if (tpl.links?.routineId && !routineIds.has(tpl.links.routineId)) {
      throw new Error(
        `Card template "${tpl.id}" links missing routine "${tpl.links.routineId}".`,
      );
    }
  }

  const coachRaw = CoachKnowledgeFile.parse(
    readJson(path.join(contentDir, "coach-knowledge.json")),
  );
  for (const snippet of coachRaw.snippets) {
    if (!sourceMap.has(snippet.sourceId)) {
      throw new Error(
        `Coach snippet "${snippet.id}" references unknown source "${snippet.sourceId}".`,
      );
    }
  }

  const proceduresVersion = procedures.reduce((max, p) => Math.max(max, p.version), 1);
  const routinesVersion = routines.reduce((max, r) => Math.max(max, r.version), 1);

  const { environments } = EnvironmentFile.parse(readJson(path.join(contentDir, "environments.json")));
  for (const env of environments) resolveSources(env.sourceIds, sourceMap, `environments.json ${env.id}`);

  return {
    catalog,
    sourceMap,
    bpGuide,
    procedures,
    proceduresVersion,
    routines,
    routinesVersion,
    coachSnippets: coachRaw.snippets,
    hazards,
    environments,
  };
}
