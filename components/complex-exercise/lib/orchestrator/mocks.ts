import type { Frame } from "interpreters";
import type { AnimationTimeline } from "../stubs";
import type { TestState } from "../types";
import { createTestFrame } from "../test-utils/createTestFrame";

// Temporary mock test data for testing the scrubber
export const mockFrames: Frame[] = [
  createTestFrame(0, { line: 1, generateDescription: () => "Start" }),
  createTestFrame(100000, { line: 2, generateDescription: () => "Line 2" }), // 100ms = 100,000 microseconds
  createTestFrame(200000, { line: 3, generateDescription: () => "Line 3" }), // 200ms
  createTestFrame(300000, { line: 4, generateDescription: () => "Line 4" }), // 300ms
  createTestFrame(400000, { line: 5, generateDescription: () => "End" }) // 400ms
];

export const mockTest: TestState = {
  frames: mockFrames,
  animationTimeline: {
    duration: 400, // 400ms to match the last frame at 400000 microseconds
    paused: true,
    seek: (_time: number) => {},
    play: () => {},
    pause: () => {},
    progress: 0,
    currentTime: 0,
    completed: false,
    hasPlayedOrScrubbed: false,
    seekEndOfTimeline: () => {},
    onUpdate: () => {},
    timeline: {
      duration: 400, // 400ms
      currentTime: 0
    }
  } as AnimationTimeline,
  time: 0,
  currentFrame: mockFrames[0], // Initialize with first frame
  prevFrame: undefined, // No previous frame at start
  nextFrame: mockFrames[1], // Next frame is frame 1
  prevBreakpointFrame: undefined, // No previous breakpoint frame at start
  nextBreakpointFrame: undefined // No next breakpoint frame initially
};
