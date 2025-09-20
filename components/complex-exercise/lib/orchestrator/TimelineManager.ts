import type { StoreApi } from "zustand/vanilla";
import type { Frame } from "../stubs";
import type { OrchestratorState } from "../types";

/**
 * TimelineManager handles all timeline and frame-related operations.
 * This includes frame navigation, timeline time management, and caching.
 */
export class TimelineManager {
  constructor(private readonly store: StoreApi<OrchestratorState & any>) {}

  /**
   * Static method to find the frame nearest to a given timeline time.
   * Used by the store to calculate current frame when timeline changes.
   */
  static findNearestFrame(frames: Frame[] | undefined, timelineTime: number, foldedLines: number[]): Frame | null {
    if (!frames?.length) {
      return null;
    }

    const lastFrame = frames[frames.length - 1];

    // If we're past the last frame, return the last frame
    if (timelineTime > lastFrame.timelineTime) {
      return lastFrame;
    }

    const idx = TimelineManager.findFrameIdxNearestTimelineTime(frames, timelineTime, foldedLines);
    if (idx === undefined) {
      return null;
    }

    return frames[idx];
  }

  /**
   * Static helper to find the index of the nearest frame
   */
  private static findFrameIdxNearestTimelineTime(
    frames: Frame[],
    timelineTime: number,
    foldedLines: number[]
  ): number | undefined {
    // If we've not started playing yet, return the first frame
    if (timelineTime < 0) {
      return 0;
    }

    // Find the first frame at or after the timeline time that isn't folded
    const idx = frames.findIndex((frame: Frame) => {
      return frame.timelineTime >= timelineTime && !foldedLines.includes(frame.line);
    });

    // If there's no frame after the timeline time, return the last frame
    if (idx === -1) {
      return frames.length - 1;
    }

    // If we have the first frame, then there's no need to check previous ones
    if (idx === 0) {
      return idx;
    }

    // Get the previous non-folded frame to compare with
    const prevFrameIdx = TimelineManager.findPrevFrameIdx(frames, idx - 1, foldedLines);

    // If there's no previous frame, then we're happy with what we've got
    if (prevFrameIdx === undefined) {
      return idx;
    }

    // Return the id of whichever of the previous frame and this frame is closest
    const prevFrame = frames[prevFrameIdx];
    const currFrame = frames[idx];

    return Math.abs(prevFrame.timelineTime - timelineTime) < Math.abs(currFrame.timelineTime - timelineTime)
      ? prevFrameIdx
      : idx;
  }

  /**
   * Static helper to find previous non-folded frame
   */
  private static findPrevFrameIdx(frames: Frame[], startIdx: number, foldedLines: number[]): number | undefined {
    for (let idx = startIdx; idx >= 0; idx--) {
      const frame = frames[idx];
      if (!foldedLines.includes(frame.line)) {
        return idx;
      }
    }
    return undefined;
  }

  /**
   * Sets the current timeline time.
   * The frame calculation happens automatically in the store action.
   * Also seeks the animation timeline if it exists.
   */
  setTimelineTime(time: number) {
    const state = this.store.getState();
    state.setCurrentTestTimelineTime(time);

    // Also seek the animation timeline if it exists
    const animationTimeline = state.currentTest?.animationTimeline;
    if (animationTimeline) {
      animationTimeline.seek(time / 100);
    }
  }

  /**
   * Sets timeline time from interpreter time (converts by multiplying by 100).
   */
  setInterpreterTime(interpreterTime: number) {
    this.setTimelineTime(interpreterTime * 100);
  }

  /**
   * Gets the current frame from the current test.
   * The frame is automatically calculated and stored when timeline time changes.
   */
  getNearestCurrentFrame(): Frame | null {
    const state = this.store.getState();
    return state.currentTest?.currentFrame || null;
  }

  /**
   * Finds the next frame that isn't folded.
   * Searches forward from the given index.
   *
   * @param currentIdx The current frame index to search from
   * @returns The next non-folded frame, or undefined if none found
   */
  findNextFrame(currentIdx: number): Frame | undefined {
    const state = this.store.getState();
    const frames = state.currentTest?.frames;
    if (!frames) {
      return undefined;
    }

    const foldedLines = state.foldedLines;

    // Go through all the frames from the next one to the length
    // of the frames, and return the first one that isn't folded.
    for (let idx = currentIdx + 1; idx < frames.length; idx++) {
      const frame = frames[idx];
      if (!foldedLines.includes(frame.line)) {
        return frame;
      }
    }
    return undefined;
  }
}
