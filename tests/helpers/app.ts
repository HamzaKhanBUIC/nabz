import { createApp as createRealApp, type CreateAppOptions } from "../../src/api/app";
import { createSessionStore } from "../../src/api/session";

/** A fixed token so tests can call personal endpoints as Sara. Only exists inside tests. */
export const TEST_TOKEN = "test-session-token-sara-0001";
export const SARA_AUTH = { Authorization: `Bearer ${TEST_TOKEN}` };

/** The real app, with Sara already signed in under TEST_TOKEN. */
export function createApp(options: CreateAppOptions = {}) {
  const sessions = options.sessions ?? createSessionStore({ tokenFactory: () => TEST_TOKEN });
  sessions.issue({ id: "sara", name: "Sara", role: "Commander" });
  return createRealApp({ ...options, sessions });
}
