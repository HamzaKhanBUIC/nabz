import path from "node:path";
import cors from "cors";
import express, { type ErrorRequestHandler, type Express } from "express";
import {
  BpInput,
  CheckinInput,
  CoachAskInput,
  ProcedureQuery,
  ReminderSchedule,
  SharePreviewInput,
  ShareSendInput,
  TrendQuery,
} from "../schemas";
import { createStore, type CrewPulseStore } from "../store";

/** Only pages served from this machine may call the API from a browser. */
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export interface CreateAppOptions {
  store?: CrewPulseStore;
  runtimeDir?: string;
  pinnedNow?: string;
  consoleDir?: string;
}

export function createApp(options: CreateAppOptions = {}): Express {
  const store =
    options.store ??
    createStore({
      runtimeDir: options.runtimeDir,
      pinnedNow: options.pinnedNow,
    });

  const app = express();
  app.disable("x-powered-by");
  app.use(
    cors({
      origin: (origin, callback) => callback(null, !origin || LOCAL_ORIGIN.test(origin)),
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  // Must endpoints
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/mission", (_req, res) => {
    res.json(store.getMission());
  });

  app.get("/api/today", (_req, res) => {
    res.json(store.getToday());
  });

  app.get("/api/checkin/protocol", (_req, res) => {
    res.json(store.getProtocol());
  });

  app.post("/api/checkins", (req, res) => {
    const parsed = CheckinInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "invalid_input",
          message: "Check-in request body failed validation.",
          issues: parsed.error.issues,
        },
      });
      return;
    }
    const created = store.createCheckin(parsed.data);
    res.status(201).json(created);
  });

  app.get("/api/trends", (req, res) => {
    const parsed = TrendQuery.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "invalid_input",
          message: "Trend query parameters failed validation.",
          issues: parsed.error.issues,
        },
      });
      return;
    }
    res.json(store.getTrend(parsed.data));
  });

  app.get("/api/measurements/bp/guide", (_req, res) => {
    res.json(store.getBpGuide());
  });

  app.post("/api/measurements/bp", (req, res) => {
    const parsed = BpInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "invalid_input",
          message: "Blood pressure request body failed validation.",
          issues: parsed.error.issues,
        },
      });
      return;
    }
    const created = store.createBpMeasurement(parsed.data);
    res.status(201).json(created);
  });

  app.get("/api/emergency/procedures", (req, res) => {
    const parsed = ProcedureQuery.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "invalid_input",
          message: "Emergency procedure query parameters failed validation.",
          issues: parsed.error.issues,
        },
      });
      return;
    }
    res.json(store.getEmergencyProcedures(parsed.data.for));
  });

  app.get("/api/emergency/procedures/:id", (req, res) => {
    const procedure = store.getEmergencyProcedureById(req.params.id);
    if (!procedure) {
      res.status(404).json({
        error: {
          code: "not_found",
          message: `Emergency procedure "${req.params.id}" was not found.`,
        },
      });
      return;
    }
    res.json(procedure);
  });

  // Should endpoints (S02, S03, S04, S05)
  app.post("/api/coach/ask", async (req, res, next) => {
    try {
      const parsed = CoachAskInput.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: {
            code: "invalid_input",
            message: "Coach request body failed validation.",
            issues: parsed.error.issues,
          },
        });
        return;
      }
      const reply = await store.askCoach(parsed.data);
      if (!reply) {
        res.status(404).json({
          error: {
            code: "not_found",
            message: `No matching action card "${parsed.data.cardId ?? ""}" was found for today.`,
          },
        });
        return;
      }
      res.json(reply);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/routines", (_req, res) => {
    res.json(store.getRoutines());
  });

  app.post("/api/share/preview", (req, res) => {
    const parsed = SharePreviewInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "invalid_input",
          message: "Share preview request body failed validation.",
          issues: parsed.error.issues,
        },
      });
      return;
    }
    res.json(store.previewShare(parsed.data));
  });

  app.post("/api/share", (req, res) => {
    const parsed = ShareSendInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "invalid_input",
          message: "Share confirmation request body failed validation.",
          issues: parsed.error.issues,
        },
      });
      return;
    }
    const queued = store.createSharePackage(parsed.data);
    res.status(201).json(queued);
  });

  app.get("/api/reminders", (_req, res) => {
    res.json(store.getReminders());
  });

  app.put("/api/reminders", (req, res) => {
    const parsed = ReminderSchedule.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "invalid_input",
          message: "Reminder schedule body failed validation.",
          issues: parsed.error.issues,
        },
      });
      return;
    }
    res.json(store.updateReminders(parsed.data));
  });

  // Dev test console (only when not production)
  if (process.env.NODE_ENV !== "production") {
    const consoleDir = options.consoleDir ?? path.join(process.cwd(), "tools", "console");
    app.use("/dev", express.static(consoleDir));
  }

  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: "not_found",
        message: `No route for ${req.method} ${req.path}`,
      },
    });
  });

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    void _next;
    const badJson =
      err instanceof SyntaxError || (err as { type?: string }).type === "entity.parse.failed";
    if (badJson) {
      res.status(400).json({
        error: {
          code: "invalid_input",
          message: "The request body is not valid JSON.",
        },
      });
      return;
    }
    console.error(err);
    res.status(500).json({ error: { code: "internal", message: "Unexpected server error." } });
  };
  app.use(onError);

  return app;
}
