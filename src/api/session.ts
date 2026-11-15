import { randomBytes } from "node:crypto";
import type { RequestHandler } from "express";
import type { z } from "zod";
import type { CrewMember } from "../schemas";

type Crew = z.infer<typeof CrewMember>;

/** E01 design choices (docs/features/E-extras.md): session lifetime and lockout. */
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export const MAX_FAILED_CODES = 5;
export const LOCKOUT_MS = 60 * 1000;

export interface Session {
  crew: Crew;
  expiresAt: number;
}

export interface SessionStore {
  issue(crew: Crew): { token: string; expiresAt: number };
  get(token: string): Session | undefined;
  revoke(token: string): void;
  /** Seconds left on a lockout for this crew id, or 0 if it may try. */
  lockedFor(crewId: string): number;
  recordFailure(crewId: string): void;
  clearFailures(crewId: string): void;
}

export interface SessionStoreOptions {
  /** Injected clock (ms) so tests can pin time. */
  now?: () => number;
  /** Injected token source so tests can use a known token. */
  tokenFactory?: () => string;
}

/** In-memory sessions. A server restart ends every session (fine for an offline demo). */
export function createSessionStore(options: SessionStoreOptions = {}): SessionStore {
  const now = options.now ?? (() => Date.now());
  const newToken = options.tokenFactory ?? (() => randomBytes(32).toString("base64url"));
  const sessions = new Map<string, Session>();
  const failures = new Map<string, { count: number; lockedUntil: number }>();

  return {
    issue(crew) {
      const token = newToken();
      const expiresAt = now() + SESSION_TTL_MS;
      sessions.set(token, { crew, expiresAt });
      return { token, expiresAt };
    },
    get(token) {
      const session = sessions.get(token);
      if (!session) return undefined;
      if (session.expiresAt <= now()) {
        sessions.delete(token);
        return undefined;
      }
      return session;
    },
    revoke(token) {
      sessions.delete(token);
    },
    lockedFor(crewId) {
      const f = failures.get(crewId);
      if (!f || f.lockedUntil <= now()) return 0;
      return Math.ceil((f.lockedUntil - now()) / 1000);
    },
    recordFailure(crewId) {
      // The count restarts after each lockout, so every 5th wrong code locks again.
      const count = (failures.get(crewId)?.count ?? 0) + 1;
      failures.set(
        crewId,
        count >= MAX_FAILED_CODES ? { count: 0, lockedUntil: now() + LOCKOUT_MS } : { count, lockedUntil: 0 },
      );
    },
    clearFailures(crewId) {
      failures.delete(crewId);
    },
  };
}

export function bearerToken(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const match = /^Bearer ([A-Za-z0-9_-]{16,200})$/.exec(header.trim());
  return match?.[1];
}

/** Puts the signed-in session on `res.locals.session`, or answers 401 no_session. */
export function requireSession(sessions: SessionStore): RequestHandler {
  return (req, res, next) => {
    const token = bearerToken(req.get("authorization"));
    const session = token ? sessions.get(token) : undefined;
    if (!session || !token) {
      res.status(401).json({
        error: { code: "no_session", message: "Sign in first: send Authorization: Bearer <token>." },
      });
      return;
    }
    res.locals.session = session;
    res.locals.token = token;
    next();
  };
}

export function sessionOf(locals: Record<string, unknown>): Session {
  const session = locals.session as Session | undefined;
  if (!session) throw new Error("requireSession must run before this handler.");
  return session;
}
