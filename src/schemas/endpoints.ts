import type { z } from "zod";
import { BpGuide, BpInput, BpMeasurement } from "./bp";
import { CheckinInput, CheckinResponse, Protocol } from "./checkin";
import { CoachAskInput, CoachAskResponse } from "./coach";
import { ErrorBody, HealthResponse } from "./common";
import { ConsentInput, ConsentResponse, CrewOverview } from "./crew";
import { Mission, Today } from "./mission";
import { NasaCatalog, NasaTrendQuery } from "./nasa";
import { Procedure, ProcedureBundle, ProcedureQuery } from "./procedure";
import { ReminderSchedule, RemindersResponse } from "./reminders";
import { RoutineBundle } from "./routine";
import {
  SharePackagePreview,
  SharePreviewInput,
  ShareQueuedPackage,
  ShareSendInput,
} from "./share";
import { CrewList, SessionInfo, SessionInput, SessionResponse } from "./session";
import { Trend, TrendQuery } from "./trend";

export type EndpointSpec = {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  /** must: P0 build. should: P2 build. reserved: answers 501 until built. */
  tier: "must" | "should" | "extra" | "reserved";
  /** Who may call it. public: anyone. session: a signed-in crew member (Authorization: Bearer). officer: the Medical Officer. Default public. */
  access?: "public" | "session" | "officer";
  status: number;
  query?: z.ZodType;
  request?: z.ZodType;
  response: z.ZodType;
  /** File names in contract/examples/. */
  examples: { request?: string; response: string };
};

/** The whole API in one table. The server, the tests and docs/api-contract.md all follow it. */
export const ENDPOINTS: EndpointSpec[] = [
  { id: "health", method: "GET", path: "/api/health", tier: "must", status: 200, response: HealthResponse, examples: { response: "health.response.json" } },
  { id: "mission", method: "GET", path: "/api/mission", tier: "must", status: 200, response: Mission, examples: { response: "mission.response.json" } },
  { id: "today", access: "session", method: "GET", path: "/api/today", tier: "must", status: 200, response: Today, examples: { response: "today.response.json" } },
  { id: "checkin.protocol", method: "GET", path: "/api/checkin/protocol", tier: "must", status: 200, response: Protocol, examples: { response: "checkin-protocol.response.json" } },
  { id: "checkins.create", access: "session", method: "POST", path: "/api/checkins", tier: "must", status: 201, request: CheckinInput, response: CheckinResponse, examples: { request: "checkins.request.json", response: "checkins.response.json" } },
  { id: "trends", access: "session", method: "GET", path: "/api/trends", tier: "must", status: 200, query: TrendQuery, response: Trend, examples: { response: "trends.response.json" } },
  { id: "bp.guide", method: "GET", path: "/api/measurements/bp/guide", tier: "must", status: 200, response: BpGuide, examples: { response: "bp-guide.response.json" } },
  { id: "bp.create", access: "session", method: "POST", path: "/api/measurements/bp", tier: "must", status: 201, request: BpInput, response: BpMeasurement, examples: { request: "bp.request.json", response: "bp.response.json" } },
  { id: "emergency.list", method: "GET", path: "/api/emergency/procedures", tier: "must", status: 200, query: ProcedureQuery, response: ProcedureBundle, examples: { response: "emergency-procedures.response.json" } },
  { id: "emergency.one", method: "GET", path: "/api/emergency/procedures/:id", tier: "must", status: 200, response: Procedure, examples: { response: "emergency-procedure.response.json" } },

  { id: "coach.ask", access: "session", method: "POST", path: "/api/coach/ask", tier: "should", status: 200, request: CoachAskInput, response: CoachAskResponse, examples: { request: "coach-ask.request.json", response: "coach-ask.response.json" } },
  { id: "routines", method: "GET", path: "/api/routines", tier: "should", status: 200, response: RoutineBundle, examples: { response: "routines.response.json" } },
  { id: "share.preview", access: "session", method: "POST", path: "/api/share/preview", tier: "should", status: 200, request: SharePreviewInput, response: SharePackagePreview, examples: { request: "share-preview.request.json", response: "share-preview.response.json" } },
  { id: "share.send", access: "session", method: "POST", path: "/api/share", tier: "should", status: 201, request: ShareSendInput, response: ShareQueuedPackage, examples: { request: "share.request.json", response: "share.response.json" } },
  { id: "reminders.get", access: "session", method: "GET", path: "/api/reminders", tier: "should", status: 200, response: RemindersResponse, examples: { response: "reminders.response.json" } },
  { id: "reminders.put", access: "session", method: "PUT", path: "/api/reminders", tier: "should", status: 200, request: ReminderSchedule, response: RemindersResponse, examples: { request: "reminders-put.request.json", response: "reminders.response.json" } },

  { id: "crew.list", method: "GET", path: "/api/crew", tier: "extra", status: 200, response: CrewList, examples: { response: "crew.response.json" } },
  { id: "session.create", method: "POST", path: "/api/session", tier: "extra", status: 201, request: SessionInput, response: SessionResponse, examples: { request: "session.request.json", response: "session.response.json" } },
  { id: "session.get", method: "GET", path: "/api/session", access: "session", tier: "extra", status: 200, response: SessionInfo, examples: { response: "session-info.response.json" } },
  { id: "consent.get", method: "GET", path: "/api/consent", access: "session", tier: "extra", status: 200, response: ConsentResponse, examples: { response: "consent.response.json" } },
  { id: "consent.put", method: "PUT", path: "/api/consent", access: "session", tier: "extra", status: 200, request: ConsentInput, response: ConsentResponse, examples: { request: "consent-put.request.json", response: "consent.response.json" } },
  { id: "crew.overview", method: "GET", path: "/api/crew/overview", access: "officer", tier: "extra", status: 200, response: CrewOverview, examples: { response: "crew-overview.response.json" } },
  { id: "nasa.catalog", method: "GET", path: "/api/nasa/osd-569", tier: "extra", status: 200, response: NasaCatalog, examples: { response: "nasa-catalog.response.json" } },
  { id: "nasa.trend", method: "GET", path: "/api/nasa/osd-569/trend", tier: "extra", status: 200, query: NasaTrendQuery, response: Trend, examples: { response: "nasa-trend.response.json" } },
];

/** Error examples that belong to no single endpoint. */
export const ERROR_EXAMPLES = ["error-invalid-input.response.json", "error-not-found.response.json", "error-not-built.response.json"];
export type { z, ErrorBody };
