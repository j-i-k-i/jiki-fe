import type { Change } from "diff";
import type { Frame } from "interpreters";
import type { AnimationTimeline } from "./stubs";
import type { TestSuiteResult } from "./test-results-types";

// CodeMirror editor types
export interface UnderlineRange {
  from: number;
  to: number;
}

export interface InformationWidgetData {
  html: string;
  line: number;
  status: "SUCCESS" | "ERROR";
}

// Test result processing types
export interface ProcessedExpect {
  diff: Change[];
  type: "io" | "state";
  actual: any;
  pass: boolean;
  codeRun?: string;
  errorHtml?: string;
  expected?: any;
}

export type ProcessedExpects = ProcessedExpect[];

// Actual types for the orchestrator pattern
export interface TestState {
  frames: Frame[];
  animationTimeline: AnimationTimeline;
  time: number;
  currentFrame: Frame | null; // Current frame based on timeline position
  prevFrame: Frame | undefined; // Previous non-folded frame from current position
  nextFrame: Frame | undefined; // Next non-folded frame from current position
  prevBreakpointFrame: Frame | undefined; // Previous frame on a breakpoint line
  nextBreakpointFrame: Frame | undefined; // Next frame on a breakpoint line
  // Optional properties from NewTestResult for display purposes
  name?: string;
  status?: "pass" | "fail" | "idle";
  type?: "io" | "state";
  expects?: any[];
  view?: HTMLElement;
  imageSlug?: string;
  slug?: string;
}

// Public read-only state that components can access
export interface OrchestratorState {
  exerciseUuid: string;
  exerciseTitle: string; // Exercise title for UI display
  code: string;
  output: string;
  status: "idle" | "running" | "success" | "error";
  error: string | null;
  currentTest: TestState | null;
  hasCodeBeenEdited: boolean;
  isSpotlightActive: boolean;
  foldedLines: number[]; // Line numbers that are currently folded in the editor

  // Editor store state
  defaultCode: string;
  readonly: boolean;
  shouldShowInformationWidget: boolean;
  underlineRange: UnderlineRange | undefined;
  highlightedLineColor: string;
  highlightedLine: number;
  informationWidgetData: InformationWidgetData;
  breakpoints: number[];
  shouldAutoRunCode: boolean;

  // Error store state
  hasUnhandledError: boolean;
  unhandledErrorBase64: string;

  // Editor handler state
  latestValueSnapshot: string | undefined;

  // Test results state
  testSuiteResult: TestSuiteResult | null;
  bonusTestSuiteResult: TestSuiteResult | null;
  shouldShowBonusTasks: boolean;
  shouldAutoplayAnimation: boolean;
}

// Private actions only accessible within the orchestrator
export interface OrchestratorActions {
  setCode: (code: string) => void;
  setExerciseTitle: (title: string) => void;
  setOutput: (output: string) => void;
  setStatus: (status: OrchestratorState["status"]) => void;
  setError: (error: string | null) => void;
  setCurrentTest: (test: TestState | null) => void;
  setCurrentFrame: (frame: Frame) => void;
  setCurrentTestTime: (time: number) => void;
  setHasCodeBeenEdited: (value: boolean) => void;
  setIsSpotlightActive: (value: boolean) => void;
  setFoldedLines: (lines: number[]) => void;

  // Editor store actions
  setDefaultCode: (code: string) => void;
  setReadonly: (readonly: boolean) => void;
  setShouldShowInformationWidget: (show: boolean) => void;
  setUnderlineRange: (range: UnderlineRange | undefined) => void;
  setHighlightedLineColor: (color: string) => void;
  setHighlightedLine: (line: number) => void;
  setInformationWidgetData: (data: InformationWidgetData) => void;
  setBreakpoints: (breakpoints: number[]) => void;
  setShouldAutoRunCode: (shouldAutoRun: boolean) => void;

  // Error store actions
  setHasUnhandledError: (hasError: boolean) => void;
  setUnhandledErrorBase64: (errorData: string) => void;

  // Editor handler actions
  setLatestValueSnapshot: (value: string | undefined) => void;

  // Test results actions
  setTestSuiteResult: (result: TestSuiteResult | null) => void;
  setBonusTestSuiteResult: (result: TestSuiteResult | null) => void;
  setShouldShowBonusTasks: (show: boolean) => void;
  setShouldAutoplayAnimation: (autoplay: boolean) => void;

  // Exercise data initialization
  initializeExerciseData: (serverData?: {
    code: string;
    storedAt?: string;
    readonlyRanges?: { from: number; to: number }[];
  }) => void;

  reset: () => void;
}

// Private actions that are not exposed to components
interface OrchestratorPrivateActions {
  recalculateNavigationFrames: () => void;
  recalculateBreakpointFrames: () => void;
}

// Combined store type
export type OrchestratorStore = OrchestratorState & OrchestratorActions & OrchestratorPrivateActions;
