import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Card, CardTemplateFile, SourceFile } from "../../src/schemas";
import {
  pickMostSevereCard,
  selectCard,
  validateCardCatalog,
  type BpRuleInput,
  type CardCatalog,
  type ReactionRuleInput,
} from "../../src/core/cards";

function loadCatalog(): CardCatalog {
  const root = process.cwd();
  const cardsRaw = JSON.parse(readFileSync(path.join(root, "content/cards.json"), "utf8"));
  const sourcesRaw = JSON.parse(readFileSync(path.join(root, "content/sources.json"), "utf8"));
  const { templates } = CardTemplateFile.parse(cardsRaw);
  const { sources } = SourceFile.parse(sourcesRaw);
  return { templates, sources };
}

function assertValidRenderedCard(card: Card): void {
  const parsed = Card.parse(card);
  expect(parsed.disclaimer).toBe("Decision support, not a diagnosis.");
  expect(parsed.sources.length).toBeGreaterThanOrEqual(1);
  const allText = [parsed.title, parsed.whatChanged, parsed.whyItMatters, ...parsed.whatToDo].join(" ");
  expect(allText).not.toMatch(/\{[A-Za-z0-9_]+\}/);
}

const baseReaction: ReactionRuleInput = {
  kind: "reaction",
  qcFlags: [],
  zone: "in_zone",
  z: -0.2,
  lapses: 1,
  sleepHours: 7.2,
  consecutiveActDays: 0,
};

const baseBp: BpRuleInput = {
  kind: "bp",
  systolic: 116,
  diastolic: 74,
  category: "normal",
  severeSymptoms: [],
  lowSymptoms: [],
  isRetest: false,
  sustainedHigh: false,
  z: 0.1,
};

