"use client";

/**
 * SCREEN 01 — Today dashboard.
 *
 * left  : Display greeting + last check-in line, feeling chips, primary and
 *         secondary actions.
 * right : Normal zone widget (560) + latest action card (560).
 *
 * Below the specified content sits a small secondary strip that keeps the
 * legacy screens (Normal Zone, Coach, Send to Earth) reachable without adding
 * sidebar tabs, plus the explicit demo-data control.
 */

import { useMemo } from "react";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { Card, CardBody, CardEyebrow } from "@/components/ui/Card";
import NormalZoneWidget from "@/components/dashboard/NormalZoneWidget";
import FeelingChips, { feelingById } from "@/components/dashboard/FeelingChips";
import DemoDataNotice from "@/components/ui/DemoDataNotice";
import { useStore } from "@/lib/data/store";
import { useSession } from "@/lib/data/session";
import { classifyValue } from "@/lib/utils/health";
import { getBaseline } from "@/lib/data/selectors";
import { useClientTime } from "@/lib/hooks/useClientTime";
import { formatDateTime, formatTime } from "@/lib/utils/format";

function greetingFor(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function dayWord(timestamp, now) {
  const then = new Date(timestamp);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThat = new Date(
    then.getFullYear(),
    then.getMonth(),
    then.getDate()
  );
  const days = Math.round((startOfToday - startOfThat) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return then.toLocaleDateString([], { day: "numeric", month: "short" });
}

function LatestActionCard() {
  const store = useStore();

  const latest = useMemo(() => {
    const all = [...store.checkIns].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    return all[0] || null;
  }, [store.checkIns]);

  const baseline = useMemo(
    () => getBaseline("reaction", store),
    [store]
  );

  let title = "Nothing to act on";
  let body = "Your last check-in was inside your normal. Keep your routine.";

  if (!latest) {
    title = "Nothing to act on";
    body = "Your last check-in was inside your normal. Keep your routine.";
  } else if (latest.reactionTimeMs == null || !baseline) {
    title = "Nothing to act on";
    body = "Complete a check-in to compare today against your own normal.";
  } else if (classifyValue(latest.reactionTimeMs, baseline) === "in-range") {
    title = "Nothing to act on";
    body = "Your last check-in was inside your normal. Keep your routine.";
  } else {
    title = "Act today";
    body =
      "Your last check-in was outside your normal. Review what changed before you start the day.";
  }

  return (
    <Card className="min-h-[140px]">
      <CardBody className="flex h-full flex-col justify-center">
        <CardEyebrow>Latest action card</CardEyebrow>
        <h2 className="mt-2 t-h2 text-primary">{title}</h2>
        <p className="mt-2 t-body-md text-secondary">{body}</p>
      </CardBody>
    </Card>
  );
}

function SecondaryStrip() {
  const links = [
    { href: "/normal-zone", label: "Normal Zone", icon: "monitoring" },
    { href: "/coach", label: "Coach", icon: "smart_toy" },
    { href: "/send-to-earth", label: "Send to Earth", icon: "send" },
  ];

  return (
    <div className="flex flex-col gap-4 border-t border-line pt-6">
      <nav aria-label="More" className="flex flex-wrap items-center gap-2">
        <span className="mr-1 t-caption uppercase tracking-[0.14em] text-muted">
          More
        </span>
        {links.map((link) => (
          <Button
            key={link.href}
            href={link.href}
            variant="ghost"
            size="md"
            icon={link.icon}
          >
            {link.label}
          </Button>
        ))}
      </nav>
      <DemoDataNotice />
    </div>
  );
}

export default function TodayDashboard() {
  const store = useStore();
  const { profile } = useSession();
  const now = useClientTime();

  const firstName = (profile?.name || "Sara").split(" ")[0];

  const lastCheckIn = useMemo(
    () =>
      [...store.checkIns].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      )[0] || null,
    [store.checkIns]
  );

  const greeting = now ? greetingFor(now.getHours()) : "Good morning";

  let subtitle = "No check-in recorded yet.";
  if (lastCheckIn) {
    subtitle = now
      ? `Your last check-in was ${dayWord(lastCheckIn.timestamp, now)} at ${formatTime(lastCheckIn.timestamp)}.`
      : `Last check-in ${formatDateTime(lastCheckIn.timestamp)}.`;
  }

  // The answer is stored as a quick mood tap and picked up by the next
  // check-in (screen 04 shows it back as "You said you feel …").
  const latestMood = store.moodLogs[0] || null;
  const selectedFeeling =
    latestMood && latestMood.feeling ? latestMood.feeling : null;

  const handleFeeling = (feelingId) => {
    const feeling = feelingById(feelingId);
    if (!feeling) return;
    store.addMoodLog({
      mood: feeling.mood,
      feeling: feeling.id,
      label: feeling.label,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
        {/* Left column */}
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-col gap-2">
            <h1 className="t-display text-primary">
              {greeting}, {firstName}.
            </h1>
            <p className="t-body-md text-muted">{subtitle}</p>
          </div>

          <h2 className="mt-8 t-h3 text-primary">How do you feel today?</h2>
          <FeelingChips
            className="mt-5"
            value={selectedFeeling}
            onChange={handleFeeling}
          />

          <div className="mt-8 flex flex-col gap-3">
            <Button href="/check-in" variant="primary" size="lg" arrow className="w-full sm:w-auto">
              Start check-in
            </Button>
            <p className="t-body-sm text-muted">
              3 short rounds · about 2 minutes
            </p>
          </div>

          <Button
            href="/measure"
            variant="secondary"
            size="lg"
            className="mt-8 w-full sm:w-auto"
          >
            Take a measurement
          </Button>
        </div>

        {/* Right column */}
        <div className="flex min-w-0 flex-col gap-6">
          <NormalZoneWidget />
          <LatestActionCard />
        </div>
      </div>

      <SecondaryStrip />
    </div>
  );
}
