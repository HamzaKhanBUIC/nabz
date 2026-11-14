import { readFileSync } from "node:fs";
import path from "node:path";
import { validateCardCatalog, type CardCatalog } from "../core";
import {
  BpGuide,
  BpGuideFile,
  CardTemplateFile,
  Procedure,
  ProcedureFile,
  SourceFile,
  type SourceRef,
} from "../schemas";

const SELF_PROCEDURE_IDS = [
  "bleeding",
  "burn",
  "eye",
  "allergic-reaction",
  "near-fainting",
] as const;

export interface LoadedContent {
  catalog: CardCatalog;
  bpGuide: BpGuide;
  procedures: Procedure[];
  proceduresVersion: number;
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8")) as unknown;
}

function resolveSources(sourceIds: readonly string[], byId: ReadonlyMap<string, SourceRef>, context: string): SourceRef[] {
  return sourceIds.map((id) => {
    const ref = byId.get(id);
    if (!ref) {
      throw new Error(`Content "${context}" references unknown source "${id}".`);
    }
    return ref;
  });
}

/** Loads and validates verified cards, BP guide, sources, and emergency procedures. */
export function loadContentBundle(contentDir: string): LoadedContent {
  const { sources } = SourceFile.parse(readJson(path.join(contentDir, "sources.json")));
  const sourceMap = new Map<string, SourceRef>(sources.map((s) => [s.id, s]));

  const { templates } = CardTemplateFile.parse(readJson(path.join(contentDir, "cards.json")));
  const catalog: CardCatalog = { templates, sources };
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

  const procedures: Procedure[] = SELF_PROCEDURE_IDS.map((id) => {
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

  const proceduresVersion = procedures.reduce((max, p) => Math.max(max, p.version), 1);

  return {
    catalog,
    bpGuide,
    procedures,
    proceduresVersion,
  };
}
