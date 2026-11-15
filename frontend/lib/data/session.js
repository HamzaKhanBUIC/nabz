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
import { usePathname, useRouter } from "next/navigation";
import * as api from "@/lib/api";

export const MEDICAL_OFFICER_ROLE = "Medical officer";

export const PUBLIC_ROUTES = ["/emergency", "/real-data", "/hazards", "/sign-in", "/welcome"];

export function isPublicRoute(pathname) {
  if (!pathname) return false;
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isMedicalOfficer(crew) {
  return crew?.role === MEDICAL_OFFICER_ROLE;
}

export function getCrewInitials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const SessionContext = createContext({
  hydrated: false,
  isAuthenticated: false,
  isMedicalOfficer: false,
  token: null,
  crew: null,
  expiresAt: null,
  signIn: async () => {},
  signOut: async () => {},
  switchCrewMember: async () => {},
});

export function SessionProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const [hydrated, setHydrated] = useState(false);
  const [token, setTokenState] = useState(null);
  const [crew, setCrewState] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);

  useEffect(() => {
    const unregisterUnauthorized = api.setUnauthorizedHandler(() => {
      router.replace("/sign-in");
    });
    const unsubscribeChange = api.subscribeSessionChange(() => {
      setTokenState(api.getToken());
      setCrewState(api.getStoredCrew());
    });

    return () => {
      unregisterUnauthorized();
      unsubscribeChange();
    };
  }, [router]);

  useEffect(() => {
    let active = true;

    async function hydrateSession() {
      await Promise.resolve();
      if (!active) return;

      const initialToken = api.getToken();
      const initialCrew = api.getStoredCrew();
      setTokenState(initialToken);
      setCrewState(initialCrew);
      setHydrated(true);

      if (!initialToken) return;

      try {
        const info = await api.getSession({
          handleNoSession: !isPublicRoute(pathnameRef.current),
        });
        if (!active) return;
        if (info?.crew) {
          setCrewState(info.crew);
        }
        if (info?.expiresAt) {
          setExpiresAt(info.expiresAt);
        }
      } catch (err) {
        if (!active) return;
        if (err?.status === 401 && err?.code === "no_session") {
          api.clearToken();
          setTokenState(null);
          setCrewState(null);
          setExpiresAt(null);
        }
      }
    }

    hydrateSession();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (crewId, code) => {
    const res = await api.signIn(crewId, code);
    setTokenState(res.token);
    setCrewState(res.crew);
    setExpiresAt(res.expiresAt || null);
    return res;
  }, []);

  const signOut = useCallback(async () => {
    await api.signOut();
    setTokenState(null);
    setCrewState(null);
    setExpiresAt(null);
  }, []);

  const switchCrewMember = useCallback(async () => {
    await signOut();
    router.push("/sign-in");
  }, [signOut, router]);

  const value = useMemo(
    () => ({
      hydrated,
      isAuthenticated: Boolean(token),
      isMedicalOfficer: isMedicalOfficer(crew),
      token,
      crew,
      expiresAt,
      signIn,
      signOut,
      switchCrewMember,
    }),
    [hydrated, token, crew, expiresAt, signIn, signOut, switchCrewMember],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
