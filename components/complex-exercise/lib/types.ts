import type { Frame, AnimationTimeline } from "./stubs";
import type { UnderlineRange, InformationWidgetData } from "./Orchestrator";

// Actual types for the orchestrator pattern
export interface TestState {
  frames: Frame[];
  animationTimeline: AnimationTimeline;
  timelineTime: number;
  currentFrame: Frame | null; // Current frame based on timeline position
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
