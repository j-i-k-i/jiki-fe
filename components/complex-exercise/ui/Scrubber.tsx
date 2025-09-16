import React, { useRef } from "react";
import type { Orchestrator } from "../lib/Orchestrator";
import { useOrchestratorStore } from "../lib/Orchestrator";
import type { Frame, AnimationTimeline } from "../lib/stubs";
import type { TestState } from "../lib/types";

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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(event.target.value);
    orchestrator.setCurrentTestTimelineTime(newValue);
    // updateInputBackground() - commented out
  };

  const handleOnKeyUp = (
    _event: React.KeyboardEvent<HTMLInputElement>,
    _animationTimeline: AnimationTimeline | null
  ) => {
    // TODO: Implement
  };

  const handleOnKeyDown = (
    _event: React.KeyboardEvent<HTMLInputElement>,
    _animationTimeline: AnimationTimeline | null,
    _frames: Frame[]
  ) => {
    // TODO: Implement
  };

  // When we're sliding along the scrubber, we can sort of sit in between two
  // frames, and that's fine. It allows the user to watch the animation back.
  // But when they let go of the mouse we need to lock onto a frame. So this
  // does that. It grabs the nearest frame to the current scrub and moves to it.
  const handleOnMouseUp = () => {
    const nearestFrame = orchestrator.getNearestCurrentFrame();
    if (!nearestFrame) {
      return;
    }

    // Snap to the nearest frame's timeline position
    orchestrator.setCurrentTestTimelineTime(nearestFrame.timelineTime);
  };

  const updateInputBackground = () => {
    // TODO: Implement if needed
  };

  const shouldScrubberBeDisabled = (
    currentTest: TestState | null,
    hasCodeBeenEdited: boolean,
    frames: Frame[],
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
        max={calculateMaxInputValue(animationTimeline ?? { duration: 0 })}
        ref={rangeRef}
        onInput={updateInputBackground}
        value={timelineTime}
        onChange={(event) => {
          handleChange(event);
          updateInputBackground();
        }}
        onMouseUp={handleOnMouseUp}
      />
      <FrameStepperButtons
        timelineTime={timelineTime}
        frames={frames}
        onNext={() => handleGoToNextFrame(orchestrator, frames, timelineTime)}
        onPrev={() => handleGoToPreviousFrame(orchestrator, frames, timelineTime)}
        disabled={shouldScrubberBeDisabled(currentTest, hasCodeBeenEdited, frames, isSpotlightActive)}
      />
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

function FrameStepperButtons({
  timelineTime,
  frames,
  onNext,
  onPrev,
  disabled
}: {
  timelineTime: number;
  frames: Frame[];
  onNext: () => void;
  onPrev: () => void;
  disabled: boolean;
}) {
  const isPrevFrame = prevFrameExists(timelineTime, frames);
  const isNextFrame = nextFrameExists(timelineTime, frames);
  return (
    <div data-ci="frame-stepper-buttons" className="frame-stepper-buttons flex gap-1">
      <button
        disabled={disabled || !isPrevFrame}
        onClick={onPrev}
        className="p-1 border rounded disabled:opacity-50"
        aria-label="Previous frame"
      >
        ←
      </button>
      <button
        disabled={disabled || !isNextFrame}
        onClick={onNext}
        className="p-1 border rounded disabled:opacity-50"
        aria-label="Next frame"
      >
        →
      </button>
    </div>
  );
}

/* ************** */
/* ************** */
/* EVENT HANDLERS */
/* ************** */
/* ************** */

function handleGoToPreviousFrame(orchestrator: Orchestrator, frames: Frame[], currentTimelineTime: number) {
  const previousFrames = frames.filter((frame) => frame.timelineTime < currentTimelineTime);
  if (previousFrames.length > 0) {
    const previousFrame = previousFrames[previousFrames.length - 1];
    orchestrator.setCurrentTestTimelineTime(previousFrame.timelineTime);
  }
}

function handleGoToNextFrame(orchestrator: Orchestrator, frames: Frame[], currentTimelineTime: number) {
  const nextFrame = frames.find((frame) => frame.timelineTime > currentTimelineTime);
  if (nextFrame) {
    orchestrator.setCurrentTestTimelineTime(nextFrame.timelineTime);
  }
}

/* **************** */
/* **************** */
/* HELPER FUNCTIONS */
/* **************** */
/* **************** */
function calculateMinInputValue(frames: Frame[]) {
  return frames.length < 2 ? -1 : 0;
}

function calculateMaxInputValue(animationTimeline: AnimationTimeline | { duration: number }) {
  return Math.round(animationTimeline.duration * 100);
}

function prevFrameExists(timelineTime: number, frames: Frame[]): boolean {
  if (frames.length === 0) {
    return false;
  }
  return frames.some((frame) => frame.timelineTime < timelineTime);
}

function nextFrameExists(timelineTime: number, frames: Frame[]): boolean {
  if (frames.length === 0) {
    return false;
  }
  return frames.some((frame) => frame.timelineTime > timelineTime);
}
