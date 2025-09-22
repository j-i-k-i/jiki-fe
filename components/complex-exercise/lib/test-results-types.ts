import type { Frame, AnimationTimeline } from "./stubs";

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

// Scrubber-specific frame data that extends the basic Frame interface from stubs
export interface ScrubberFrame extends Frame {
  description: string;
}

export interface NewTestResult {
  slug: string;
  name: string;
  status: "pass" | "fail" | "idle";
  type: TestsType;
  expects: TestExpect[];
  frames: TestFrame[]; // UI test result frames for display
  codeRun?: string;
  view?: HTMLElement;
  imageSlug?: string;

  // Scrubber-specific data for timeline navigation
  scrubberFrames: ScrubberFrame[]; // Execution frames for scrubber timeline
  animationTimeline: AnimationTimeline | null; // Timeline for scrubber navigation
  timelineTime: number; // Current scrubber position
}

export interface TestSuiteResult {
  tests: NewTestResult[];
  status: "pass" | "fail" | "running" | "idle";
}

export interface TestResultsState {
  testSuiteResult: TestSuiteResult | null;
  bonusTestSuiteResult: TestSuiteResult | null;
  inspectedTestResult: NewTestResult | null;
  shouldShowBonusTasks: boolean;
  shouldAutoplayAnimation: boolean;
}
