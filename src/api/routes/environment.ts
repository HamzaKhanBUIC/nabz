import { Router, type RequestHandler } from "express";
import { CURIOSITY_CRUISE_MSV_PER_DAY, estimateDose } from "../../core";
import { EnvironmentInput, EnvironmentState, HazardList, RadiationEstimate, type Environment } from "../../schemas";
import type { CrewPulseStore } from "../../store";
import type { MissionState } from "../../store/mission-state";
import { sessionOf } from "../session";

/** The role in data/fixtures/mission.json that may switch the mission environment. */
export const COMMANDER_ROLE = "Commander";

export interface EnvironmentRouterDeps {
  auth: RequestHandler;
  store: CrewPulseStore;
  missionState: MissionState;
}

/** Returns the active environment; falls back to the first one only if content lost the saved id. */
export function activeEnvironment(store: CrewPulseStore, missionState: MissionState): Environment {
  const all = store.getEnvironments();
  const id = missionState.getEnvironmentId();
  return all.find((e) => e.id === id) ?? all[0]!;
}

/** E03 hazards, E06 environment switch, E04 radiation estimate. */
export function createEnvironmentRouter(deps: EnvironmentRouterDeps): Router {
  const router = Router();
  const state = (): EnvironmentState => {
    const active = activeEnvironment(deps.store, deps.missionState);
    return EnvironmentState.parse({
      active,
      sources: deps.store.getSources(active.sourceIds),
      options: deps.store.getEnvironments().map((e) => ({ id: e.id, name: e.name })),
    });
  };

  router.get("/api/hazards", (_req, res) => {
    res.json(HazardList.parse({ hazards: deps.store.getHazards() }));
  });

  router.get("/api/environment", (_req, res) => {
    res.json(state());
  });

  router.put("/api/environment", deps.auth, (req, res) => {
    if (sessionOf(res.locals).crew.role !== COMMANDER_ROLE) {
      res.status(403).json({ error: { code: "forbidden", message: "Only the Commander can change the mission environment." } });
      return;
    }
    const parsed = EnvironmentInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: "invalid_input", message: "Environment body failed validation.", issues: parsed.error.issues },
      });
      return;
    }
    deps.missionState.setEnvironmentId(parsed.data.id);
    res.json(state());
  });

  router.get("/api/radiation", (_req, res) => {
    const env = activeEnvironment(deps.store, deps.missionState);
    const missionDay = deps.store.getMission().missionDay;
    const dose = estimateDose(env.radiationRateKey, missionDay);
    const note =
      env.radiationRateKey === null
        ? "No verified dose rate for this environment, so it is not tracked here."
        : env.radiationRateKey === "mars-transit"
          ? `Estimate from a published average, not a dosimeter reading. Curiosity measured ${CURIOSITY_CRUISE_MSV_PER_DAY} mSv/day on its 2011-12 cruise to Mars.`
          : "Estimate from a published average, not a dosimeter reading.";
    const sourceIds =
      env.radiationRateKey === null
        ? ["nasa-std-3001"]
        : env.radiationRateKey === "mars-transit"
          ? ["george-2024-artemis", "zeitlin-2013-msl", "nasa-std-3001"]
          : ["george-2024-artemis", "nasa-std-3001"];
    res.json(
      RadiationEstimate.parse({
        environment: { id: env.id, name: env.name },
        missionDay,
        basis: "published-average",
        ...dose,
        careerLimitMsv: 600,
        note,
        sources: deps.store.getSources(sourceIds),
      }),
    );
  });

  return router;
}
