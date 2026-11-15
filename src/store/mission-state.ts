import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { EnvironmentId } from "../schemas";

/** design choice (docs/blueprint/03-data-model.md): the mission starts in its planned profile. */
export const DEFAULT_ENVIRONMENT_ID: EnvironmentId = "mars-transit";

const MissionStateFile = z.strictObject({ version: z.literal(1), environmentId: EnvironmentId });

export interface MissionState {
  getEnvironmentId(): EnvironmentId;
  setEnvironmentId(id: EnvironmentId): void;
}

/** E06: mission-level state shared by the whole crew, in `<runtimeDir>/mission-state.json`. */
export function createMissionState(runtimeDir: string): MissionState {
  const filePath = path.join(runtimeDir, "mission-state.json");
  return {
    getEnvironmentId(): EnvironmentId {
      if (!existsSync(filePath)) return DEFAULT_ENVIRONMENT_ID;
      try {
        const parsed = MissionStateFile.safeParse(JSON.parse(readFileSync(filePath, "utf8")));
        return parsed.success ? parsed.data.environmentId : DEFAULT_ENVIRONMENT_ID;
      } catch {
        return DEFAULT_ENVIRONMENT_ID;
      }
    },
    setEnvironmentId(id: EnvironmentId): void {
      mkdirSync(runtimeDir, { recursive: true });
      const tempPath = `${filePath}.tmp`;
      writeFileSync(tempPath, `${JSON.stringify({ version: 1, environmentId: id }, null, 2)}\n`, "utf8");
      renameSync(tempPath, filePath);
    },
  };
}
