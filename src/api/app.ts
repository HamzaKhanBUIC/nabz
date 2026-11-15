import path from "node:path";
import cors from "cors";
import express, { type ErrorRequestHandler, type Express } from "express";
import {
  BpInput,
  CheckinInput,
  CoachAskInput,
  ProcedureQuery,
  ReminderSchedule,
  SessionInput,
  SharePreviewInput,
  ShareSendInput,
  TrendQuery,
} from "../schemas";
import { withEscalation } from "../core";
import { createStore, type NabzStore } from "../store";
import { createMissionState } from "../store/mission-state";
import { loadCrewAccess, verifyCode } from "../store/access";
import { createCrewRouter } from "./routes/crew";
import { activeEnvironment, createEnvironmentRouter } from "./routes/environment";
import { createNasaRouter } from "./routes/nasa";
import { bearerToken, createSessionStore, requireSession, sessionOf, type SessionStore } from "./session";

/** Only pages served from this machine may call the API from a browser. */
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export interface CreateAppOptions {
  store?: NabzStore;
  runtimeDir?: string;
  pinnedNow?: string;
  consoleDir?: string;
  /** E01: injected sessions (tests use a known token). */
  sessions?: SessionStore;
  /** E01: hashed crew codes; default data/crew/access.json. */
  accessFile?: string;
}

export function createApp(options: CreateAppOptions = {}): Express {
  // One store per crew member, created on first use. Content and mission come from Sara's
  // store; personal data always comes from the signed-in person's own store.
  const stores = new Map<string, NabzStore>();
  if (options.store) stores.set("sara", options.store);
  const storeFor = (subjectId: string): NabzStore => {
    let s = stores.get(subjectId);
    if (!s) {
      s = createStore({ runtimeDir: options.runtimeDir, pinnedNow: options.pinnedNow, subjectId });
      stores.set(subjectId, s);
    }
    return s;
  };
  const store = storeFor("sara");
  const crew = store.getMission().crew;
  const access = loadCrewAccess(options.accessFile);
  const sessions = options.sessions ?? createSessionStore();
  const auth = requireSession(sessions);
  const mine = (locals: Record<string, unknown>): NabzStore => storeFor(sessionOf(locals).crew.id);
  // E06: the active environment is mission-level state, shared by the whole crew.
  const missionState = createMissionState(options.runtimeDir ?? path.join(process.cwd(), "data", "runtime"));
  const env = () => activeEnvironment(store, missionState);

  const app = express();
  app.disable("x-powered-by");
  app.use(
    cors({
      origin: (origin, callback) => callback(null, !origin || LOCAL_ORIGIN.test(origin)),
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  // E01: crew sign-in
  app.get("/api/crew", (_req, res) => {
    res.json({ crew });
  });

  app.post("/api/session", (req, res) => {
    const parsed = SessionInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: "invalid_input", message: "Sign-in body failed validation.", issues: parsed.error.issues },
      });
      return;
    }
    const { crewId, code } = parsed.data;
    const member = crew.find((c) => c.id === crewId);
    const entry = access.get(crewId);
    const wait = sessions.lockedFor(crewId);
    if (wait > 0) {
      res.status(429).json({
        error: { code: "locked", message: "Too many wrong codes. Try again later.", retryAfterSeconds: wait },
      });
      return;
    }
    if (!member || !entry || !verifyCode(entry, code)) {
      sessions.recordFailure(crewId);
      res.status(401).json({ error: { code: "invalid_code", message: "Crew member or code did not match." } });
      return;
    }
    sessions.clearFailures(crewId);
    const issued = sessions.issue(member);
    res.status(201).json({ token: issued.token, crew: member, expiresAt: new Date(issued.expiresAt).toISOString() });
  });

  app.get("/api/session", auth, (_req, res) => {
    const session = sessionOf(res.locals);
    res.json({ crew: session.crew, expiresAt: new Date(session.expiresAt).toISOString() });
  });

  app.delete("/api/session", (req, res) => {
    const token = bearerToken(req.get("authorization"));
    if (token) sessions.revoke(token);
    res.status(204).end();
  });

  // E05: consent and the Medical Officer overview
  app.use(
    createCrewRouter({
      auth,
      crew,
      storeFor,
      nowIso: () => options.pinnedNow ?? new Date().toISOString(),
    }),
  );

  // E03 hazards, E06 environment, E04 radiation
  app.use(createEnvironmentRouter({ auth, store, missionState }));

  // Must endpoints
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/mission", (_req, res) => {
    const e = env();
    res.json({ ...store.getMission(), environment: { id: e.id, name: e.name } });
  });

  app.get("/api/today", auth, (_req, res) => {
    const today = mine(res.locals).getToday();
    const e = env();
    res.json({
      ...today,
      checkin: today.checkin ? { ...today.checkin, card: withEscalation(today.checkin.card, e) } : null,
      bp: today.bp ? { ...today.bp, card: withEscalation(today.bp.card, e) } : null,
      card: today.card ? withEscalation(today.card, e) : null,
      cards: today.cards.map((c) => withEscalation(c, e)),
    });
  });

  app.get("/api/checkin/protocol", (_req, res) => {
    res.json(store.getProtocol());
  });

  app.post("/api/checkins", auth, (req, res) => {
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
    const created = mine(res.locals).createCheckin(parsed.data);
    res.status(201).json({ ...created, card: withEscalation(created.card, env()) });
  });

  app.get("/api/trends", auth, (req, res) => {
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
    res.json(mine(res.locals).getTrend(parsed.data));
  });

  app.get("/api/measurements/bp/guide", (_req, res) => {
    res.json(store.getBpGuide());
  });

  app.post("/api/measurements/bp", auth, (req, res) => {
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
    const created = mine(res.locals).createBpMeasurement(parsed.data);
    res.status(201).json({ ...created, card: withEscalation(created.card, env()) });
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
  app.post("/api/coach/ask", auth, async (req, res, next) => {
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
      const reply = await mine(res.locals).askCoach(parsed.data);
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

  app.post("/api/share/preview", auth, (req, res) => {
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
    res.json(mine(res.locals).previewShare(parsed.data));
  });

  app.post("/api/share", auth, (req, res) => {
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
    const queued = mine(res.locals).createSharePackage(parsed.data);
    res.status(201).json(queued);
  });

  app.get("/api/reminders", auth, (_req, res) => {
    res.json(mine(res.locals).getReminders());
  });

  app.put("/api/reminders", auth, (req, res) => {
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
    res.json(mine(res.locals).updateReminders(parsed.data));
  });

  // E02: real astronaut data (public)
  app.use(createNasaRouter());

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
