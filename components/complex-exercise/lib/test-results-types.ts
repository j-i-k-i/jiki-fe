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

export interface NewTestResult {
  slug: string;
  name: string;
  status: "pass" | "fail" | "idle";
  type: TestsType;
  expects: TestExpect[];
  frames: Frame[]; // Execution frames for scrubber timeline (was scrubberFrames)
  codeRun?: string;
  view?: HTMLElement;
  imageSlug?: string;
  animationTimeline: AnimationTimeline | null; // Timeline for scrubber navigation
  time: number; // Current scrubber position
}

export interface TestSuiteResult {
  tests: NewTestResult[];
  status: "pass" | "fail" | "running" | "idle";
}

export interface TestResultsState {
  testSuiteResult: TestSuiteResult | null;
  bonusTestSuiteResult: TestSuiteResult | null;
  shouldShowBonusTasks: boolean;
  shouldAutoplayAnimation: boolean;
}
