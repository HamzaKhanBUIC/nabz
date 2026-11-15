"use client";

/**
 * ROUTE `/profile` — SCREEN 14 · Profile.
 *
 * Reachable from the sidebar user row on every screen. Reads the signed-in
 * crew member from `lib/data/session`; edits made on screen 15 persist in
 * localStorage. Values come from the session + mission config, never from
 * fabricated health data.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/ui/PageTransition";
import Button from "@/components/ui/Button";
import { Card, CardEyebrow } from "@/components/ui/Card";
import { useSession } from "@/lib/data/session";
import { useClientTime } from "@/lib/hooks/useClientTime";
import { getMissionDay, mission } from "@/lib/data/mission";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, isAuthenticated, hydrated, signOut } = useSession();
  const now = useClientTime();

  // The profile is only meaningful for a signed-in crew member.
  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace("/");
  }, [hydrated, isAuthenticated, router]);

  if (!profile) return null;

  const missionDay = now ? getMissionDay(now) : null;

  const infoRows = [
    ["Full name", profile.fullName],
    ["Role", profile.role],
    ["Age", String(profile.age)],
    [
      "Mission",
      missionDay !== null
        ? `${mission.name} · day ${missionDay}`
        : `${mission.name} · day —`,
    ],
    ["Dominant hand", `${profile.dominantHand} (used for the reaction test)`],
    ["Crew ID", profile.crewId],
  ];

  function handleSignOut() {
    signOut();
    router.push("/");
  }

  return (
    <PageTransition>
      <h1 className="t-h1 text-primary">Profile</h1>
      <p className="mt-2 t-body-md text-muted">
        Your basic info. It helps set your personal normal zone.
      </p>

      <div className="mt-9 grid gap-8 lg:grid-cols-[420px_652px]">
        <Card className="p-6">
          <CardEyebrow>Crew member</CardEyebrow>
          <h2 className="mt-3 t-h2 text-primary">{profile.fullName}</h2>
          <p className="mt-2 t-body-md text-muted">
            {profile.role} · Nova crew · signed in on this device
          </p>
        </Card>

        <dl className="flex flex-col">
          {infoRows.map(([label, value]) => (
            <div
              key={label}
              className="flex flex-col gap-1 border-b border-line py-4 sm:flex-row sm:items-center sm:gap-0"
            >
              <dt className="text-base text-muted sm:w-[224px] sm:shrink-0">
                {label}
              </dt>
              <dd className="text-base font-medium text-primary">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Button size="lg" href="/profile/edit">
          Edit profile
        </Button>
        <Button variant="secondary" size="lg" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </PageTransition>
  );
}
