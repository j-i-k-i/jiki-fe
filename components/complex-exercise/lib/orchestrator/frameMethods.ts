import type { Orchestrator } from "../Orchestrator";
import type { Frame } from "../stubs";

/**
 * Gets the frame nearest to the current timeline value.
 *
 * IMPORTANT: This finds the NEAREST frame, not the frame AT the current time.
 * The timeline value can be any number (e.g., 2.5 when scrubbing between frames),
 * but frames only exist at specific times. This method finds the closest frame
 * to the current timeline position.
 *
 * For example:
 * - Frames exist at interpreterTime values: [0, 1, 2, 3]
 * - Timeline value: 2.3
 * - Returns: Frame at interpreterTime 2 (nearest)
 *
 * This distinction matters for:
 * - Scrubbing between frames
 * - Animation playback at arbitrary positions
 * - Determining which frame's information to display
 *
 * Uses caching to avoid recalculation:
 * - Cache is stored on the Orchestrator instance
 * - Invalidated when timelineTime or currentTest changes
 *
 * @returns The frame nearest to current timeline value, or null if no test
 */
export function getNearestCurrentFrame(this: Orchestrator): Frame | null {
  const currentTest = this.getCurrentTest();
  if (!currentTest) {
    return null;
  }

  // Return cached value if available
  if (this._cachedCurrentFrame !== undefined) {
    return this._cachedCurrentFrame;
  }

  // Calculate and cache the nearest frame
  const frame = findFrameNearestTimelineTime.call(this, currentTest.timelineTime);

  this._cachedCurrentFrame = frame;

  return frame;
}

/**
 * Finds the frame nearest to a given timeline time.
 * Takes into account folded lines which should be skipped.
 * Uses frames and foldedLines from orchestrator state.
 */
function findFrameNearestTimelineTime(this: Orchestrator, timelineTime: number): Frame | null {
  const frames = this.getCurrentTestFrames();
  if (!frames?.length) {
    return null;
  }
  const lastFrame = frames[frames.length - 1];

  // If we're past the last frame, return the last frame
  if (timelineTime > lastFrame.timelineTime) {
    return lastFrame;
  }

  const idx = findFrameIdxNearestTimelineTime.call(this, timelineTime);
  if (idx === undefined) {
    return null;
  }

  return frames[idx];
}

/**
 * Finds the index of the frame nearest to a given timeline time.
 * This is the core logic that handles:
 * - Frames before timeline starts (returns first frame)
 * - Frames after timeline ends (returns last frame)
 * - Finding closest frame when timeline is between two frames
 * - Skipping folded lines
 * Uses frames and foldedLines from orchestrator state.
 */
function findFrameIdxNearestTimelineTime(this: Orchestrator, timelineTime: number): number | undefined {
  const frames = this.getCurrentTestFrames();
  if (!frames?.length) {
    return undefined;
  }

  const foldedLines = this.getFoldedLines();

  // If we've not started playing yet, return the first frame
  if (timelineTime < 0) {
    return 0;
  }

  // Find the first frame at or after the timeline time that isn't folded
  const idx = frames.findIndex((frame) => {
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
  const prevFrameIdx = findPrevFrameIdx.call(this, idx - 1);

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
 * Finds the previous frame index that isn't folded.
 * Searches backwards from the given index.
 * Uses frames and foldedLines from orchestrator state.
 */
function findPrevFrameIdx(this: Orchestrator, startIdx: number): number | undefined {
  const frames = this.getCurrentTestFrames();
  if (!frames) {
    return undefined;
  }

  const foldedLines = this.getFoldedLines();

  // Go through all the frames from startIdx to the first,
  // and return the first one that isn't folded.
  for (let idx = startIdx; idx >= 0; idx--) {
    const frame = frames[idx];
    if (!foldedLines.includes(frame.line)) {
      return idx;
    }
  }
  return undefined;
}

/**
 * Finds the next frame that isn't folded.
 * Searches forward from the given index.
 * Uses frames and foldedLines from orchestrator state.
 *
 * @param currentIdx The current frame index to search from
 * @returns The next non-folded frame, or undefined if none found
 */
export function findNextFrame(this: Orchestrator, currentIdx: number): Frame | undefined {
  const frames = this.getCurrentTestFrames();
  if (!frames) {
    return undefined;
  }

  const foldedLines = this.getFoldedLines();

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
