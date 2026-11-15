import { statusToPill } from "@/lib/api";

export function getTrendSeries(code, store) {
  return store?.trends?.[code]?.points || [];
}

export function getTrendBand(code, store) {
  return store?.trends?.[code]?.band || null;
}

export function getLatestPoint(code, store) {
  const points = getTrendSeries(code, store);
  return points.length > 0 ? points[points.length - 1] : null;
}

export function getOverallStatus(today) {
  if (today?.card?.status) {
    return statusToPill(today.card.status);
  }
  if (today?.checkin?.zone?.status) {
    return statusToPill(today.checkin.zone.status);
  }
  return statusToPill({
    level: "info",
    label: "No check-in today yet",
    iconKey: "info",
  });
}

export function hasAnyRecordedData(store) {
  return Boolean(
    store?.today?.checkin ||
      store?.today?.bp ||
      Object.values(store?.trends || {}).some((t) => (t?.points?.length || 0) > 0),
  );
}
