/**
 * Client for the local CrewPulse Express 5 backend.
 * Zero client-side clinical scoring: the server computes zones, categories, cards and bands.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

const TOKEN_STORAGE_KEY = "crewpulse:token";
const CREW_STORAGE_KEY = "crewpulse:crew";
const SESSION_EVENT = "crewpulse:session";

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === "function" ? handler : null;
  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

function emitSessionChange() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(SESSION_EVENT));
  } catch {
    // ignore event dispatch failures
  }
}

export function subscribeSessionChange(listener) {
  if (typeof window === "undefined") return () => {};
  const onEvent = () => listener();
  window.addEventListener(SESSION_EVENT, onEvent);
  window.addEventListener("storage", onEvent);
  return () => {
    window.removeEventListener(SESSION_EVENT, onEvent);
    window.removeEventListener("storage", onEvent);
  };
}

export function getToken() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(TOKEN_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, String(token));
    } else {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore sessionStorage errors
  }
  emitSessionChange();
}

export function getStoredCrew() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CREW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === "string" && typeof parsed.name === "string") {
      return {
        id: parsed.id,
        name: parsed.name,
        role: typeof parsed.role === "string" ? parsed.role : "",
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredCrew(crew) {
  if (typeof window === "undefined") return;
  try {
    if (crew && typeof crew.id === "string") {
      window.sessionStorage.setItem(
        CREW_STORAGE_KEY,
        JSON.stringify({
          id: crew.id,
          name: crew.name,
          role: crew.role,
        }),
      );
    } else {
      window.sessionStorage.removeItem(CREW_STORAGE_KEY);
    }
  } catch {
    // ignore sessionStorage errors
  }
  emitSessionChange();
}

export function clearToken() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    window.sessionStorage.removeItem(CREW_STORAGE_KEY);
  } catch {
    // ignore sessionStorage errors
  }
  emitSessionChange();
}

export class ApiError extends Error {
  constructor(
    message,
    { status = 500, code = "HTTP_ERROR", issues = [], retryAfterSeconds = null } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.issues = issues;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function handleNoSessionRedirect() {
  clearToken();
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/sign-in") return;
  if (unauthorizedHandler) {
    unauthorizedHandler();
  } else {
    window.location.replace("/sign-in");
  }
}

async function request(path, options = {}) {
  const { headers, handleNoSession = true, ...rest } = options;
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...rest,
    headers: {
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });

  let data = null;
  if (response.status !== 204) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const err = data?.error;
    if (response.status === 401 && err?.code === "no_session" && handleNoSession) {
      handleNoSessionRedirect();
    }
    const issueMsg =
      Array.isArray(err?.issues) && err.issues.length > 0
        ? ` (${err.issues.map((i) => `${i.path || "input"}: ${i.message}`).join("; ")})`
        : "";
    throw new ApiError(
      (err?.message || `Request failed with status ${response.status}`) + issueMsg,
      {
        status: response.status,
        code: err?.code || "HTTP_ERROR",
        issues: err?.issues || [],
        retryAfterSeconds: err?.retryAfterSeconds ?? null,
      },
    );
  }

  return data;
}

export function getHealth() {
  return request("/api/health");
}

export function getMission() {
  return request("/api/mission");
}

export function getToday() {
  return request("/api/today");
}

export function getCheckinProtocol() {
  return request("/api/checkin/protocol");
}

export function submitCheckin(payload) {
  return request("/api/checkins", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getTrends(code, days = 30) {
  const qs = new URLSearchParams({
    code,
    days: String(days),
  });
  return request(`/api/trends?${qs.toString()}`);
}

export function getBpGuide() {
  return request("/api/measurements/bp/guide");
}

export function submitBpMeasurement(payload) {
  return request("/api/measurements/bp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getEmergencyProcedures(forTarget) {
  const qs = forTarget ? `?for=${encodeURIComponent(forTarget)}` : "";
  return request(`/api/emergency/procedures${qs}`);
}

export function getEmergencyProcedureById(id) {
  return request(`/api/emergency/procedures/${encodeURIComponent(id)}`);
}

export function askCoach({ question, cardId }) {
  return request("/api/coach/ask", {
    method: "POST",
    body: JSON.stringify(cardId ? { question, cardId } : { question }),
  });
}

export function getRoutines() {
  return request("/api/routines");
}

export function previewShare(payload) {
  return request("/api/share/preview", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function sendShare(payload) {
  return request("/api/share", {
    method: "POST",
    body: JSON.stringify({ ...payload, confirm: true }),
  });
}

export function getReminders() {
  return request("/api/reminders");
}

export function updateReminders(schedule) {
  return request("/api/reminders", {
    method: "PUT",
    body: JSON.stringify(schedule),
  });
}

export function listCrew() {
  return request("/api/crew", { handleNoSession: false });
}

export async function signIn(crewId, code) {
  const data = await request("/api/session", {
    method: "POST",
    body: JSON.stringify({ crewId, code }),
    handleNoSession: false,
  });
  if (data?.token) {
    setToken(data.token);
  }
  if (data?.crew) {
    setStoredCrew(data.crew);
  }
  return data;
}

export async function getSession(options = {}) {
  const data = await request("/api/session", options);
  if (data?.crew) {
    setStoredCrew(data.crew);
  }
  return data;
}

export async function signOut() {
  try {
    if (getToken()) {
      await request("/api/session", {
        method: "DELETE",
        handleNoSession: false,
      });
    }
  } catch {
    // Always clear the local session even if the server already expired or is offline.
  } finally {
    clearToken();
  }
}

export function getConsent() {
  return request("/api/consent");
}

export function setConsent(share) {
  return request("/api/consent", {
    method: "PUT",
    body: JSON.stringify({ shareWithMedicalOfficer: Boolean(share) }),
  });
}

export function getCrewOverview() {
  return request("/api/crew/overview");
}

export function getNasaCatalog() {
  return request("/api/nasa/osd-569", { handleNoSession: false });
}

export function getNasaTrend(crew, analyte) {
  const qs = new URLSearchParams({
    crew: String(crew),
    analyte: String(analyte),
  });
  return request(`/api/nasa/osd-569/trend?${qs.toString()}`, {
    handleNoSession: false,
  });
}

export function iconNameForKey(iconKey) {
  switch (iconKey) {
    case "check":
      return "check_circle";
    case "hourglass":
      return "hourglass_top";
    case "eye":
      return "visibility";
    case "alert":
      return "warning";
    case "siren":
      return "emergency";
    case "info":
    default:
      return "info";
  }
}

export function statusToTone(level) {
  switch (level) {
    case "in_zone":
    case "normal":
      return "normal";
    case "watch":
      return "attention";
    case "act":
    case "urgent":
      return "emergency";
    case "info":
    case "building":
    case "not_scored":
    default:
      return "info";
  }
}

export function statusToBadgeTone(level) {
  switch (level) {
    case "in_zone":
    case "normal":
      return "ok";
    case "watch":
      return "warn";
    case "act":
    case "urgent":
      return "bad";
    case "info":
    case "building":
      return "info";
    case "not_scored":
    default:
      return "neutral";
  }
}

export function zoneToLabel(zone) {
  switch (zone) {
    case "in_zone":
      return "Within your normal";
    case "watch":
      return "Different from your normal";
    case "act":
      return "Below your normal";
    case "building":
      return "Learning your normal";
    case "not_scored":
    default:
      return "Not scored";
  }
}

export function statusToPill(status) {
  const level = status?.level || "info";
  return {
    level,
    tone: statusToTone(level),
    badgeTone: statusToBadgeTone(level),
    label: status?.label || "Not scored",
    iconKey: status?.iconKey || "info",
    iconName: iconNameForKey(status?.iconKey || "info"),
  };
}

export function formatDelayRange(commsDelay) {
  if (!commsDelay) return "3-22 min";
  const min = commsDelay.oneWayMinMinutes;
  const max = commsDelay.oneWayMaxMinutes;
  if (min == null || max == null) return "3-22 min";
  return min === max ? `${min} min` : `${min}-${max} min`;
}