describe("F05 priority rule table and action cards (M3)", () => {
  const catalog = loadCatalog();

  it("validates the verified content catalog against sources", () => {
    expect(() => validateCardCatalog(catalog)).not.toThrow();

    expect(() =>
      validateCardCatalog({
        templates: [
          {
            ...catalog.templates[0]!,
            sourceIds: ["non-existent-source"],
          },
        ],
        sources: catalog.sources,
      }),
    ).toThrow(/missing source/i);
  });

  it("evaluates all 7 reaction rules in exact priority and boundary order", () => {
    // 1. RT-RETAKE beats everything
    const retake = selectCard(
      {
        ...baseReaction,
        qcFlags: ["too_few_stimuli"],
        zone: "act",
        sleepHours: 4.5,
        consecutiveActDays: 4,
      },
      catalog,
    );
    expect(retake.ruleId).toBe("RT-RETAKE");
    expect(retake.id).toBe("checkin-retake");
    expect(retake.severity).toBe("info");
    assertValidRenderedCard(retake);

    // 2. RT-BUILDING
    const building = selectCard({ ...baseReaction, zone: "building", z: null }, catalog);
    expect(building.ruleId).toBe("RT-BUILDING");
    expect(building.id).toBe("baseline-building");
    assertValidRenderedCard(building);

    // 3. RT-PERSISTENT at >= 3 days; 2 days falls through to RT-SHORT-SLEEP or RT-SLOW
    const persistent = selectCard(
      { ...baseReaction, zone: "act", z: -1.9, lapses: 8, sleepHours: 5.0, consecutiveActDays: 3 },
      catalog,
    );
    expect(persistent.ruleId).toBe("RT-PERSISTENT");
    expect(persistent.id).toBe("reaction-slow-persistent");
    expect(persistent.facts).toEqual({ days: 3, zAbs: 1.9, lapses: 8 });
    assertValidRenderedCard(persistent);

    // 4. RT-SHORT-SLEEP at sleepHours <= 6.0 (exact boundary)
    const shortSleep60 = selectCard(
      { ...baseReaction, zone: "act", z: -1.88, lapses: 9, sleepHours: 6.0, consecutiveActDays: 2 },
      catalog,
    );
    expect(shortSleep60.ruleId).toBe("RT-SHORT-SLEEP");
    expect(shortSleep60.id).toBe("reaction-slow-short-sleep");
    expect(shortSleep60.facts).toEqual({ zAbs: 1.9, sleepHours: 6, lapses: 9 });
    assertValidRenderedCard(shortSleep60);

    // 5. RT-SLOW when sleepHours is 6.1 or null
    const slowRested = selectCard(
      { ...baseReaction, zone: "act", z: -1.7, lapses: 5, sleepHours: 6.1, consecutiveActDays: 1 },
      catalog,
    );
    expect(slowRested.ruleId).toBe("RT-SLOW");
    expect(slowRested.id).toBe("reaction-slow");
    assertValidRenderedCard(slowRested);

    const slowNullSleep = selectCard(
      { ...baseReaction, zone: "act", z: -1.6, lapses: 4, sleepHours: null, consecutiveActDays: 1 },
      catalog,
    );
    expect(slowNullSleep.ruleId).toBe("RT-SLOW");
    assertValidRenderedCard(slowNullSleep);

    // 6. RT-WATCH
    const watch = selectCard(
      { ...baseReaction, zone: "watch", z: -1.25, lapses: 4, sleepHours: 5.5 },
      catalog,
    );
    expect(watch.ruleId).toBe("RT-WATCH");
    expect(watch.id).toBe("reaction-watch");
    assertValidRenderedCard(watch);

    // 7. RT-OK
    const ok = selectCard(baseReaction, catalog);
    expect(ok.ruleId).toBe("RT-OK");
    expect(ok.id).toBe("all-normal");
    expect(ok.severity).toBe("in_zone");
    assertValidRenderedCard(ok);
  });

  it("evaluates all 10 blood pressure rules in exact priority order", () => {
    // 1. BP-SEVERE-SYMPTOMS beats retest and sustainedHigh
    const sevSym = selectCard(
      {
        ...baseBp,
        systolic: 186,
        diastolic: 122,
        category: "severe",
        severeSymptoms: ["chest-pain"],
        isRetest: true,
        sustainedHigh: true,
      },
      catalog,
    );
    expect(sevSym.ruleId).toBe("BP-SEVERE-SYMPTOMS");
    expect(sevSym.severity).toBe("urgent");
    assertValidRenderedCard(sevSym);

    // 2. BP-LOW-SYMPTOMS
    const lowSym = selectCard(
      {
        ...baseBp,
        systolic: 86,
        diastolic: 56,
        category: "low",
        lowSymptoms: ["fainting"],
      },
      catalog,
    );
    expect(lowSym.ruleId).toBe("BP-LOW-SYMPTOMS");
    expect(lowSym.severity).toBe("urgent");
    expect(lowSym.links?.emergencyProcedureId).toBe("near-fainting");
    assertValidRenderedCard(lowSym);

    // 3. BP-SEVERE-CONFIRMED
    const sevConfirmed = selectCard(
      { ...baseBp, systolic: 184, diastolic: 118, category: "severe", isRetest: true },
      catalog,
    );
    expect(sevConfirmed.ruleId).toBe("BP-SEVERE-CONFIRMED");
    expect(sevConfirmed.severity).toBe("act");
    assertValidRenderedCard(sevConfirmed);

    // 4. BP-SEVERE-RETEST
    const sevRetest = selectCard(
      {
        ...baseBp,
        systolic: 185,
        diastolic: 120,
        category: "severe",
        isRetest: false,
        sustainedHigh: true,
      },
      catalog,
    );
    expect(sevRetest.ruleId).toBe("BP-SEVERE-RETEST");
    expect(sevRetest.status).toEqual({ level: "act", label: "Check again", iconKey: "alert" });
    expect(sevRetest.facts).toEqual({ systolic: 185, diastolic: 120, retestMinutes: 5 });
    assertValidRenderedCard(sevRetest);

    // 5. BP-SUSTAINED-HIGH beats BP-STAGE2 and BP-OFF-NORMAL
    const sustained = selectCard(
      { ...baseBp, systolic: 146, diastolic: 92, category: "stage2", sustainedHigh: true, z: 4.0 },
      catalog,
    );
    expect(sustained.ruleId).toBe("BP-SUSTAINED-HIGH");
    expect(sustained.severity).toBe("act");
    expect(sustained.facts).toEqual({ systolic: 146, diastolic: 92, days: 3 });
    assertValidRenderedCard(sustained);

    // 6. BP-STAGE2
    const stage2 = selectCard(
      { ...baseBp, systolic: 142, diastolic: 84, category: "stage2", z: 3.1 },
      catalog,
    );
    expect(stage2.ruleId).toBe("BP-STAGE2");
    expect(stage2.id).toBe("bp-high");
    expect(stage2.severity).toBe("watch");
    assertValidRenderedCard(stage2);

    // 7. BP-LOW (no symptoms)
    const low = selectCard(
      { ...baseBp, systolic: 88, diastolic: 58, category: "low", z: -3.2 },
      catalog,
    );
    expect(low.ruleId).toBe("BP-LOW");
    expect(low.severity).toBe("watch");
    assertValidRenderedCard(low);

    // 8. BP-OFF-NORMAL (|z| >= 1.5 even when category is normal/elevated)
    const offNormal = selectCard(
      { ...baseBp, systolic: 118, diastolic: 74, category: "normal", z: -1.5 },
      catalog,
    );
    expect(offNormal.ruleId).toBe("BP-OFF-NORMAL");
    expect(offNormal.facts.zAbs).toBe(1.5);
    assertValidRenderedCard(offNormal);

    // |z| = 1.49 with normal category does not fire BP-OFF-NORMAL
    const notOffNormal = selectCard(
      { ...baseBp, systolic: 118, diastolic: 74, category: "normal", z: 1.49 },
      catalog,
    );
    expect(notOffNormal.ruleId).toBe("BP-OK");

    // 9. BP-ABOVE-IDEAL (elevated or stage1 when |z| < 1.5)
    const elevated = selectCard(
      { ...baseBp, systolic: 124, diastolic: 76, category: "elevated", z: 1.2 },
      catalog,
    );
    expect(elevated.ruleId).toBe("BP-ABOVE-IDEAL");
    expect(elevated.severity).toBe("info");
    assertValidRenderedCard(elevated);

    const stage1 = selectCard(
      { ...baseBp, systolic: 132, diastolic: 82, category: "stage1", z: null },
      catalog,
    );
    expect(stage1.ruleId).toBe("BP-ABOVE-IDEAL");
    assertValidRenderedCard(stage1);

    // 10. BP-OK
    const bpOk = selectCard(baseBp, catalog);
    expect(bpOk.ruleId).toBe("BP-OK");
    expect(bpOk.severity).toBe("in_zone");
    assertValidRenderedCard(bpOk);

    // pickMostSevereCard ranks urgent > act > watch > info > in_zone
    expect(pickMostSevereCard([])).toBeNull();
    expect(pickMostSevereCard([bpOk, stage2, sevRetest, sevSym])?.ruleId).toBe("BP-SEVERE-SYMPTOMS");
    expect(pickMostSevereCard([bpOk, elevated, stage2])?.ruleId).toBe("BP-STAGE2");
  });

  it("throws clearly on missing template or unfilled placeholder", () => {
    expect(() =>
      selectCard(baseReaction, { templates: [], sources: catalog.sources }),
    ).toThrow(/missing card template/i);

    const brokenTemplates = catalog.templates.map((t) =>
      t.id === "all-normal" ? { ...t, whatChanged: "Missing {unknownKey} placeholder." } : t,
    );
    expect(() =>
      selectCard(baseReaction, { templates: brokenTemplates, sources: catalog.sources }),
    ).toThrow(/unknownKey/);
  });
});
