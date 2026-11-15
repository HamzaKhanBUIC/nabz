"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as api from "@/lib/api";

const STORAGE_KEYS = {
  protocol: "crewpulse:cache:protocol",
  bpGuide: "crewpulse:cache:bpGuide",
  routines: "crewpulse:cache:routines",
  emergencySelf: "crewpulse:cache:emergency:self",
  emergencyCrewmate: "crewpulse:cache:emergency:crewmate",
  outbox: "crewpulse:outbox",
  emergencyLog: "crewpulse:emergencyLog",
  coachMessages: "crewpulse:coachMessages",
};

const TREND_CODES = [
  "reaction-speed",
  "sleep-hours",
  "bp-systolic",
  "bp-diastolic",
];

const FALLBACK_MISSION = {
  name: "Mars Transit Sim",
  profile: "mars-transit",
  launchDate: "2026-10-01",
  missionDay: 1,
  commsDelay: { oneWayMinMinutes: 3, oneWayMaxMinutes: 22 },
  crew: [{ id: "sara", name: "Sara", role: "Commander" }],
};

function readCache(key, fallback = null) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeCache(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);
  const [error, setError] = useState(null);

  const [mission, setMission] = useState(FALLBACK_MISSION);
  const [today, setToday] = useState(null);
  const [protocol, setProtocol] = useState(null);
  const [bpGuide, setBpGuide] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [reminders, setReminders] = useState(null);
  const [emergencySelf, setEmergencySelf] = useState([]);
  const [emergencyCrewmate, setEmergencyCrewmate] = useState([]);
  const [trends, setTrends] = useState({});
  const [trendsByRange, setTrendsByRange] = useState({});

  const [lastCheckinResult, setLastCheckinResult] = useState(null);
  const [lastBpResult, setLastBpResult] = useState(null);
  const [coachMessages, setCoachMessages] = useState([]);
  const [outbox, setOutbox] = useState([]);
  const [emergencyLog, setEmergencyLog] = useState([]);

  const loadTrend = useCallback(async (code, days = 30) => {
    const trend = await api.getTrends(code, days);
    setTrends((prev) => ({ ...prev, [code]: trend }));
    setTrendsByRange((prev) => ({ ...prev, [`${code}:${days}`]: trend }));
    return trend;
  }, []);

  const refreshDynamicState = useCallback(async () => {
    const [missionRes, todayRes, remindersRes, ...trendResults] =
      await Promise.all([
        api.getMission(),
        api.getToday(),
        api.getReminders().catch(() => null),
        ...TREND_CODES.map((code) => api.getTrends(code, 30)),
      ]);

    setMission(missionRes);
    setToday(todayRes);
    if (todayRes?.checkin) setLastCheckinResult(todayRes.checkin);
    if (todayRes?.bp) setLastBpResult(todayRes.bp);
    if (remindersRes) setReminders(remindersRes);

    const nextTrends = {};
    const nextByRange = {};
    TREND_CODES.forEach((code, idx) => {
      if (trendResults[idx]) {
        nextTrends[code] = trendResults[idx];
        nextByRange[`${code}:30`] = trendResults[idx];
      }
    });
    setTrends((prev) => ({ ...prev, ...nextTrends }));
    setTrendsByRange((prev) => ({ ...prev, ...nextByRange }));
    setBackendOnline(true);
    setError(null);
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      await Promise.resolve();
      if (!active) return;

      const cachedProtocol = readCache(STORAGE_KEYS.protocol, null);
      const cachedBpGuide = readCache(STORAGE_KEYS.bpGuide, null);
      const cachedRoutines = readCache(STORAGE_KEYS.routines, []);
      const cachedSelf = readCache(STORAGE_KEYS.emergencySelf, []);
      const cachedCrew = readCache(STORAGE_KEYS.emergencyCrewmate, []);
      const cachedOutbox = readCache(STORAGE_KEYS.outbox, []);
      const cachedEmergencyLog = readCache(STORAGE_KEYS.emergencyLog, []);
      const cachedCoach = readCache(STORAGE_KEYS.coachMessages, []);

      if (cachedProtocol) setProtocol(cachedProtocol);
      if (cachedBpGuide) setBpGuide(cachedBpGuide);
      if (Array.isArray(cachedRoutines)) setRoutines(cachedRoutines);
      if (Array.isArray(cachedSelf)) setEmergencySelf(cachedSelf);
      if (Array.isArray(cachedCrew)) setEmergencyCrewmate(cachedCrew);
      if (Array.isArray(cachedOutbox)) setOutbox(cachedOutbox);
      if (Array.isArray(cachedEmergencyLog)) setEmergencyLog(cachedEmergencyLog);
      if (Array.isArray(cachedCoach)) setCoachMessages(cachedCoach);
      setHydrated(true);

      try {
        await refreshDynamicState();
        const [protoRes, bpGuideRes, routinesRes, selfRes, crewRes] =
          await Promise.all([
            api.getCheckinProtocol(),
            api.getBpGuide(),
            api.getRoutines().catch(() => ({ routines: [] })),
            api.getEmergencyProcedures("self"),
            api.getEmergencyProcedures("crewmate"),
          ]);
        if (!active) return;

        setProtocol(protoRes);
        writeCache(STORAGE_KEYS.protocol, protoRes);

        setBpGuide(bpGuideRes);
        writeCache(STORAGE_KEYS.bpGuide, bpGuideRes);

        const routineList = routinesRes?.routines || [];
        setRoutines(routineList);
        writeCache(STORAGE_KEYS.routines, routineList);

        const selfList = selfRes?.procedures || [];
        setEmergencySelf(selfList);
        writeCache(STORAGE_KEYS.emergencySelf, selfList);

        const crewList = crewRes?.procedures || [];
        setEmergencyCrewmate(crewList);
        writeCache(STORAGE_KEYS.emergencyCrewmate, crewList);
      } catch (err) {
        if (!active) return;
        setBackendOnline(false);
        setError(err?.message || "Unable to reach CrewPulse backend.");
      } finally {
        if (active) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, [refreshDynamicState]);

  const submitCheckin = useCallback(
    async (payload) => {
      const result = await api.submitCheckin(payload);
      setLastCheckinResult(result);
      await refreshDynamicState();
      return result;
    },
    [refreshDynamicState],
  );

  const submitBpMeasurement = useCallback(
    async (payload) => {
      const result = await api.submitBpMeasurement(payload);
      setLastBpResult(result);
      await refreshDynamicState();
      return result;
    },
    [refreshDynamicState],
  );

  const askCoach = useCallback(async ({ question, cardId }) => {
    return api.askCoach({ question, cardId });
  }, []);

  const addCoachMessage = useCallback((message) => {
    setCoachMessages((prev) => {
      const next = [...prev, message];
      writeCache(STORAGE_KEYS.coachMessages, next);
      return next;
    });
  }, []);

  const clearCoachMessages = useCallback(() => {
    setCoachMessages([]);
    writeCache(STORAGE_KEYS.coachMessages, []);
  }, []);

  const previewShare = useCallback(async (payload) => {
    return api.previewShare(payload);
  }, []);

  const sendShare = useCallback(async (payload) => {
    const queued = await api.sendShare(payload);
    setOutbox((prev) => {
      const next = [queued, ...prev];
      writeCache(STORAGE_KEYS.outbox, next);
      return next;
    });
    return queued;
  }, []);

  const saveReminders = useCallback(async (schedule) => {
    const updated = await api.updateReminders(schedule);
    setReminders(updated);
    const todayRes = await api.getToday().catch(() => null);
    if (todayRes) setToday(todayRes);
    return updated;
  }, []);

  const recordEmergencyAlert = useCallback((entry) => {
    setEmergencyLog((prev) => {
      const next = [entry, ...prev];
      writeCache(STORAGE_KEYS.emergencyLog, next);
      return next;
    });
  }, []);

  const routinesById = useMemo(() => {
    const map = {};
    for (const r of routines) {
      map[r.id] = r;
    }
    return map;
  }, [routines]);

  const value = useMemo(
    () => ({
      hydrated,
      loading,
      backendOnline,
      error,
      mission,
      today,
      protocol,
      bpGuide,
      routines,
      routinesById,
      reminders,
      emergencySelf,
      emergencyCrewmate,
      trends,
      trendsByRange,
      lastCheckinResult,
      lastBpResult,
      coachMessages,
      outbox,
      emergencyLog,
      refreshAll: refreshDynamicState,
      loadTrend,
      submitCheckin,
      submitBpMeasurement,
      askCoach,
      addCoachMessage,
      clearCoachMessages,
      previewShare,
      sendShare,
      saveReminders,
      recordEmergencyAlert,
    }),
    [
      hydrated,
      loading,
      backendOnline,
      error,
      mission,
      today,
      protocol,
      bpGuide,
      routines,
      routinesById,
      reminders,
      emergencySelf,
      emergencyCrewmate,
      trends,
      trendsByRange,
      lastCheckinResult,
      lastBpResult,
      coachMessages,
      outbox,
      emergencyLog,
      refreshDynamicState,
      loadTrend,
      submitCheckin,
      submitBpMeasurement,
      askCoach,
      addCoachMessage,
      clearCoachMessages,
      previewShare,
      sendShare,
      saveReminders,
      recordEmergencyAlert,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used inside <StoreProvider>");
  }
  return ctx;
}
