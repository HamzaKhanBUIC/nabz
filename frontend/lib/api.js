/**
 * Client for the local CrewPulse Express 5 backend.
 * Zero client-side clinical scoring: the server computes zones, categories, cards and bands.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export class ApiError extends Error {
  constructor(message, { status = 500, code = "HTTP_ERROR", issues = [] } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

async function request(path, options = {}) {
  const { headers, ...rest } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...rest,
    headers: {
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const err = data?.error;
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
  if (!commsDelay) return "3–22 min";
  const min = commsDelay.oneWayMinMinutes;
  const max = commsDelay.oneWayMaxMinutes;
  if (min == null || max == null) return "3–22 min";
  return min === max ? `${min} min` : `${min}–${max} min`;
}
