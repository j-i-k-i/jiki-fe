import type { Frame } from "interpreters";
import type { TestResult } from "../test-results-types";
import type { AnimationTimeline } from "../stubs";

/**
 * Create a mock TestResult for testing purposes
 * Provides default values for all required fields
 */
export function createMockTestResult(overrides: Partial<TestResult> = {}): TestResult {
  const defaultFrames: Frame[] = [];
  const defaultAnimationTimeline: AnimationTimeline = {
    pause: () => {},
    play: () => {},
    paused: true,
    duration: 0,
    progress: 0,
    currentTime: 0,
    completed: false,
    hasPlayedOrScrubbed: false,
    seek: () => {},
    seekEndOfTimeline: () => {},
    onUpdate: () => {},
    timeline: {
      duration: 0,
      currentTime: 0
    }
  };

  return {
    // Required test properties
    slug: "test-1",
    name: "Test 1",
    status: "idle",
    type: "state",
    expects: [],
    frames: defaultFrames,

    // Required display/timeline properties
    view: typeof document !== "undefined" ? document.createElement("div") : ({} as HTMLElement),
    animationTimeline: defaultAnimationTimeline,
    time: 0,

    // Navigation properties (optional, calculated by store)
    currentFrame: undefined,
    prevFrame: undefined,
    nextFrame: undefined,
    prevBreakpointFrame: undefined,
    nextBreakpointFrame: undefined,

    // Apply any overrides
    ...overrides
  };
}