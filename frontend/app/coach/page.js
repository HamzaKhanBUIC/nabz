"use client";

import BackLink from "@/components/ui/BackLink";
import ChatInterface from "@/components/coach/ChatInterface";

export default function CoachPage() {
  return (
    <div className="flex min-h-[calc(100dvh-10rem)] flex-col gap-6">
      <BackLink href="/">Today</BackLink>

      <div>
        <h1 className="t-h1 mt-1 text-primary">Coach</h1>
        <p className="mt-1 text-sm text-secondary">
          Works offline on this device. Uses your check-ins, not the internet.
        </p>
      </div>

      <ChatInterface />
    </div>
  );
}
