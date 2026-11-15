/**
 * Visual icon mapping for NASA's 5 hazards of human spaceflight (E03).
 */

export const HAZARD_ICONS = {
  "space-radiation": "flare",
  "isolation-confinement": "psychology",
  "distance-from-earth": "public",
  "gravity-fields": "orbit",
  "hostile-closed-environments": "shield",
};

export function hazardIcon(hazardId) {
  return HAZARD_ICONS[hazardId] || "health_and_safety";
}
