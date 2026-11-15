"use client";

/**
 * ROUTE `/measure/blood-pressure`
 *
 * Screen 06 — the four-step blood pressure stepper (and the same stepper
 * pattern for the other measurement items via `?metric=`).
 */

import PageTransition from "@/components/ui/PageTransition";
import MeasurementFlow from "@/components/measure/MeasurementFlow";

export default function BloodPressurePage() {
  return (
    <PageTransition>
      <MeasurementFlow />
    </PageTransition>
  );
}
