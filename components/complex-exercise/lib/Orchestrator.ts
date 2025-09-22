/* eslint-disable no-console */
// This is an orchestration class for the whole page.
// When the page loads, this is created and then is the thing that's
// passed around, controls the state, etc.

import type { EditorView } from "@codemirror/view";
import { diffChars, diffWords, type Change } from "diff";
import type { StoreApi } from "zustand/vanilla";
import { mockBonusTestResults, mockTestResults } from "./mock-test-results";
import { BreakpointManager } from "./orchestrator/BreakpointManager";
import { EditorManager } from "./orchestrator/EditorManager";
import { createOrchestratorStore } from "./orchestrator/store";
import { TimelineManager } from "./orchestrator/TimelineManager";
import type { Frame } from "./stubs";
import type { NewTestResult, TestSuiteResult } from "./test-results-types";
import type { InformationWidgetData, OrchestratorStore, ProcessedExpect, TestState, UnderlineRange } from "./types";

class Orchestrator {
  exerciseUuid: string;
  readonly store: StoreApi<OrchestratorStore>; // Made readonly instead of private for methods to access
  private readonly timelineManager: TimelineManager;
  private readonly breakpointManager: BreakpointManager;
  private editorManager: EditorManager | null = null;
  private editorRefCallback: ((element: HTMLDivElement | null) => void) | null = null;

  constructor(exerciseUuid: string, initialCode: string) {
    this.exerciseUuid = exerciseUuid;

    // Create instance-specific store
    this.store = createOrchestratorStore(exerciseUuid, initialCode);

    // Initialize managers
    this.timelineManager = new TimelineManager(this.store);
    this.breakpointManager = new BreakpointManager(this.store);
    // EditorManager will be created lazily when setupEditor is called
  }

  // Expose the store so a hook can use it
  getStore() {
    return this.store;
  }

  // Setup the editor - returns a stable ref callback that manages EditorManager lifecycle
  setupEditor(value: string, readonly: boolean, highlightedLine: number, shouldAutoRunCode: boolean) {
    // Create ref callback only once to ensure stability across renders
    // React requires ref callbacks to be stable to avoid unnecessary re-runs
    if (!this.editorRefCallback) {
      this.editorRefCallback = (element: HTMLDivElement | null) => {
        if (element) {
          // Create EditorManager when element is available
          if (!this.editorManager) {
            this.editorManager = new EditorManager(
              element,
              this.store,
              this.exerciseUuid,
              this,
              value,
              readonly,
              highlightedLine,
              shouldAutoRunCode
            );
          }
        } else {
          // Cleanup when element is removed
          if (this.editorManager) {
            this.editorManager.cleanup();
            this.editorManager = null;
          }
        }
      };
    }
    return this.editorRefCallback;
  }

  // Get the editor view - primarily for testing purposes
  // Production code should use the orchestrator's methods instead of direct view access
  getEditorView(): EditorView | null {
    return this.editorManager?.editorView ?? null;
  }

  // UNUSED: This function is currently not called.
  callOnEditorChangeCallback(view: EditorView) {
    if (this.editorManager) {
      this.editorManager.callOnEditorChangeCallback(view);
    }
  }

  // Auto-save the current editor content - delegate to EditorManager
  // UNUSED: This function is currently not called.
  autoSaveContent(code: string, readonlyRanges?: { from: number; to: number }[]) {
    if (this.editorManager) {
      this.editorManager.autoSaveContent(code, readonlyRanges);
    }
  }

  // UNUSED: This function is currently not called.
  saveImmediately(code: string, readonlyRanges?: { from: number; to: number }[]) {
    if (this.editorManager) {
      this.editorManager.saveImmediately(code, readonlyRanges);
    }
  }

  // UNUSED: This function is currently not called.
  getCurrentEditorValue(): string | undefined {
    return this.editorManager?.getCurrentEditorValue();
  }

  // Public methods that use the store actions
  setCode(code: string) {
    this.store.getState().setCode(code);
  }

