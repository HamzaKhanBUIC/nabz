"use client";

/**
 * Crew session (frontend-only).
 *
 * The device is shared by the crew, so the app opens on screen 00 "Who is
 * checking in?" until someone picks a profile and enters the offline 4-digit
 * crew PIN. There is no server: the session and any profile edits live in
 * localStorage under `crewpulse:session`.
 *
 * This module is the seam a real identity service will plug into later —
 * components only ever call `signIn` / `signOut` / `updateProfile`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "crewpulse:session";

/** Profiles offered on screen 00 (handoff: name / role / initials). */
export const CREW_PROFILES = [
  { id: "sara", name: "Sara Khan", role: "Commander", initials: "SK" },
  { id: "leo", name: "Leo Martin", role: "Flight engineer", initials: "LM" },
  { id: "aiko", name: "Aiko Tanaka", role: "Medical officer", initials: "AT" },
];

/**
 * Editable details behind screens 14 / 15.
 * Sara Khan's values are the ones specified in the handoff; the other two
 * crew members only have name/role/initials defined there, so their remaining
 * fields are plain configuration in this file.
 */
export const DEFAULT_PROFILE_DETAILS = {
  sara: {
    fullName: "Sara Khan",
    role: "Commander",
    age: 41,
    dominantHand: "Right",
    crewId: "NT-03",
  },
  leo: {
    fullName: "Leo Martin",
    role: "Flight engineer",
    age: 36,
    dominantHand: "Right",
    crewId: "NT-01",
  },
  aiko: {
    fullName: "Aiko Tanaka",
    role: "Medical officer",
    age: 38,
    dominantHand: "Left",
    crewId: "NT-02",
  },
};

export const PIN_LENGTH = 4;

const EMPTY_SESSION = { activeId: null, details: {} };

const SessionContext = createContext(null);

function readStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(EMPTY_SESSION);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate after mount so the server and the first client render agree.
  // Reading localStorage is only possible in the browser, so this is the one
  // place where React state is seeded from that external store.
  useEffect(() => {
    const stored = readStored();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage can only be read on the client; seeding here keeps SSR and the first client render identical.
    if (stored) setSession({ ...EMPTY_SESSION, ...stored });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Storage unavailable — the session still works in memory.
    }
  }, [session, hydrated]);

  const signIn = useCallback((profileId) => {
    setSession((prev) => ({ ...prev, activeId: profileId }));
  }, []);

  const signOut = useCallback(() => {
    setSession((prev) => ({ ...EMPTY_SESSION, details: prev.details }));
  }, []);

  /** Merge edits from screen 15 for the active profile. */
  const updateProfile = useCallback((patch) => {
    setSession((prev) => {
      if (!prev.activeId) return prev;
      return {
        ...prev,
        details: {
          ...prev.details,
          [prev.activeId]: {
            ...(prev.details[prev.activeId] || {}),
            ...patch,
          },
        },
      };
    });
  }, []);

  const value = useMemo(() => {
    const meta = CREW_PROFILES.find((p) => p.id === session.activeId) || null;
    const profile = meta
      ? {
          ...meta,
          ...DEFAULT_PROFILE_DETAILS[meta.id],
          ...(session.details[meta.id] || {}),
          initials: meta.initials,
        }
      : null;

    return {
      hydrated,
      isAuthenticated: Boolean(meta),
      profile,
      profiles: CREW_PROFILES,
      signIn,
      signOut,
      updateProfile,
    };
  }, [session, hydrated, signIn, signOut, updateProfile]);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within <SessionProvider>");
  return ctx;
}
