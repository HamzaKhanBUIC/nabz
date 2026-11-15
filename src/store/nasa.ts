import { readFileSync } from "node:fs";
import path from "node:path";
import { buildTrend, foldHistory, type BaselineEntryInput } from "../core";
import {
  NasaCatalog,
  NasaCrewId,
  type NasaAnalyte,
  type NasaTimepoint,
  type Trend,
} from "../schemas";

export interface NasaAnalyteMeasurement {
  value: number;
  rangeMin: number | null;
  rangeMax: number | null;
  unit: string;
}

export interface NasaSample {
  sampleName: string;
  subjectId: string;
  timepoint: string;
  relativeDay: number;
  effectiveDateTime: string;
  analytes: Record<string, NasaAnalyteMeasurement>;
}

const INSPIRATION4_LAUNCH_DATE = "2021-09-16";

export const UNIT_LABEL_MAP: Record<string, string> = {
  percent: "%",
  cells_per_microliter: "cells/uL",
  picogram: "pg",
  grams_per_deciliter: "g/dL",
  femtoliter: "fL",
  thousand_per_microliter: "10^3/uL",
  million_per_microliter: "10^6/uL",
};

const ANALYTE_ACRONYMS = new Set(["mch", "mchc", "mcv", "mpv", "rdw"]);

