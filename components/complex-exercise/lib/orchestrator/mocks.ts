import type { Frame } from "interpreters";
import type { TestResult } from "../test-results-types";
import type { AnimationTimeline } from "../AnimationTimeline";
import { mockFrame } from "@/tests/mocks";
import { createMockTestResult } from "../test-utils/createMockTestResult";

// Temporary mock test data for testing the scrubber
export const mockFrames: Frame[] = [
  mockFrame(0, { line: 1, generateDescription: () => "Start" }),
  mockFrame(100000, { line: 2, generateDescription: () => "Line 2" }), // 100ms = 100,000 microseconds
  mockFrame(200000, { line: 3, generateDescription: () => "Line 3" }), // 200ms
  mockFrame(300000, { line: 4, generateDescription: () => "Line 4" }), // 300ms
  mockFrame(400000, { line: 5, generateDescription: () => "End" }) // 400ms
];

export const mockTest: TestResult = createMockTestResult({
  frames: mockFrames,
  animationTimeline: {
    duration: 400000, // 400ms in microseconds to match the last frame
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
      duration: 400000, // 400ms in microseconds
      currentTime: 0
    } as any
  } as unknown as AnimationTimeline,
  time: 0,
  currentFrame: mockFrames[0] // Initialize with first frame
});