  setExerciseTitle(title: string) {
    this.store.getState().setExerciseTitle(title);
  }

  setCurrentTestTimelineTime(time: number) {
    this.timelineManager.setTimelineTime(time);

    // Also update the inspected test result's timeline time
    const state = this.store.getState();
    const inspectedTest = state.inspectedTestResult;
    if (inspectedTest) {
      const updatedTest = {
        ...inspectedTest,
        timelineTime: time
      };
      state.setInspectedTestResult(updatedTest);

      // Update the test in the test suite results as well
      if (state.testSuiteResult) {
        const updatedTests = state.testSuiteResult.tests.map((test) =>
          test.slug === inspectedTest.slug ? updatedTest : test
        );
        state.setTestSuiteResult({
          ...state.testSuiteResult,
          tests: updatedTests
        });
      }

      if (state.bonusTestSuiteResult) {
        const updatedBonusTests = state.bonusTestSuiteResult.tests.map((test) =>
          test.slug === inspectedTest.slug ? updatedTest : test
        );
        state.setBonusTestSuiteResult({
          ...state.bonusTestSuiteResult,
          tests: updatedBonusTests
        });
      }
    }
  }

  // UNUSED: This function is currently not called.
  setCurrentTestInterpreterTime(interpreterTime: number) {
    this.timelineManager.setInterpreterTime(interpreterTime);
  }

  setCurrentTest(test: TestState | null) {
    this.store.getState().setCurrentTest(test);
  }

  // UNUSED: This function is currently not called.
  // UNUSED: This function is currently not called.
  setHasCodeBeenEdited(value: boolean) {
    this.store.getState().setHasCodeBeenEdited(value);
  }

  // UNUSED: This function is currently not called.
  // UNUSED: This function is currently not called.
  setIsSpotlightActive(value: boolean) {
    this.store.getState().setIsSpotlightActive(value);
  }

  setFoldedLines(lines: number[]) {
    // When folded lines change, recalculate the current frame
    const state = this.store.getState();
    // Set folded lines first
    state.setFoldedLines(lines);
    // Then recalculate the frame with the new folded lines
    if (state.currentTest) {
      state.setCurrentTestTimelineTime(state.currentTest.timelineTime);
    }
  }

  // Editor store public methods
  // UNUSED: This function is currently not called.
  // UNUSED: This function is currently not called.
  setDefaultCode(code: string) {
    this.store.getState().setDefaultCode(code);
  }

  setReadonly(readonly: boolean) {
    this.store.getState().setReadonly(readonly);
  }

  setShouldShowInformationWidget(show: boolean) {
    this.store.getState().setShouldShowInformationWidget(show);
  }

  setUnderlineRange(range: UnderlineRange | undefined) {
    this.store.getState().setUnderlineRange(range);
  }

  setHighlightedLineColor(color: string) {
    this.store.getState().setHighlightedLineColor(color);
  }

  setHighlightedLine(line: number) {
    this.store.getState().setHighlightedLine(line);
  }

  setMultiLineHighlight(fromLine: number, toLine: number) {
    if (this.editorManager) {
      this.editorManager.setMultiLineHighlight(fromLine, toLine);
    }
  }

  setMultipleLineHighlights(lines: number[]) {
    if (this.editorManager) {
      this.editorManager.setMultipleLineHighlights(lines);
    }
  }

  setInformationWidgetData(data: InformationWidgetData) {
    this.store.getState().setInformationWidgetData(data);
  }

  setBreakpoints(breakpoints: number[]) {
    this.store.getState().setBreakpoints(breakpoints);
    if (this.editorManager) {
      this.editorManager.applyBreakpoints(breakpoints);
    }
  }

  setShouldAutoRunCode(shouldAutoRun: boolean) {
    this.store.getState().setShouldAutoRunCode(shouldAutoRun);
  }

  // Test results store public methods
  setTestSuiteResult(result: TestSuiteResult | null) {
    this.store.getState().setTestSuiteResult(result);
  }

