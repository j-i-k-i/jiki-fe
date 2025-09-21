import React from "react";
import type { Orchestrator } from "../../lib/Orchestrator";
import { useOrchestratorStore } from "../../lib/Orchestrator";
import type { Frame } from "../../lib/stubs";

interface FrameStepperButtonsProps {
  orchestrator: Orchestrator;
  enabled: boolean;
}

export default function FrameStepperButtons({ orchestrator, enabled }: FrameStepperButtonsProps) {
  const { currentTest } = useOrchestratorStore(orchestrator);

  // Get prev/next frames directly from the store
  const prevFrame = currentTest?.prevFrame;
  const nextFrame = currentTest?.nextFrame;

  return (
    <div data-testid="frame-stepper-buttons" className="frame-stepper-buttons flex gap-1">
      <button
        disabled={!enabled || !prevFrame}
        onClick={() => handleGoToPreviousFrame(orchestrator, prevFrame)}
        className="p-1 border rounded disabled:opacity-50"
        aria-label="Previous frame"
      >
        ←
      </button>
      <button
        disabled={!enabled || !nextFrame}
        onClick={() => handleGoToNextFrame(orchestrator, nextFrame)}
        className="p-1 border rounded disabled:opacity-50"
        aria-label="Next frame"
      >
        →
      </button>
    </div>
  );
}

/* **************** */
/* EVENT HANDLERS */
/* **************** */

function handleGoToPreviousFrame(orchestrator: Orchestrator, prevFrame: Frame | undefined) {
  if (prevFrame) {
    orchestrator.setCurrentTestTimelineTime(prevFrame.timelineTime);
  }
}

function handleGoToNextFrame(orchestrator: Orchestrator, nextFrame: Frame | undefined) {
  if (nextFrame) {
    orchestrator.setCurrentTestTimelineTime(nextFrame.timelineTime);
  }
}
