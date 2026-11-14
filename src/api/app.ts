import cors from "cors";
import express, { type ErrorRequestHandler, type Express } from "express";

/** Only pages served from this machine may call the API from a browser. */
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export function createApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    cors({
      origin: (origin, callback) => callback(null, !origin || LOCAL_ORIGIN.test(origin)),
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use((req, res) => {
    res.status(404).json({ error: { code: "not_found", message: `No route for ${req.method} ${req.path}` } });
  });

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    void _next;
    const badJson = err instanceof SyntaxError || (err as { type?: string }).type === "entity.parse.failed";
    if (badJson) {
      res.status(400).json({ error: { code: "invalid_input", message: "The request body is not valid JSON." } });
      return;
    }
    console.error(err);
    res.status(500).json({ error: { code: "internal", message: "Unexpected server error." } });
  };
  app.use(onError);

  return app;
}
