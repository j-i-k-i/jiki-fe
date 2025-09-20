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
   * Static helper to find previous non-folded frame index.
   * Needs to be static because it's used by the static findNearestFrame method.
   * startIdx is inclusive - it checks from startIdx down to 0.
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
   * Gets the nearest frame to the current timeline time.
   * Calculates dynamically based on current timeline time and folded lines.
   */
  getNearestCurrentFrame(): Frame | null {
    const state = this.store.getState();
    const timelineTime = state.currentTest?.timelineTime;
    if (timelineTime === undefined) {
      return null;
    }

    return TimelineManager.findNearestFrame(state.currentTest?.frames, timelineTime, state.foldedLines);
  }

  /**
   * Finds the next frame that isn't folded.
   * If no index is provided, uses the current frame's position.
   *
   * @param currentIdx Optional frame index to search from. If not provided, uses current frame.
   * @returns The next non-folded frame, or undefined if none found
   */
  findNextFrame(currentIdx?: number): Frame | undefined {
    const state = this.store.getState();
    const frames = state.currentTest?.frames;
    if (!frames) {
      return undefined;
    }

    // If no index provided, find the current frame's index
    if (currentIdx === undefined) {
      currentIdx = this.getCurrentOrFirstFrameIdx();
      if (currentIdx === undefined) {
        return undefined;
      }
    }

    const nextIdx = this.findNextFrameIdx(currentIdx);
    return nextIdx !== undefined ? frames[nextIdx] : undefined;
  }

  /**
   * Finds the previous frame that isn't folded.
   * If no index is provided, uses the current frame's position.
   *
   * @param currentIdx Optional frame index to search from. If not provided, uses current frame.
   * @returns The previous non-folded frame, or undefined if none found
   */
  findPrevFrame(currentIdx?: number): Frame | undefined {
    const state = this.store.getState();
    const frames = state.currentTest?.frames;
    const timelineTime = state.currentTest?.timelineTime;

    if (!frames || frames.length === 0) {
      return undefined;
    }

    // If no index provided, find the current frame's index
    if (currentIdx === undefined) {
      currentIdx = this.getCurrentOrLastFrameIdx();
      if (currentIdx === undefined) {
        return undefined;
      }

      // Special case: if timeline is after all frames, return the last non-folded frame
      if (timelineTime !== undefined && frames.length > 0 && timelineTime > frames[frames.length - 1].timelineTime) {
        // Start from the last frame and find the last non-folded one
        for (let i = frames.length - 1; i >= 0; i--) {
          if (!state.foldedLines.includes(frames[i].line)) {
            return frames[i];
          }
        }
        return undefined;
      }
    }

    // If currentIdx is beyond array bounds, start from last frame
    if (currentIdx >= frames.length) {
      currentIdx = frames.length - 1;
    }

    const prevIdx = this.findPrevFrameIdx(currentIdx);
    return prevIdx !== undefined ? frames[prevIdx] : undefined;
  }

  /**
   * Private helper to find previous non-folded frame index
   * Finds the previous frame before startIdx (exclusive)
   */
  private findPrevFrameIdx(startIdx: number): number | undefined {
    const state = this.store.getState();
    const frames = state.currentTest?.frames;
    if (!frames) {
      return undefined;
    }
    // Call static method with startIdx - 1 to exclude current frame
    return TimelineManager.findPrevFrameIdx(frames, startIdx - 1, state.foldedLines);
  }

  /**
   * Private helper to find next non-folded frame index
   */
  private findNextFrameIdx(startIdx: number): number | undefined {
    const state = this.store.getState();
    const frames = state.currentTest?.frames;
    const foldedLines = state.foldedLines;

    if (!frames) {
      return undefined;
    }

    for (let idx = startIdx + 1; idx < frames.length; idx++) {
      const frame = frames[idx];
      if (!foldedLines.includes(frame.line)) {
        return idx;
      }
    }
    return undefined;
  }

  /**
   * Private helper to get current frame index or default to first frame position (-1)
   */
  private getCurrentOrFirstFrameIdx(): number | undefined {
    const state = this.store.getState();
    const frames = state.currentTest?.frames;
    const timelineTime = state.currentTest?.timelineTime;

    if (!frames) {
      return undefined;
    }

    if (timelineTime === undefined || timelineTime < 0) {
      // No timeline time or negative, start from beginning (before first frame)
      return -1;
    }

    // Find the first frame at or after the timeline time
    const idx = frames.findIndex((f: Frame) => f.timelineTime > timelineTime);
    if (idx === -1) {
      // Past all frames, return last index
      return frames.length - 1;
    }
    // Return the frame just before this one (or -1 if this is the first frame)
    return idx - 1;
  }

  /**
   * Private helper to get current frame index or default to last frame position
   */
  private getCurrentOrLastFrameIdx(): number | undefined {
    const state = this.store.getState();
    const frames = state.currentTest?.frames;
    const timelineTime = state.currentTest?.timelineTime;

    if (!frames) {
      return undefined;
    }

    if (timelineTime === undefined) {
      // No timeline time, start from end
      return frames.length;
    }

    // For negative times or times before first frame, return 0
    if (timelineTime < 0) {
      return 0;
    }

    // Find the last frame before or at the timeline time
    let lastIdx = -1;
    for (let i = 0; i < frames.length; i++) {
      if (frames[i].timelineTime <= timelineTime) {
        lastIdx = i;
      } else {
        break;
      }
    }

    // If no frame found (timeline before all frames), return 0
    // Otherwise return the last matching frame index
    return lastIdx === -1 ? 0 : lastIdx;
  }
}