  setBonusTestSuiteResult(result: TestSuiteResult | null) {
    this.store.getState().setBonusTestSuiteResult(result);
  }

  setInspectedTestResult(result: NewTestResult | null) {
    this.store.getState().setInspectedTestResult(result);

    // When setting a new inspected test result, also update the current test
    // so the scrubber uses the inspected test's frame data
    if (result && result.animationTimeline) {
      const testState = {
        frames: result.scrubberFrames,
        animationTimeline: result.animationTimeline,
        timelineTime: result.timelineTime,
        currentFrame:
          result.scrubberFrames.find((f) => f.timelineTime === result.timelineTime) || result.scrubberFrames[0],
        prevFrame: undefined,
        nextFrame: undefined,
        prevBreakpointFrame: undefined,
        nextBreakpointFrame: undefined
      };
      this.store.getState().setCurrentTest(testState);
      this.store.getState().setHighlightedLine(testState.currentFrame.line || 0);
    } else {
      this.store.getState().setCurrentTest(null);
    }
  }

  setShouldShowBonusTasks(show: boolean) {
    this.store.getState().setShouldShowBonusTasks(show);
  }

  setShouldAutoplayAnimation(autoplay: boolean) {
    this.store.getState().setShouldAutoplayAnimation(autoplay);
  }

  // Error store public methods
  // UNUSED: This function is currently not called.
  setHasUnhandledError(hasError: boolean) {
    this.store.getState().setHasUnhandledError(hasError);
  }

  // UNUSED: This function is currently not called.
  setUnhandledErrorBase64(errorData: string) {
    this.store.getState().setUnhandledErrorBase64(errorData);
  }

  // Delegate frame methods to TimelineManager
  getNearestCurrentFrame() {
    return this.timelineManager.getNearestCurrentFrame();
  }

  // Frame navigation methods - delegate to TimelineManager
  findNextFrame(currentIdx?: number): Frame | undefined {
    return this.timelineManager.findNextFrame(currentIdx);
  }

  findPrevFrame(currentIdx?: number): Frame | undefined {
    return this.timelineManager.findPrevFrame(currentIdx);
  }

  // Breakpoint navigation methods - delegate to BreakpointManager
  goToPrevBreakpoint() {
    this.breakpointManager.goToPrevBreakpoint();
  }

  goToNextBreakpoint() {
    this.breakpointManager.goToNextBreakpoint();
  }

  async runCode() {
    const state = this.store.getState();
    state.setStatus("running");
    state.setError(null);

    try {
      // Get the current code from the editor
      const currentCode = this.getCurrentEditorValue() || this.store.getState().code;

      console.log("Running code:", currentCode);

      // Simulate async execution
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate mock test results
      state.setTestSuiteResult(mockTestResults);
      state.setBonusTestSuiteResult(mockBonusTestResults);

      // Set the first test as inspected by default using the orchestrator method
      // This will properly set up the scrubber state
      if (mockTestResults.tests.length > 0) {
        this.setInspectedTestResult(mockTestResults.tests[0]);
      }

      const output = `Running exercise ${this.exerciseUuid}...\n\n> ${currentCode}\n\nTests completed. Check test results below.`;
      state.setOutput(output);
      state.setStatus("success");
    } catch (error) {
      state.setError(error instanceof Error ? error.message : "Unknown error");
      state.setStatus("error");
    }
  }

  // Initialize editor with code, exercise data, and localStorage synchronization - delegate to EditorManager
  // UNUSED: This function is currently not called.
  initializeEditor(
    code: { storedAt?: string; code: string; readonlyRanges?: { from: number; to: number }[] },
    exercise: unknown,
    unfoldableFunctionNames: string[]
  ) {
    if (this.editorManager) {
      this.editorManager.initializeEditor(code, exercise, unfoldableFunctionNames);
    }
  }

