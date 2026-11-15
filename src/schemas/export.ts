import { z } from "zod";
import { ENDPOINTS } from "./endpoints";

type JsonSchema = Record<string, unknown>;

const toJson = (schema: z.ZodType, io: "input" | "output"): JsonSchema =>
  z.toJSONSchema(schema, { io, unrepresentable: "any" }) as JsonSchema;

/**
 * The contract as JSON Schema, one entry per endpoint, for tools that can't read zod.
 * Written to contract/schemas.json by `npm run contract:export`; a test keeps that file in step.
 */
export function buildContractJson(): JsonSchema {
  const endpoints: Record<string, JsonSchema> = {};
  for (const e of ENDPOINTS) {
    endpoints[`${e.method} ${e.path}`] = {
      id: e.id,
      tier: e.tier,
      access: e.access ?? "public",
      status: e.status,
      ...(e.query ? { query: toJson(e.query, "input") } : {}),
      ...(e.request ? { request: toJson(e.request, "input") } : {}),
      response: toJson(e.response, "output"),
    };
  }
  return { contractVersion: "0.1", endpoints };
}

export const renderContractJson = (): string => JSON.stringify(buildContractJson(), null, 2) + "\n";
