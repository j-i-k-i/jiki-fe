import React, { forwardRef } from "react";
import type { Frame, AnimationTimeline } from "../../lib/stubs";
import type { Orchestrator } from "../../lib/Orchestrator";

interface ScrubberInputProps {
  orchestrator: Orchestrator;
  frames: Frame[];
  animationTimeline: AnimationTimeline | null;
  timelineTime: number;
  disabled: boolean;
}

const ScrubberInput = forwardRef<HTMLInputElement, ScrubberInputProps>(
  ({ orchestrator, frames, animationTimeline, timelineTime, disabled }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(event.target.value);
      orchestrator.setCurrentTestTimelineTime(newValue);
      // updateInputBackground() - commented out
    };

    const handleOnKeyUp = (
      _event: React.KeyboardEvent<HTMLInputElement>,
      _animationTimeline: AnimationTimeline | null
    ) => {
      // TODO: Implement keyboard shortcuts
    };

    const handleOnKeyDown = (
      _event: React.KeyboardEvent<HTMLInputElement>,
      _animationTimeline: AnimationTimeline | null,
      _frames: Frame[]
    ) => {
      // TODO: Implement keyboard shortcuts
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
      // TODO: Implement if needed for visual feedback
    };

    return (
      <input
        data-testid="scrubber-range-input"
        disabled={disabled}
        type="range"
        className="w-full"
        onKeyUp={(event) => handleOnKeyUp(event, animationTimeline)}
        onKeyDown={(event) => handleOnKeyDown(event, animationTimeline, frames)}
        min={calculateMinInputValue(frames)}
        max={calculateMaxInputValue(animationTimeline ?? { duration: 0 })}
        ref={ref}
        onInput={updateInputBackground}
        value={timelineTime}
        onChange={(event) => {
          handleChange(event);
          updateInputBackground();
        }}
        onMouseUp={handleOnMouseUp}
      />
    );
  }
);

ScrubberInput.displayName = "ScrubberInput";

export default ScrubberInput;

/* **************** */
/* HELPER FUNCTIONS */
/* **************** */

function calculateMinInputValue(frames: Frame[]) {
  return frames.length < 2 ? -1 : 0;
}

function calculateMaxInputValue(animationTimeline: AnimationTimeline | { duration: number }) {
  return Math.round(animationTimeline.duration * 100);
}
