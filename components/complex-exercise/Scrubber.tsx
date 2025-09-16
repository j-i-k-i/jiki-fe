import React, { useRef } from "react";
import type { Orchestrator } from "./orchestrator";
import { useOrchestratorStore } from "./orchestrator";

interface ScrubberProps {
  orchestrator: Orchestrator;
}

export default function Scrubber({ orchestrator }: ScrubberProps) {
  const { currentTest, hasCodeBeenEdited, isSpotlightActive } = useOrchestratorStore(orchestrator);
  const rangeRef = useRef<HTMLInputElement>(null);

  // Default values when no test is available
  const frames = currentTest?.frames || [];
  const animationTimeline = currentTest?.animationTimeline || null;
  const timelineValue = currentTest?.timelineValue || 0;

  // Get the nearest frame to the current timeline position
  const _currentFrame = orchestrator.getNearestCurrentFrame();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(event.target.value);
    orchestrator.setTimelineValue(newValue);
    animationTimeline?.seek(newValue / 100);
    // updateInputBackground() - commented out
  };

  const handleOnKeyUp = (event: any, animationTimeline: any) => {
    // TODO: Implement
  };

  const handleOnKeyDown = (event: any, animationTimeline: any, frames: any) => {
    // TODO: Implement
  };

  const handleOnMouseUp = (animationTimeline: any, frames: any) => {
    // TODO: Implement
  };

  const updateInputBackground = () => {
    // TODO: Implement if needed
  };

  const shouldScrubberBeDisabled = (
    currentTest: any,
    hasCodeBeenEdited: boolean,
    frames: any[],
    isSpotlightActive: boolean
  ) => {
    return !currentTest || hasCodeBeenEdited || isSpotlightActive || frames.length < 2;
  };

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
        disabled={shouldScrubberBeDisabled(
          hasCodeBeenEdited,
          frames,
          isSpotlightActive
        )}
        onPlay={() => {
          animationTimeline.play(() => setShouldShowInformationWidget(false))
        }}
        onPause={() => {
          animationTimeline.pause()
        }}
      /> */}
      <input
        data-testid="scrubber-range-input"
        disabled={shouldScrubberBeDisabled(currentTest, hasCodeBeenEdited, frames, isSpotlightActive)}
        type="range"
        className="w-full"
        onKeyUp={(event) => handleOnKeyUp(event, animationTimeline)}
        onKeyDown={(event) => handleOnKeyDown(event, animationTimeline, frames)}
        min={calculateMinInputValue(frames)}
        max={calculateMaxInputValue(animationTimeline || { duration: 0 })}
        ref={rangeRef}
        onInput={updateInputBackground}
        value={timelineValue}
        onChange={(event) => {
          handleChange(event);
          updateInputBackground();
        }}
        onMouseUp={() => handleOnMouseUp(animationTimeline, frames)}
      />
      {/* <FrameStepperButtons
        timelineTime={timelineValue}
        frames={frames}
        onNext={() => handleGoToNextFrame(animationTimeline, frames)}
        onPrev={() => handleGoToPreviousFrame(animationTimeline, frames)}
        disabled={shouldScrubberBeDisabled(
          hasCodeBeenEdited,
          frames,
          isSpotlightActive
        )}
      /> */}
      {/* <BreakpointStepperButtons
        currentFrame={_currentFrame}
        frames={frames}
        onNext={() => handleGoToNextBreakpoint(animationTimeline)}
        onPrev={() => handleGoToPreviousBreakpoint(animationTimeline)}
        disabled={shouldScrubberBeDisabled(
          hasCodeBeenEdited,
          frames,
          isSpotlightActive
        )}
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

// Helper functions
function calculateMinInputValue(frames: any[]) {
  return frames.length < 2 ? -1 : 0;
}

function calculateMaxInputValue(animationTimeline: any) {
  return Math.round(animationTimeline.duration * 100);
}
