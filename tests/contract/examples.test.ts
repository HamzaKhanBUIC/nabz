import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ENDPOINTS, ERROR_EXAMPLES, ErrorBody } from "../../src/schemas";
import { renderContractJson } from "../../src/schemas/export";

const EXAMPLES = new URL("../../contract/examples/", import.meta.url);
const read = (name: string): unknown => JSON.parse(readFileSync(new URL(name, EXAMPLES), "utf8"));
const normalise = (s: string): string => s.replace(/\r\n/g, "\n");

describe("contract examples match the schemas", () => {
  for (const e of ENDPOINTS) {
    it(`${e.method} ${e.path}: response example parses`, () => {
      const parsed = e.response.safeParse(read(e.examples.response));
      expect(parsed.error?.issues ?? []).toEqual([]);
    });

    if (e.request && e.examples.request) {
      const { request, examples } = e;
      it(`${e.method} ${e.path}: request example parses`, () => {
        const parsed = request.safeParse(read(examples.request!));
        expect(parsed.error?.issues ?? []).toEqual([]);
      });
    }

    if (e.request) {
      it(`${e.method} ${e.path}: has a request example`, () => {
        expect(e.examples.request).toBeDefined();
      });
    }
  }

  for (const name of ERROR_EXAMPLES) {
    it(`${name} parses as an error body`, () => {
      const parsed = ErrorBody.safeParse(read(name));
      expect(parsed.error?.issues ?? []).toEqual([]);
    });
  }

  it("every file in contract/examples is used by the endpoint table", () => {
    const used = new Set<string>(ERROR_EXAMPLES);
    for (const e of ENDPOINTS) {
      used.add(e.examples.response);
      if (e.examples.request) used.add(e.examples.request);
    }
    const onDisk = readdirSync(EXAMPLES).filter((f) => f.endsWith(".json"));
    expect(onDisk.filter((f) => !used.has(f))).toEqual([]);
    expect([...used].filter((f) => !onDisk.includes(f))).toEqual([]);
  });
});

describe("the schemas reject what the contract forbids", () => {
  const checkins = ENDPOINTS.find((e) => e.id === "checkins.create")!;
  const bp = ENDPOINTS.find((e) => e.id === "bp.create")!;
  const good = read("checkins.request.json") as Record<string, unknown>;

  it("rejects a client-sent score", () => {
    expect(checkins.request!.safeParse({ ...good, metrics: { lapses: 0 } }).success).toBe(false);
  });

  it("rejects an early tap that carries a reaction time", () => {
    const trials = [{ i: 0, isiMs: 2000, rtMs: 250, early: true }];
    expect(checkins.request!.safeParse({ ...good, trials }).success).toBe(false);
  });

  it("rejects a reaction time that is not a whole number of milliseconds", () => {
    const trials = [{ i: 0, isiMs: 2000, rtMs: 250.5, early: false }];
    expect(checkins.request!.safeParse({ ...good, trials }).success).toBe(false);
  });

  it("rejects an empty trial list and an unknown protocol", () => {
    expect(checkins.request!.safeParse({ ...good, trials: [] }).success).toBe(false);
    expect(checkins.request!.safeParse({ ...good, protocolId: "pvt-10min" }).success).toBe(false);
  });

  it("rejects an unknown symptom and an impossible reading", () => {
    const base = read("bp.request.json") as Record<string, unknown>;
    expect(bp.request!.safeParse({ ...base, symptoms: ["headache"] }).success).toBe(false);
    expect(bp.request!.safeParse({ ...base, readings: [{ systolic: 900, diastolic: 80 }] }).success).toBe(false);
  });
});

describe("the written contract stays in step", () => {
  it("docs/api-contract.md names every endpoint", () => {
    const doc = readFileSync(new URL("../../docs/api-contract.md", import.meta.url), "utf8");
    const missing = ENDPOINTS.filter((e) => !doc.includes(`${e.method} ${e.path}`)).map((e) => `${e.method} ${e.path}`);
    expect(missing).toEqual([]);
  });

  it("contract/schemas.json is the current export (run `npm run contract:export` if this fails)", () => {
    const onDisk = readFileSync(new URL("../../contract/schemas.json", import.meta.url), "utf8");
    expect(normalise(onDisk)).toBe(renderContractJson());
  });
});
