import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BpGuideFile,
  CARD_PLACEHOLDERS,
  CardTemplateFile,
  DISCLAIMER,
  ProcedureFile,
  SourceFile,
} from "../../src/schemas";

const CONTENT_DIR = resolve(process.cwd(), "content");
const readJson = (relPath: string): unknown => JSON.parse(readFileSync(resolve(CONTENT_DIR, relPath), "utf8"));

const EMERGENCY_IDS = ["bleeding", "burn", "eye", "allergic-reaction", "near-fainting"] as const;

const EXPECTED_CARD_IDS = [
  "checkin-retake",
  "baseline-building",
  "reaction-slow-persistent",
  "reaction-slow-short-sleep",
  "reaction-slow",
  "reaction-watch",
  "all-normal",
  "bp-severe-symptoms",
  "bp-low-symptoms",
  "bp-severe-confirmed",
  "bp-severe-retest",
  "bp-sustained-high",
  "bp-high",
  "bp-low",
  "bp-off-normal",
  "bp-above-ideal",
  "bp-normal",
] as const;

describe("F07 verified content JSON files", () => {
  it("parses sources.json and contains all required verified source IDs", () => {
    const sources = SourceFile.parse(readJson("sources.json"));
    const ids = new Set(sources.sources.map((s) => s.id));
    for (const required of [
      "aha-first-aid-2024",
      "basner-2011-pvtb",
      "cognition-iss-pmc11614644",
      "jones-2022-iss-sleep",
      "aha-acc-2025-bp",
      "cdc-bp-measure",
      "nhlbi-low-bp",
      "norsk-2015",
      "ochmo-std-100-1a",
    ]) {
      expect(ids.has(required)).toBe(true);
    }
  });

  it("parses all 5 emergency procedures, enforces CHECKS.md wording, and limits step length <= 20 words", () => {
    const sources = SourceFile.parse(readJson("sources.json"));
    const sourceIds = new Set(sources.sources.map((s) => s.id));

    const seenIds = new Set<string>();
    const procedures = EMERGENCY_IDS.map((id) => {
      const parsed = ProcedureFile.parse(readJson(`emergency/${id}.json`));
      expect(parsed.id).toBe(id);
      expect(parsed.for).toBe("self");
      expect(parsed.disclaimer).toBe(DISCLAIMER);
      expect(parsed.redFlags.length).toBeGreaterThan(0);
      expect(parsed.escalation.text).toBe("Red flag or getting worse? Alert a crewmate now. Do not wait for Earth.");
      for (const sid of parsed.sourceIds) {
        expect(sourceIds.has(sid)).toBe(true);
      }
      for (const step of parsed.steps) {
        const words = step.text.trim().split(/\s+/);
        expect(words.length).toBeLessThanOrEqual(20);
      }
      seenIds.add(parsed.id);
      return parsed;
    });

    expect(seenIds.size).toBe(5);

    const byId = Object.fromEntries(procedures.map((p) => [p.id, JSON.stringify(p)]));

    // eye: 15 minutes (never 20 min)
    expect(byId.eye).toContain("15 minutes");
    expect(byId.eye).not.toMatch(/20\s*min/i);

    // bleeding: exact tourniquet sentence (never 2 in)
    expect(byId.bleeding).toContain("Apply tourniquet above the wound, not on a joint. Tighten until bleeding stops.");
    expect(byId.bleeding).not.toMatch(/\b2\s*in\b/i);

    // burn: 5 to 20 minutes and no ice
    expect(byId.burn).toContain("5 to 20 minutes");
    expect(byId.burn?.toLowerCase()).toContain("ice");
  });

  it("parses bp-guide.json and verifies CDC/CHECKS steps and sourceIds", () => {
    const sources = SourceFile.parse(readJson("sources.json"));
    const sourceIds = new Set(sources.sources.map((s) => s.id));
    const guide = BpGuideFile.parse(readJson("bp-guide.json"));

    expect(guide.steps).toHaveLength(8);
    expect(guide.steps.find((s) => s.id === "anchor")?.adaptation).toBe(true);
    expect(guide.steps.find((s) => s.id === "rest")?.timerSeconds).toBe(300);
    expect(guide.steps.find((s) => s.id === "reading-2")?.timerSeconds).toBe(60);
    expect(guide.severeSymptoms).toHaveLength(6);
    expect(guide.lowSymptoms).toHaveLength(6);
    expect(guide.disclaimer).toBe(DISCLAIMER);
    for (const sid of guide.sourceIds) {
      expect(sourceIds.has(sid)).toBe(true);
    }
  });

  it("parses cards.json with all 17 templates, valid placeholders, valid sourceIds, and CHECKS retest wording", () => {
    const sources = SourceFile.parse(readJson("sources.json"));
    const sourceIds = new Set(sources.sources.map((s) => s.id));
    const cardsFile = CardTemplateFile.parse(readJson("cards.json"));

    const ids = cardsFile.templates.map((t) => t.id);
    expect(new Set(ids).size).toBe(17);
    for (const expected of EXPECTED_CARD_IDS) {
      expect(ids).toContain(expected);
    }

    const allowedPlaceholders = new Set<string>(CARD_PLACEHOLDERS);
    for (const tpl of cardsFile.templates) {
      expect(tpl.whatToDo.length).toBeGreaterThan(0);
      for (const sid of tpl.sourceIds) {
        expect(sourceIds.has(sid)).toBe(true);
      }
      const allText = [tpl.title, tpl.whatChanged, tpl.whyItMatters, ...tpl.whatToDo].join("\n");
      const matches = allText.matchAll(/\{([^}]+)\}/g);
      for (const m of matches) {
        expect(allowedPlaceholders.has(m[1]!)).toBe(true);
      }
    }

    const retestCard = cardsFile.templates.find((t) => t.id === "bp-severe-retest")!;
    const retestJson = JSON.stringify(retestCard);
    expect(retestJson).toContain("about 5 minutes");
    expect(retestJson).not.toMatch(/\b1\s*minute\b/i);
  });
});
