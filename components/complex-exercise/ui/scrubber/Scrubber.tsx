import React, { useRef } from "react";
import { useOrchestratorStore } from "../../lib/Orchestrator";
import { useOrchestrator } from "../../lib/OrchestratorContext";
import ScrubberInput from "./ScrubberInput";
import FrameStepperButtons from "./FrameStepperButtons";
import BreakpointStepperButtons from "./BreakpointStepperButtons";
import PlayPauseButton from "./PlayPauseButton";

export default function Scrubber() {
  const orchestrator = useOrchestrator();
  const { currentTest, currentTestTime, hasCodeBeenEdited, isSpotlightActive } = useOrchestratorStore(orchestrator);
  const rangeRef = useRef<HTMLInputElement>(null);

  // Default values when no test is available
  const frames = currentTest?.frames ?? [];
  const animationTimeline = currentTest?.animationTimeline ?? null;
  const time = currentTestTime;
  const isEnabled = !!currentTest && !hasCodeBeenEdited && !isSpotlightActive && frames.length >= 2;

  return (
    <div
      data-testid="scrubber"
      id="scrubber"
      onClick={() => {
        // we wanna focus the range input, so keyboard shortcuts work
        rangeRef.current?.focus();
      }}
      tabIndex={-1}
      className="relative group flex-1"
    >
      <PlayPauseButton disabled={!isEnabled} />
      <ScrubberInput
        ref={rangeRef}
        frames={frames}
        animationTimeline={animationTimeline}
        time={time}
        enabled={isEnabled}
      />
      <FrameStepperButtons enabled={isEnabled} />
      <BreakpointStepperButtons enabled={isEnabled} />
      {/* <InformationWidgetToggleButton
        disabled={hasCodeBeenEdited || isSpotlightActive}
      /> */}
      {/* <TooltipInformation
        hasCodeBeenEdited={hasCodeBeenEdited}
        notEnoughFrames={frames.length === 1}
        animationTimeline={animationTimeline}
      /> */}
    </div>
  );
}
