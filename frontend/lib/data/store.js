"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import * as api from "@/lib/api";
import { isPublicRoute, useSession } from "@/lib/data/session";

const STORAGE_KEYS = {
  protocol: "crewpulse:cache:protocol",
  bpGuide: "crewpulse:cache:bpGuide",
  routines: "crewpulse:cache:routines",
  hazards: "crewpulse:cache:hazards",
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
  if (typeof window === "undefined" || !key) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeCache(key, value) {
  if (typeof window === "undefined" || !key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

function outboxStorageKey(crewId) {
  return crewId ? `${STORAGE_KEYS.outbox}:${crewId}` : null;
}

function coachStorageKey(crewId) {
  return crewId ? `${STORAGE_KEYS.coachMessages}:${crewId}` : null;
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const pathname = usePathname();
  const { hydrated: sessionHydrated, token, crew } = useSession();

  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);
  const [error, setError] = useState(null);

  const [mission, setMission] = useState(FALLBACK_MISSION);
  const [today, setToday] = useState(null);
  const [protocol, setProtocol] = useState(null);
  const [bpGuide, setBpGuide] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [environment, setEnvironment] = useState(null);
  const [radiation, setRadiation] = useState(null);
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

  const loadedTokenRef = useRef(null);
  const loadedCrewCacheRef = useRef(null);

  const loadTrend = useCallback(async (code, days = 30) => {
    const trend = await api.getTrends(code, days);
    setTrends((prev) => ({ ...prev, [code]: trend }));
    setTrendsByRange((prev) => ({ ...prev, [`${code}:${days}`]: trend }));
    return trend;
  }, []);

  const refreshDynamicState = useCallback(async () => {
    const [
      missionRes,
      todayRes,
      remindersRes,
      environmentRes,
      radiationRes,
      ...trendResults
    ] = await Promise.all([
      api.getMission(),
      api.getToday(),
      api.getReminders().catch(() => null),
      api.getEnvironment().catch(() => null),
      api.getRadiation().catch(() => null),
      ...TREND_CODES.map((code) => api.getTrends(code, 30)),
    ]);

    setMission(missionRes);
    setToday(todayRes);
    if (todayRes?.checkin) setLastCheckinResult(todayRes.checkin);
    if (todayRes?.bp) setLastBpResult(todayRes.bp);
    if (remindersRes) setReminders(remindersRes);
    if (environmentRes) setEnvironment(environmentRes);
    if (radiationRes) setRadiation(radiationRes);

    const nextTrends = {};
    const nextByRange = {};
    TREND_CODES.forEach((code, idx) => {
      if (trendResults[idx]) {
        nextTrends[code] = trendResults[idx];
        nextByRange[`${code}:30`] = trendResults[idx];
      }
    });
    setTrends(nextTrends);
    setTrendsByRange(nextByRange);
    setBackendOnline(true);
    setError(null);
  }, []);

  // Public bootstrap: mission info, protocols, guides, routines, hazards, environment, radiation, emergency procedures.
  useEffect(() => {
    let active = true;

    async function bootstrapPublic() {
      await Promise.resolve();
      if (!active) return;

      const cachedProtocol = readCache(STORAGE_KEYS.protocol, null);
      const cachedBpGuide = readCache(STORAGE_KEYS.bpGuide, null);
      const cachedRoutines = readCache(STORAGE_KEYS.routines, []);
      const cachedHazards = readCache(STORAGE_KEYS.hazards, []);
      const cachedSelf = readCache(STORAGE_KEYS.emergencySelf, []);
      const cachedCrew = readCache(STORAGE_KEYS.emergencyCrewmate, []);
      const cachedEmergencyLog = readCache(STORAGE_KEYS.emergencyLog, []);

      if (cachedProtocol) setProtocol(cachedProtocol);
      if (cachedBpGuide) setBpGuide(cachedBpGuide);
      if (Array.isArray(cachedRoutines)) setRoutines(cachedRoutines);
      if (Array.isArray(cachedHazards)) setHazards(cachedHazards);
      if (Array.isArray(cachedSelf)) setEmergencySelf(cachedSelf);
      if (Array.isArray(cachedCrew)) setEmergencyCrewmate(cachedCrew);
      if (Array.isArray(cachedEmergencyLog)) setEmergencyLog(cachedEmergencyLog);
      setHydrated(true);

      try {
        const [
          missionRes,
          protoRes,
          bpGuideRes,
          routinesRes,
          selfRes,
          crewRes,
          hazardsRes,
          environmentRes,
          radiationRes,
        ] = await Promise.all([
          api.getMission(),
          api.getCheckinProtocol(),
          api.getBpGuide(),
          api.getRoutines().catch(() => ({ routines: [] })),
          api.getEmergencyProcedures("self"),
          api.getEmergencyProcedures("crewmate"),
          api.getHazards().catch(() => null),
          api.getEnvironment().catch(() => null),
          api.getRadiation().catch(() => null),
        ]);
        if (!active) return;

        setMission(missionRes);
        setBackendOnline(true);
        setError(null);

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

        if (Array.isArray(hazardsRes?.hazards)) {
          setHazards(hazardsRes.hazards);
          writeCache(STORAGE_KEYS.hazards, hazardsRes.hazards);
        }
        setEnvironment(environmentRes || null);
        setRadiation(radiationRes || null);
      } catch (err) {
        if (!active) return;
        setBackendOnline(false);
        setError(err?.message || "Unable to reach CrewPulse backend.");
      }
    }

    bootstrapPublic();
    return () => {
      active = false;
    };
  }, []);

  // Per-crew private state: only loaded when authenticated and on a protected route.
  useEffect(() => {
    if (!sessionHydrated) return undefined;
    let active = true;

    async function syncPersonalState() {
      await Promise.resolve();
      if (!active) return;

      if (!token) {
        loadedTokenRef.current = null;
        loadedCrewCacheRef.current = null;
        setToday(null);
        setReminders(null);
        setTrends({});
        setTrendsByRange({});
        setLastCheckinResult(null);
        setLastBpResult(null);
        setCoachMessages([]);
        setOutbox([]);
        setLoading(false);
        return;
      }

      const crewId = crew?.id || "default";
      if (loadedCrewCacheRef.current !== crewId) {
        loadedCrewCacheRef.current = crewId;
        const cachedOutbox = readCache(outboxStorageKey(crewId), []);
        const cachedCoach = readCache(coachStorageKey(crewId), []);
        setOutbox(Array.isArray(cachedOutbox) ? cachedOutbox : []);
        setCoachMessages(Array.isArray(cachedCoach) ? cachedCoach : []);
      }

      if (isPublicRoute(pathname)) {
        setLoading(false);
        return;
      }

      if (loadedTokenRef.current === token) {
        setLoading(false);
        return;
      }

      loadedTokenRef.current = token;
      setToday(null);
      setReminders(null);
      setTrends({});
      setTrendsByRange({});
      setLastCheckinResult(null);
      setLastBpResult(null);
      setLoading(true);

      try {
        await refreshDynamicState();
      } catch (err) {
        if (!active) return;
        setBackendOnline(false);
        setError(err?.message || "Unable to reach CrewPulse backend.");
      } finally {
        if (active) setLoading(false);
      }
    }

    syncPersonalState();
    return () => {
      active = false;
    };
  }, [sessionHydrated, token, crew?.id, pathname, refreshDynamicState]);

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

  const addCoachMessage = useCallback(
    (message) => {
      const crewId = crew?.id || "default";
      setCoachMessages((prev) => {
        const next = [...prev, message];
        writeCache(coachStorageKey(crewId), next);
        return next;
      });
    },
    [crew?.id],
  );

  const clearCoachMessages = useCallback(() => {
    const crewId = crew?.id || "default";
    setCoachMessages([]);
    writeCache(coachStorageKey(crewId), []);
  }, [crew?.id]);

  const previewShare = useCallback(async (payload) => {
    return api.previewShare(payload);
  }, []);

  const sendShare = useCallback(
    async (payload) => {
      const queued = await api.sendShare(payload);
      const crewId = crew?.id || "default";
      setOutbox((prev) => {
        const next = [queued, ...prev];
        writeCache(outboxStorageKey(crewId), next);
        return next;
      });
      return queued;
    },
    [crew?.id],
  );

  const saveReminders = useCallback(async (schedule) => {
    const updated = await api.updateReminders(schedule);
    setReminders(updated);
    const todayRes = await api.getToday().catch(() => null);
    if (todayRes) setToday(todayRes);
    return updated;
  }, []);

  const refreshHazards = useCallback(async () => {
    const res = await api.getHazards();
    const list = Array.isArray(res?.hazards) ? res.hazards : [];
    setHazards(list);
    writeCache(STORAGE_KEYS.hazards, list);
    return list;
  }, []);

  const refreshEnvironment = useCallback(async () => {
    const res = await api.getEnvironment();
    setEnvironment(res);
    return res;
  }, []);

  const refreshRadiation = useCallback(async () => {
    const res = await api.getRadiation();
    setRadiation(res);
    return res;
  }, []);

  const switchEnvironment = useCallback(
    async (id) => {
      const updated = await api.setEnvironment(id);
      setEnvironment(updated);
      const [missionRes, radiationRes, todayRes] = await Promise.all([
        api.getMission().catch(() => null),
        api.getRadiation().catch(() => null),
        token ? api.getToday().catch(() => null) : Promise.resolve(null),
      ]);
      if (missionRes) setMission(missionRes);
      if (radiationRes) setRadiation(radiationRes);
      if (todayRes) {
        setToday(todayRes);
        if (todayRes.checkin) setLastCheckinResult(todayRes.checkin);
        if (todayRes.bp) setLastBpResult(todayRes.bp);
      }
      return updated;
    },
    [token],
  );

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
      hazards,
      environment,
      radiation,
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
      refreshHazards,
      refreshEnvironment,
      refreshRadiation,
      switchEnvironment,
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
      hazards,
      environment,
      radiation,
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
      refreshHazards,
      refreshEnvironment,
      refreshRadiation,
      switchEnvironment,
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
