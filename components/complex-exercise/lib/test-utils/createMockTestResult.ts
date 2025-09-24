import type { Frame } from "interpreters";
import type { TestResult } from "../test-results-types";
import { mockAnimationTimeline } from "@/tests/mocks";

/**
 * Create a mock TestResult for testing purposes
 * Provides default values for all required fields
 */
export function createMockTestResult(overrides: Partial<TestResult> = {}): TestResult {
  const defaultFrames: Frame[] = [];
  const defaultAnimationTimeline = mockAnimationTimeline({ duration: 0 });

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

    // Current frame (optional, calculated by store)
    currentFrame: undefined,

    // Apply any overrides
    ...overrides
  };
}
