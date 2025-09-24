import React from "react";
import { useOrchestratorStore } from "../../lib/Orchestrator";
import { useOrchestrator } from "../../lib/OrchestratorContext";
import type { Frame } from "interpreters";

interface BreakpointStepperButtonsProps {
  enabled: boolean;
}

export default function BreakpointStepperButtons({ enabled }: BreakpointStepperButtonsProps) {
  const orchestrator = useOrchestrator();
  const { currentTest, breakpoints } = useOrchestratorStore(orchestrator);

  // Don't render if no breakpoints or no current test
  if (!currentTest || breakpoints.length === 0) {
    return null;
  }

  // Get prev/next breakpoint frames directly from the store
  const prevBreakpointFrame = currentTest.prevBreakpointFrame;
  const nextBreakpointFrame = currentTest.nextBreakpointFrame;

  return (
    <div data-testid="breakpoint-stepper-buttons" className="breakpoint-stepper-buttons flex gap-1">
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

function handleGoToPrevBreakpoint(
  orchestrator: ReturnType<typeof useOrchestrator>,
  prevBreakpointFrame: Frame | undefined
) {
  if (prevBreakpointFrame) {
    orchestrator.goToPrevBreakpoint();
  }
}

function handleGoToNextBreakpoint(
  orchestrator: ReturnType<typeof useOrchestrator>,
  nextBreakpointFrame: Frame | undefined
) {
  if (nextBreakpointFrame) {
    orchestrator.goToNextBreakpoint();
  }
}
