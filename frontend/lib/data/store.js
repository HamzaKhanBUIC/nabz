"use client";

/**
 * Central client-side data store.
 *
 * Responsibilities:
 * - Hold all recorded health data (check-ins, measurements, mood logs,
 *   emergency logs, reports, coach history).
 * - Persist to localStorage for frontend demo persistence.
 * - Keep mock/demo data clearly separated from user-recorded data via the
 *   `source` field ("recorded" vs "demo").
 *
 * This module is the single service layer the UI talks to, so backend APIs
 * can replace these actions later without touching components.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { makeId } from "@/lib/utils/format";
import { buildDemoDataset } from "@/lib/data/demo";

const STORAGE_KEY = "crewpulse:v1";

const EMPTY_STATE = {
  /** Full check-ins: reaction time, sleep, mood. */
  checkIns: [],
  /** Quick mood taps from the Today dashboard. */
  moodLogs: [],
  /** Blood pressure measurements. */
  measurements: [],
  /** Emergency events and their logged timeline. */
  emergencyLogs: [],
  /** Health summaries shared (or queued) with Earth. */
  reports: [],
  /** AI Health Coach conversation history. */
  coachMessages: [],
  hydrated: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return { ...EMPTY_STATE, ...action.payload, hydrated: true };

    case "ADD_CHECKIN":
      return { ...state, checkIns: [action.payload, ...state.checkIns] };

    case "ADD_MOOD":
      return { ...state, moodLogs: [action.payload, ...state.moodLogs] };

    case "ADD_MEASUREMENT":
      return { ...state, measurements: [action.payload, ...state.measurements] };

    case "ADD_EMERGENCY":
      return { ...state, emergencyLogs: [action.payload, ...state.emergencyLogs] };

    case "UPDATE_EMERGENCY":
      return {
        ...state,
        emergencyLogs: state.emergencyLogs.map((log) =>
          log.id === action.payload.id
            ? { ...log, ...action.payload.patch }
            : log
        ),
      };

    case "ADD_REPORT":
      return { ...state, reports: [action.payload, ...state.reports] };

    case "UPDATE_REPORT":
      return {
        ...state,
        reports: state.reports.map((report) =>
          report.id === action.payload.id
            ? { ...report, ...action.payload.patch }
            : report
        ),
      };

    case "ADD_COACH_MESSAGE":
      return { ...state, coachMessages: [...state.coachMessages, action.payload] };

    case "RESET_COACH":
      return { ...state, coachMessages: [] };

    case "LOAD_DEMO":
      // Demo records are merged in and flagged with source: "demo".
      return {
        ...state,
        checkIns: [...action.payload.checkIns, ...state.checkIns],
        moodLogs: [...action.payload.moodLogs, ...state.moodLogs],
        measurements: [...action.payload.measurements, ...state.measurements],
      };

    case "REMOVE_DEMO": {
      const notDemo = (record) => record.source !== "demo";
      return {
        ...state,
        checkIns: state.checkIns.filter(notDemo),
        moodLogs: state.moodLogs.filter(notDemo),
        measurements: state.measurements.filter(notDemo),
      };
    }

    case "CLEAR_ALL":
      return { ...EMPTY_STATE, hydrated: true };

    default:
      return state;
  }
}

const StoreContext = createContext(null);

function readStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);

  // Hydrate from localStorage after mount (avoids SSR/client mismatch).
  useEffect(() => {
    const stored = readStorage();
    dispatch({ type: "HYDRATE", payload: stored || {} });
  }, []);

  // Persist on every change once hydrated.
  useEffect(() => {
    if (!state.hydrated) return;
    const { hydrated, ...persisted } = state;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      // Storage full or unavailable — the app still works in-memory.
    }
  }, [state]);

  const addCheckIn = useCallback((record) => {
    dispatch({
      type: "ADD_CHECKIN",
      payload: {
        id: makeId("chk"),
        timestamp: record.timestamp || new Date().toISOString(),
        source: "recorded",
        ...record,
      },
    });
  }, []);

  const addMoodLog = useCallback((record) => {
    dispatch({
      type: "ADD_MOOD",
      payload: {
        id: makeId("mood"),
        timestamp: record.timestamp || new Date().toISOString(),
        source: "recorded",
        ...record,
      },
    });
  }, []);

  const addMeasurement = useCallback((record) => {
    dispatch({
      type: "ADD_MEASUREMENT",
      payload: {
        id: makeId("bp"),
        timestamp: record.timestamp || new Date().toISOString(),
        source: "recorded",
        ...record,
      },
    });
  }, []);

  const addEmergencyLog = useCallback((record) => {
    dispatch({
      type: "ADD_EMERGENCY",
      payload: {
        id: makeId("emg"),
        timestamp: record.timestamp || new Date().toISOString(),
        source: "recorded",
        events: [],
        ...record,
      },
    });
  }, []);

  const updateEmergencyLog = useCallback((id, patch) => {
    dispatch({ type: "UPDATE_EMERGENCY", payload: { id, patch } });
  }, []);

  const addReport = useCallback((record) => {
    dispatch({
      type: "ADD_REPORT",
      payload: {
        id: makeId("rep"),
        timestamp: record.timestamp || new Date().toISOString(),
        source: "recorded",
        ...record,
      },
    });
  }, []);

  const updateReport = useCallback((id, patch) => {
    dispatch({ type: "UPDATE_REPORT", payload: { id, patch } });
  }, []);

  const addCoachMessage = useCallback((record) => {
    dispatch({
      type: "ADD_COACH_MESSAGE",
      payload: {
        id: makeId("msg"),
        timestamp: record.timestamp || new Date().toISOString(),
        ...record,
      },
    });
  }, []);

  const resetCoachMessages = useCallback(() => dispatch({ type: "RESET_COACH" }), []);

  /** Explicit user action: merge in the clearly-labelled demo dataset. */
  const loadDemoData = useCallback(() => {
    dispatch({ type: "LOAD_DEMO", payload: buildDemoDataset() });
  }, []);

  const removeDemoData = useCallback(() => dispatch({ type: "REMOVE_DEMO" }), []);

  const clearAllData = useCallback(() => dispatch({ type: "CLEAR_ALL" }), []);

  const value = useMemo(
    () => ({
      hydrated: state.hydrated,
      checkIns: state.checkIns,
      moodLogs: state.moodLogs,
      measurements: state.measurements,
      emergencyLogs: state.emergencyLogs,
      reports: state.reports,
      coachMessages: state.coachMessages,
      addCheckIn,
      addMoodLog,
      addMeasurement,
      addEmergencyLog,
      updateEmergencyLog,
      addReport,
      updateReport,
      addCoachMessage,
      resetCoachMessages,
      loadDemoData,
      removeDemoData,
      clearAllData,
      hasDemoData:
        state.checkIns.some((r) => r.source === "demo") ||
        state.measurements.some((r) => r.source === "demo"),
    }),
    [
      state,
      addCheckIn,
      addMoodLog,
      addMeasurement,
      addEmergencyLog,
      updateEmergencyLog,
      addReport,
      updateReport,
      addCoachMessage,
      resetCoachMessages,
      loadDemoData,
      removeDemoData,
      clearAllData,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within <StoreProvider>");
  }
  return ctx;
}
