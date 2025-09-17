import React from "react";
import type { Frame } from "../../lib/stubs";
import type { Orchestrator } from "../../lib/Orchestrator";

interface FrameStepperButtonsProps {
  orchestrator: Orchestrator;
  frames: Frame[];
  timelineTime: number;
  enabled: boolean;
}

export default function FrameStepperButtons({ orchestrator, frames, timelineTime, enabled }: FrameStepperButtonsProps) {
  const isPrevFrame = prevFrameExists(timelineTime, frames);
  const isNextFrame = nextFrameExists(timelineTime, frames);

  return (
    <div data-ci="frame-stepper-buttons" className="frame-stepper-buttons flex gap-1">
      <button
        disabled={!enabled || !isPrevFrame}
        onClick={() => handleGoToPreviousFrame(orchestrator, frames, timelineTime)}
        className="p-1 border rounded disabled:opacity-50"
        aria-label="Previous frame"
      >
        ←
      </button>
      <button
        disabled={!enabled || !isNextFrame}
        onClick={() => handleGoToNextFrame(orchestrator, frames, timelineTime)}
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
/* HELPER FUNCTIONS */
/* **************** */

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
