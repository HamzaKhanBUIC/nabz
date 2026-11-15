"use client";

import { createContext, useContext } from "react";

export const DEFAULT_CREW_PROFILE = {
  id: "sara",
  name: "Sara",
  role: "Commander",
  initials: "SC",
};

const SessionContext = createContext({
  isAuthenticated: true,
  hydrated: true,
  profile: DEFAULT_CREW_PROFILE,
});

export function SessionProvider({ children }) {
  return (
    <SessionContext.Provider
      value={{
        isAuthenticated: true,
        hydrated: true,
        profile: DEFAULT_CREW_PROFILE,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
