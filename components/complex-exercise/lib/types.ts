import type { Frame, AnimationTimeline } from "./stubs";

// Actual types for the orchestrator pattern
export interface TestState {
  frames: Frame[];
  animationTimeline: AnimationTimeline;
  timelineValue: number;
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
}