function formatAnalyteLabel(key: string): string {
  if (ANALYTE_ACRONYMS.has(key)) {
    return key.toUpperCase();
  }
  const spaced = key.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function parseRelativeDay(timepoint: string): number {
  const match = /^([LR])([+-]?\d+)$/.exec(timepoint);
  if (!match) {
    throw new Error(`Unrecognized NASA OSD-569 timepoint: "${timepoint}"`);
  }
  const phase = match[1]!;
  const num = Number(match[2]!);
  return phase === "L" ? num : num;
}

function isoForRelativeDay(relativeDay: number): string {
  const [yStr, mStr, dStr] = INSPIRATION4_LAUNCH_DATE.split("-");
  const dt = new Date(
    Date.UTC(Number(yStr), Number(mStr) - 1, Number(dStr) + relativeDay),
  );
  return `${dt.toISOString().slice(0, 10)}T08:00:00+00:00`;
}

function parseOptionalNumber(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Parses the unmodified NASA OSDR OSD-569 Inspiration4 complete blood count CSV
 * into chronological per-subject samples with extracted reference ranges.
 */
export function parseOsd569Csv(csvText: string): NasaSample[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length < 2) {
    throw new Error("OSD-569 CSV is empty or missing data rows.");
  }

  const headers = lines[0]!.split(",");
  interface ColumnGroup {
    analyte: string;
    unit: string;
    valueIdx: number;
    minIdx?: number;
    maxIdx?: number;
  }

  const groups = new Map<string, ColumnGroup>();
  for (let idx = 1; idx < headers.length; idx += 1) {
    const col = headers[idx]!;
    const match = /^(.+)_(value|range_min|range_max)_([a-z_]+)$/.exec(col);
    if (!match) continue;
    const analyte = match[1]!;
    const kind = match[2]!;
    const rawUnit = match[3]!;
    const unit = UNIT_LABEL_MAP[rawUnit] ?? rawUnit;

    const existing = groups.get(analyte) ?? { analyte, unit, valueIdx: -1 };
    if (kind === "value") existing.valueIdx = idx;
    if (kind === "range_min") existing.minIdx = idx;
    if (kind === "range_max") existing.maxIdx = idx;
    groups.set(analyte, existing);
  }

  const samples: NasaSample[] = [];
  for (let rowIdx = 1; rowIdx < lines.length; rowIdx += 1) {
    const cells = lines[rowIdx]!.split(",");
    const sampleName = cells[0]!;
    const nameMatch = /^(C\d+)_[^_]+_([LR][+-]?\d+)_cbc$/.exec(sampleName);
    if (!nameMatch) {
      throw new Error(`Unexpected Sample Name format in OSD-569: "${sampleName}"`);
    }
    const subjectId = nameMatch[1]!;
    const timepoint = nameMatch[2]!;
    const relativeDay = parseRelativeDay(timepoint);
    const effectiveDateTime = isoForRelativeDay(relativeDay);

    const analytes: Record<string, NasaAnalyteMeasurement> = {};
    for (const [analyte, grp] of groups.entries()) {
      if (grp.valueIdx < 0) continue;
      const value = parseOptionalNumber(cells[grp.valueIdx]);
      if (value === null) continue;
      analytes[analyte] = {
        value,
        rangeMin: grp.minIdx !== undefined ? parseOptionalNumber(cells[grp.minIdx]) : null,
        rangeMax: grp.maxIdx !== undefined ? parseOptionalNumber(cells[grp.maxIdx]) : null,
        unit: grp.unit,
      };
    }

    samples.push({
      sampleName,
      subjectId,
      timepoint,
      relativeDay,
      effectiveDateTime,
      analytes,
    });
  }

  return samples.sort(
    (a, b) => a.subjectId.localeCompare(b.subjectId) || a.relativeDay - b.relativeDay,
  );
}

/** Reads `data/nasa/LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv` from disk. */
export function loadNasaOsd569Samples(
  nasaDir: string = path.join(process.cwd(), "data", "nasa"),
): NasaSample[] {
  const csvPath = path.join(nasaDir, "LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv");
  return parseOsd569Csv(readFileSync(csvPath, "utf8"));
}

export interface NasaTrendEntry extends BaselineEntryInput {
  timepoint: string;
  measurement: NasaAnalyteMeasurement;
}

/**
 * Runs one OSD-569 crew member's analyte series through `foldHistory` (`minSessions: 3`
 * so the 3 pre-launch samples calibrate the personal baseline) and returns a schema-valid `Trend`.
 */
export function buildNasaBloodTrend(
  samples: readonly NasaSample[],
  subjectId: string,
  analyte: string,
): Trend {
  const subjectSamples = samples
    .filter((s) => s.subjectId === subjectId && s.analytes[analyte] !== undefined)
    .sort((a, b) => a.relativeDay - b.relativeDay);

  if (subjectSamples.length === 0) {
    throw new Error(`No OSD-569 samples found for subject "${subjectId}" and analyte "${analyte}".`);
  }

  const entries: NasaTrendEntry[] = subjectSamples.map((s) => {
    const m = s.analytes[analyte]!;
    return {
      missionDay: s.relativeDay,
      effectiveDateTime: s.effectiveDateTime,
      value: m.value,
      timepoint: s.timepoint,
      measurement: m,
    };
  });

  const folded = foldHistory(entries, {
    direction: "two_sided",
    minSessions: 3,
    windowSessions: 14,
  });

  const first = entries[0]!.measurement;
  const referenceRange =
    first.rangeMin !== null && first.rangeMax !== null
      ? { low: first.rangeMin, high: first.rangeMax }
      : undefined;

  return buildTrend(analyte, folded, undefined, {
    direction: "two_sided",
    unit: first.unit,
    subjectId,
    source: "nasa-osd-569",
    referenceRange,
  });
}

/** Builds the public OSD-569 catalog of crew IDs, analytes, and chronological timepoints. */
export function buildNasaCatalog(samples: readonly NasaSample[]): NasaCatalog {
  const crewSet = new Set<NasaCrewId>();
  const analyteUnits = new Map<string, string>();
  const timepointDays = new Map<string, number>();

  for (const sample of samples) {
    crewSet.add(NasaCrewId.parse(sample.subjectId));
    timepointDays.set(sample.timepoint, sample.relativeDay);
    for (const [key, measurement] of Object.entries(sample.analytes)) {
      if (!analyteUnits.has(key)) {
        analyteUnits.set(key, measurement.unit);
      }
    }
  }

  const crew = [...crewSet].sort((a, b) => a.localeCompare(b));
  const analytes: NasaAnalyte[] = [...analyteUnits.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, unit]) => ({
      key,
      label: formatAnalyteLabel(key),
      unit,
    }));
  const timepoints: NasaTimepoint[] = [...timepointDays.entries()]
    .map(([label, relativeDay]) => ({ label, relativeDay }))
    .sort((a, b) => a.relativeDay - b.relativeDay);

  return NasaCatalog.parse({
    study: "OSD-569",
    title: "SpaceX Inspiration4 crew: complete blood count (whole blood)",
    url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-569",
    citation:
      "NASA Open Science Data Repository, study OSD-569 (SpaceX Inspiration4), file LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv",
    crew,
    analytes,
    timepoints,
  });
}
