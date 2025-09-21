import React from "react";
import type { Orchestrator } from "../../lib/Orchestrator";
import { useOrchestratorStore } from "../../lib/Orchestrator";

interface BreakpointStepperButtonsProps {
  orchestrator: Orchestrator;
  enabled: boolean;
}

export default function BreakpointStepperButtons({ orchestrator, enabled }: BreakpointStepperButtonsProps) {
  const { currentTest, breakpoints } = useOrchestratorStore(orchestrator);

  // Don't render if no breakpoints or no current test
  if (!currentTest || breakpoints.length === 0) {
    return null;
  }

  // Get prev/next breakpoint frames directly from the store
  const prevBreakpointFrame = currentTest.prevBreakpointFrame;
  const nextBreakpointFrame = currentTest.nextBreakpointFrame;

  return (
    <div data-ci="breakpoint-stepper-buttons" className="breakpoint-stepper-buttons flex gap-1">
      <button
        disabled={!enabled || !prevBreakpointFrame}
        onClick={() => handleGoToPrevBreakpoint(orchestrator, prevBreakpointFrame)}
        className="p-1 border rounded bg-orange text-white disabled:opacity-50"
        aria-label="Previous breakpoint"
      >
        ⟵
      </button>
      <button
        disabled={!enabled || !nextBreakpointFrame}
        onClick={() => handleGoToNextBreakpoint(orchestrator, nextBreakpointFrame)}
        className="p-1 border rounded bg-orange text-white disabled:opacity-50"
        aria-label="Next breakpoint"
      >
        ⟶
      </button>
    </div>
  );
}

/* **************** */
/* EVENT HANDLERS */
/* **************** */

function handleGoToPrevBreakpoint(orchestrator: Orchestrator, prevBreakpointFrame: any) {
  if (prevBreakpointFrame) {
    orchestrator.goToPrevBreakpoint();
  }
}

function handleGoToNextBreakpoint(orchestrator: Orchestrator, nextBreakpointFrame: any) {
  if (nextBreakpointFrame) {
    orchestrator.goToNextBreakpoint();
  }
}
