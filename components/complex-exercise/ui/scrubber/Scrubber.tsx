import React, { useRef } from "react";
import type { Orchestrator } from "../../lib/Orchestrator";
import { useOrchestratorStore } from "../../lib/Orchestrator";
import ScrubberInput from "./ScrubberInput";
import FrameStepperButtons from "./FrameStepperButtons";

interface ScrubberProps {
  orchestrator: Orchestrator;
}

export default function Scrubber({ orchestrator }: ScrubberProps) {
  const { currentTest, hasCodeBeenEdited, isSpotlightActive } = useOrchestratorStore(orchestrator);
  const rangeRef = useRef<HTMLInputElement>(null);

  // Default values when no test is available
  const frames = currentTest?.frames ?? [];
  const animationTimeline = currentTest?.animationTimeline ?? null;
  const timelineTime = currentTest?.timelineTime ?? 0;

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
      {/* <PlayPauseButton
        animationTimeline={animationTimeline}
        enabled={isEnabled}
        onPlay={() => {
          animationTimeline.play(() => setShouldShowInformationWidget(false))
        }}
        onPause={() => {
          animationTimeline.pause()
        }}
      /> */}
      <ScrubberInput
        ref={rangeRef}
        orchestrator={orchestrator}
        frames={frames}
        animationTimeline={animationTimeline}
        timelineTime={timelineTime}
        enabled={isEnabled}
      />
      <FrameStepperButtons
        orchestrator={orchestrator}
        frames={frames}
        timelineTime={timelineTime}
        enabled={isEnabled}
      />
      {/* <BreakpointStepperButtons
        currentFrame={_currentFrame}
        frames={frames}
        onNext={() => handleGoToNextBreakpoint(animationTimeline)}
        onPrev={() => handleGoToPreviousBreakpoint(animationTimeline)}
        enabled={isEnabled}
      /> */}
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
