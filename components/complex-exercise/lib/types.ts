import type { Frame, AnimationTimeline } from "./stubs";

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

// Actual types for the orchestrator pattern
export interface TestState {
  frames: Frame[];
  animationTimeline: AnimationTimeline;
  timelineTime: number;
  currentFrame: Frame | null; // Current frame based on timeline position
  prevFrame: Frame | undefined; // Previous non-folded frame from current position
  nextFrame: Frame | undefined; // Next non-folded frame from current position
  prevBreakpointFrame: Frame | undefined; // Previous frame on a breakpoint line
  nextBreakpointFrame: Frame | undefined; // Next frame on a breakpoint line
}

// Public read-only state that components can access
export interface OrchestratorState {
  exerciseUuid: string;
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
}

// Private actions only accessible within the orchestrator
export interface OrchestratorActions {
  setCode: (code: string) => void;
  setOutput: (output: string) => void;
  setStatus: (status: OrchestratorState["status"]) => void;
  setError: (error: string | null) => void;
  setCurrentTest: (test: TestState | null) => void;
  setCurrentTestTimelineTime: (time: number) => void;
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

  reset: () => void;
}

// Combined store type
export type OrchestratorStore = OrchestratorState & OrchestratorActions;
