import React, { useEffect, useState } from "react";
import type { Orchestrator } from "../../lib/Orchestrator";
import { useOrchestratorStore } from "../../lib/Orchestrator";
import type { Frame } from "../../lib/stubs";

interface FrameStepperButtonsProps {
  orchestrator: Orchestrator;
  enabled: boolean;
}

export default function FrameStepperButtons({ orchestrator, enabled }: FrameStepperButtonsProps) {
  const { currentTest } = useOrchestratorStore(orchestrator);
  const [prevFrame, setPrevFrame] = useState<Frame | undefined>(undefined);
  const [nextFrame, setNextFrame] = useState<Frame | undefined>(undefined);

  useEffect(() => {
    // Update prev/next frames whenever the current frame changes
    setPrevFrame(orchestrator.findPrevFrame());
    setNextFrame(orchestrator.findNextFrame());
  }, [orchestrator, currentTest?.currentFrame, currentTest?.timelineTime]);

  return (
    <div data-ci="frame-stepper-buttons" className="frame-stepper-buttons flex gap-1">
      <button
        disabled={!enabled || !prevFrame}
        onClick={() => handleGoToPreviousFrame(orchestrator)}
        className="p-1 border rounded disabled:opacity-50"
        aria-label="Previous frame"
      >
        ←
      </button>
      <button
        disabled={!enabled || !nextFrame}
        onClick={() => handleGoToNextFrame(orchestrator)}
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

function handleGoToPreviousFrame(orchestrator: Orchestrator) {
  const previousFrame = orchestrator.findPrevFrame();
  if (previousFrame) {
    orchestrator.setCurrentTestTimelineTime(previousFrame.timelineTime);
  }
}

function handleGoToNextFrame(orchestrator: Orchestrator) {
  const nextFrame = orchestrator.findNextFrame();
  if (nextFrame) {
    orchestrator.setCurrentTestTimelineTime(nextFrame.timelineTime);
  }
}
