import type { Frame } from "interpreters";
import type { AnimationTimeline } from "./stubs";

export type TestsType = "io" | "state";

export interface TestExpect {
  pass: boolean;
  actual: any;
  expected?: any;
  errorHtml?: string;
  codeRun?: string;
}

export interface TestFrame {
  description: string;
  line: number;
  status: "SUCCESS" | "ERROR";
}

// Unified TestResult type that includes both test data and navigation state
export interface TestResult {
  // Core test properties
  slug: string;
  name: string;
  status: "pass" | "fail" | "idle";
  type: TestsType;
  expects: TestExpect[];
  frames: Frame[]; // Execution frames for scrubber timeline
  codeRun?: string;
  imageSlug?: string;

  // Required display and timeline properties
  view: HTMLElement;
  animationTimeline: AnimationTimeline; // Always required for scrubber navigation
  time: number; // Current scrubber position in microseconds

  // Navigation properties (calculated by store via setCurrentTestTime)
  currentFrame?: Frame; // Current frame based on timeline position
  prevFrame?: Frame; // Previous frame from current position
  nextFrame?: Frame; // Next frame from current position
  prevBreakpointFrame?: Frame; // Previous frame on a breakpoint line
  nextBreakpointFrame?: Frame; // Next frame on a breakpoint line
}

// Legacy alias for backward compatibility during migration
export type NewTestResult = TestResult;

export interface TestSuiteResult {
  tests: TestResult[];
  status: "pass" | "fail" | "running" | "idle";
}

export interface TestResultsState {
  testSuiteResult: TestSuiteResult | null;
  bonusTestSuiteResult: TestSuiteResult | null;
  shouldShowBonusTasks: boolean;
  shouldAutoplayAnimation: boolean;
}
