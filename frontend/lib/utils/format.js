/** Small formatting helpers shared across the UI. */

export function formatTime(dateLike) {
  const d = toDate(dateLike);
  if (!d) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(dateLike) {
  const d = toDate(dateLike);
  if (!d) return "—";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(dateLike) {
  const d = toDate(dateLike);
  if (!d) return "—";
  return `${formatDate(d)}, ${formatTime(d)}`;
}

/**
 * Compact relative label for timestamps, e.g. "just now", "12 min ago", "3 h ago".
 */
export function relativeTime(dateLike, now = new Date()) {
  const d = toDate(dateLike);
  if (!d) return "never";
  const seconds = Math.round((now.getTime() - d.getTime()) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(d);
}

/** Elapsed timer label, e.g. "00:42" (minutes:seconds) or "01:04:12". */
export function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

/** Greeting based on the crew member's local time of day. */
export function greetingFor(now = new Date()) {
  const hour = now.getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Stable unique id (works without crypto.randomUUID in older browsers). */
export function makeId(prefix = "id") {
  const rand = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}
