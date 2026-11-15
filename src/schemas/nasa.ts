import { z } from "zod";

/** E02. Real NASA data: OSDR study OSD-569 (SpaceX Inspiration4), complete blood count. */
export const NasaCrewId = z.enum(["C001", "C002", "C003", "C004"]);
export type NasaCrewId = z.infer<typeof NasaCrewId>;

export const NasaAnalyte = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  unit: z.string().min(1),
});
export type NasaAnalyte = z.infer<typeof NasaAnalyte>;

export const NasaTimepoint = z.object({
  /** As written in the study, e.g. "L-92" (days before launch) or "R+1" (days after return). */
  label: z.string().min(1),
  relativeDay: z.number().int(),
});
export type NasaTimepoint = z.infer<typeof NasaTimepoint>;

/** Response of GET /api/nasa/osd-569. Public: open NASA data. */
export const NasaCatalog = z.object({
  study: z.literal("OSD-569"),
  title: z.string().min(1),
  url: z.url(),
  citation: z.string().min(1),
  crew: z.array(NasaCrewId).min(1),
  analytes: z.array(NasaAnalyte).min(1),
  timepoints: z.array(NasaTimepoint).min(1),
});
export type NasaCatalog = z.infer<typeof NasaCatalog>;

/** Query of GET /api/nasa/osd-569/trend. The analyte must be one of the catalog keys (checked by the handler). */
export const NasaTrendQuery = z.strictObject({
  crew: NasaCrewId,
  analyte: z.string().regex(/^[a-z0-9_]{1,80}$/),
});
export type NasaTrendQuery = z.infer<typeof NasaTrendQuery>;
