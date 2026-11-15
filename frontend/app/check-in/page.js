"use client";

/**
 * ROUTE `/check-in` — the daily check-in flow.
 *   02 Get ready → 03 Test (3 rounds) → 04 / 04b Result
 *
 * Recent check-ins live with the rest of the recorded history on the
 * Normal Zone screen.
 */

import PageTransition from "@/components/ui/PageTransition";
import CheckInFlow from "@/components/check-in/CheckInFlow";

export default function CheckInPage() {
  return (
    <PageTransition>
      <CheckInFlow />
    </PageTransition>
  );
}
