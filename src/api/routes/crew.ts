import { Router, type RequestHandler } from "express";
import { ConsentInput, CrewOverview, type CrewMember } from "../../schemas";
import type { CrewPulseStore } from "../../store";
import { sessionOf } from "../session";
import type { z } from "zod";

/** The role in data/fixtures/mission.json that may read crewmates' summaries. */
export const MEDICAL_OFFICER_ROLE = "Medical officer";

export interface CrewRouterDeps {
  auth: RequestHandler;
  crew: readonly z.infer<typeof CrewMember>[];
  storeFor: (subjectId: string) => CrewPulseStore;
  nowIso: () => string;
}

/** E05: consent and the Medical Officer overview. Roles and consent are checked here, on the server. */
export function createCrewRouter(deps: CrewRouterDeps): Router {
  const router = Router();

  router.get("/api/consent", deps.auth, (_req, res) => {
    res.json(deps.storeFor(sessionOf(res.locals).crew.id).getConsent());
  });

  router.put("/api/consent", deps.auth, (req, res) => {
    const parsed = ConsentInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: "invalid_input", message: "Consent body failed validation.", issues: parsed.error.issues },
      });
      return;
    }
    const me = sessionOf(res.locals).crew.id;
    res.json(deps.storeFor(me).setConsent(parsed.data.shareWithMedicalOfficer));
  });

  router.get("/api/crew/overview", deps.auth, (_req, res) => {
    const viewer = sessionOf(res.locals).crew;
    if (viewer.role !== MEDICAL_OFFICER_ROLE) {
      res.status(403).json({ error: { code: "forbidden", message: "Only the crew Medical Officer can see this." } });
      return;
    }
    const at = deps.nowIso();
    let missionDay = 0;
    const crew = deps.crew
      .filter((c) => c.id !== viewer.id)
      .map((c) => {
        const store = deps.storeFor(c.id);
        const shared = store.getConsent().shareWithMedicalOfficer;
        const summary = shared ? store.getHealthSummary() : null;
        if (summary) {
          missionDay = summary.missionDay;
          store.recordAccess({ viewerId: viewer.id, viewerName: viewer.name, at });
        }
        return { id: c.id, name: c.name, role: c.role, shared, summary };
      });
    if (missionDay === 0) missionDay = deps.storeFor(viewer.id).getToday().missionDay;
    // Parse on the way out: the schema is an allow-list, so nothing extra can leak.
    res.json(CrewOverview.parse({ missionDay, crew }));
  });

  return router;
}
