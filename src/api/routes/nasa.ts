import { Router } from "express";
import { NasaTrendQuery } from "../../schemas";
import {
  buildNasaBloodTrend,
  buildNasaCatalog,
  loadNasaOsd569Samples,
} from "../../store";

/** Creates public read-only routes for real NASA OSDR OSD-569 Inspiration4 blood counts. */
export function createNasaRouter(options: { nasaDir?: string } = {}): Router {
  const samples = loadNasaOsd569Samples(options.nasaDir);
  const catalog = buildNasaCatalog(samples);
  const crewIds = new Set<string>(catalog.crew);
  const analyteKeys = new Set(catalog.analytes.map((a) => a.key));

  const router = Router();

  router.get("/api/nasa/osd-569", (_req, res) => {
    res.json(catalog);
  });

  router.get("/api/nasa/osd-569/trend", (req, res) => {
    const parsed = NasaTrendQuery.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "invalid_input",
          message: "NASA OSD-569 trend query parameters failed validation.",
          issues: parsed.error.issues,
        },
      });
      return;
    }

    if (!crewIds.has(parsed.data.crew)) {
      res.status(400).json({
        error: {
          code: "invalid_input",
          message: `Unknown OSD-569 crew ID "${parsed.data.crew}".`,
          issues: [
            {
              code: "custom",
              path: ["crew"],
              message: `Unknown OSD-569 crew ID "${parsed.data.crew}".`,
            },
          ],
        },
      });
      return;
    }

    if (!analyteKeys.has(parsed.data.analyte)) {
      res.status(400).json({
        error: {
          code: "invalid_input",
          message: `Unknown OSD-569 analyte "${parsed.data.analyte}".`,
          issues: [
            {
              code: "custom",
              path: ["analyte"],
              message: `Unknown OSD-569 analyte "${parsed.data.analyte}".`,
            },
          ],
        },
      });
      return;
    }

    res.json(buildNasaBloodTrend(samples, parsed.data.crew, parsed.data.analyte));
  });

  return router;
}