  // Reset editor to stub code and save to localStorage - delegate to EditorManager
  // Initialize exercise data with localStorage/server priority logic
  initializeExerciseData(serverData?: {
    code: string;
    storedAt?: string;
    readonlyRanges?: { from: number; to: number }[];
  }) {
    this.store.getState().initializeExerciseData(serverData);
  }

  // UNUSED: This function is currently not called.
  resetEditorToStub(
    stubCode: string,
    defaultReadonlyRanges: { from: number; to: number }[],
    unfoldableFunctionNames: string[]
  ) {
    if (this.editorManager) {
      this.editorManager.resetEditorToStub(stubCode, defaultReadonlyRanges, unfoldableFunctionNames);
    }
  }

  // Test result processing methods
  getProcessedExpects(): ProcessedExpect[] {
    const result = this.store.getState().inspectedTestResult;
    return this.processExpects(result);
  }

  getFirstFailingExpect(): ProcessedExpect | null {
    const result = this.store.getState().inspectedTestResult;
    return this.getFirstFailingExpectInternal(result);
  }

  getFirstExpect(): ProcessedExpect | null {
    const firstFailing = this.getFirstFailingExpect();
    const processed = this.getProcessedExpects();
    return firstFailing || processed[0] || null;
  }

  private getFirstFailingExpectInternal(result: NewTestResult | null): ProcessedExpect | null {
    if (!result) {
      return null;
    }

    for (const expect of result.expects) {
      if (expect.pass === false) {
        if (result.type === "state") {
          return {
            errorHtml: expect.errorHtml,
            type: result.type,
            actual: expect.actual,
            pass: expect.pass,
            diff: []
          };
        }
        // io expect
        const { expected, actual } = expect;
        return {
          ...expect,
          type: result.type,
          diff: this.getDiffOfExpectedAndActual(false, expected, actual)
        };
      }
    }
    return null;
  }

  private processExpects(result: NewTestResult | null): ProcessedExpect[] {
    if (!result) {
      return [];
    }

    return result.expects.map((expect) => {
      if (result.type === "state") {
        // state expect
        return {
          errorHtml: expect.errorHtml,
          type: "state" as const,
          actual: expect.actual,
          pass: expect.pass,
          diff: []
        };
      }

      // io expect
      const { expected, actual } = expect;
      return {
        ...expect,
        type: result.type,
        diff: this.getDiffOfExpectedAndActual(expect.pass, expected, actual)
      };
    });
  }

  private formatJikiObject(obj: any): string {
    if (obj === null) {
      return "null";
    }
    if (obj === undefined) {
      return "undefined";
    }
    if (typeof obj === "string") {
      return obj;
    }
    if (typeof obj === "boolean") {
      return obj.toString();
    }
    if (typeof obj === "number") {
      return obj.toString();
    }
    return JSON.stringify(obj);
  }

  private getDiffOfExpectedAndActual(passed: boolean, expected: any, actual: any): Change[] {
    if (passed) {
      return diffChars(this.formatJikiObject(expected), this.formatJikiObject(actual));
    }

    if (actual === null || actual === undefined) {
      return [
        {
          added: false,
          count: 1,
          removed: true,
          value: this.formatJikiObject(expected)
        },
        {
          added: true,
          count: 1,
          removed: false,
          value: "[Your function didn't return anything]"
        }
      ];
    }

    if (typeof expected == "string" && typeof actual == "string") {
      return diffChars(this.formatJikiObject(expected), this.formatJikiObject(actual));
    }
    if (typeof expected == "boolean" && typeof actual == "boolean") {
      return diffWords(this.formatJikiObject(expected), this.formatJikiObject(actual));
    }

    return [
      {
        added: false,
        count: 1,
        removed: true,
        value: this.formatJikiObject(expected)
      },
      {
        added: true,
        count: 1,
        removed: false,
        value: this.formatJikiObject(actual)
      }
    ];
  }
}

// Re-export the hook from store.ts
export { useOrchestratorStore } from "./orchestrator/store";
export type { Orchestrator };

export default Orchestrator;
