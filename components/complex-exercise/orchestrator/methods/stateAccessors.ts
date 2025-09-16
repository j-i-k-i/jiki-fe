/**
 * State accessor methods for the Orchestrator.
 *
 * IMPORTANT: These are NOT reactive and should only be used within the orchestrator's methods.
 * They provide convenient, type-safe access to state properties without the repetitive
 * null-checking and destructuring dance.
 *
 * For reactive access in React components, use the useOrchestratorStore hook instead.
 */

import type { Orchestrator } from "../../orchestrator";
import type { Frame, AnimationTimeline } from "../../stubs";

// ========================================
// Primary State Accessors
// ========================================

export function getCode(this: Orchestrator): string {
  return this.store.getState().code;
}

export function getOutput(this: Orchestrator): string {
  return this.store.getState().output;
}

export function getStatus(this: Orchestrator): "idle" | "running" | "success" | "error" {
  return this.store.getState().status;
}

export function getError(this: Orchestrator): string | null {
  return this.store.getState().error;
}

export function getHasCodeBeenEdited(this: Orchestrator): boolean {
  return this.store.getState().hasCodeBeenEdited;
}

export function getIsSpotlightActive(this: Orchestrator): boolean {
  return this.store.getState().isSpotlightActive;
}

export function getFoldedLines(this: Orchestrator): number[] {
  return this.store.getState().foldedLines;
}

// ========================================
// Current Test Accessors
// ========================================

export function getCurrentTest(this: Orchestrator) {
  return this.store.getState().currentTest;
}

export function getCurrentTestFrames(this: Orchestrator): Frame[] | null {
  const currentTest = this.store.getState().currentTest;
  if (!currentTest) {
    return null;
  }
  return currentTest.frames;
}

export function getCurrentTestAnimationTimeline(this: Orchestrator): AnimationTimeline | null {
  const currentTest = this.store.getState().currentTest;
  if (!currentTest) {
    return null;
  }
  return currentTest.animationTimeline;
}

export function getCurrentTestTimelineValue(this: Orchestrator): number | null {
  const currentTest = this.store.getState().currentTest;
  if (!currentTest) {
    return null;
  }
  return currentTest.timelineValue;
}

// ========================================
// Convenience Accessors
// ========================================

/**
 * Checks if we have a valid test with frames.
 */
export function hasValidTest(this: Orchestrator): boolean {
  const currentTest = this.store.getState().currentTest;
  return currentTest !== null && currentTest.frames.length > 0;
}
