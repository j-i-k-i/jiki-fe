// This is an orchestration class for the whole page.
// When the page loads, this is created and then is the thing that's
// passed around, controls the state, etc.

import type { EditorView } from "@codemirror/view";
import type { StoreApi } from "zustand/vanilla";
import { BreakpointManager } from "./orchestrator/BreakpointManager";
import { EditorManager } from "./orchestrator/EditorManager";
import { createOrchestratorStore } from "./orchestrator/store";
import { TestSuiteManager } from "./orchestrator/TestSuiteManager";
import { TimelineManager } from "./orchestrator/TimelineManager";
import type { Frame } from "interpreters";
import type { TestExpect, TestResult, TestSuiteResult } from "./test-results-types";
import type { InformationWidgetData, OrchestratorStore, UnderlineRange } from "./types";

class Orchestrator {
  exerciseUuid: string;
  readonly store: StoreApi<OrchestratorStore>; // Made readonly instead of private for methods to access
  private readonly timelineManager: TimelineManager;
  private readonly breakpointManager: BreakpointManager;
  private readonly testSuiteManager: TestSuiteManager;
  private editorManager: EditorManager | null = null;
  private editorRefCallback: ((element: HTMLDivElement | null) => void) | null = null;

  constructor(exerciseUuid: string, initialCode: string) {
    this.exerciseUuid = exerciseUuid;

    // Create instance-specific store
    this.store = createOrchestratorStore(exerciseUuid, initialCode);

    // Initialize managers
    this.timelineManager = new TimelineManager(this.store);
    this.breakpointManager = new BreakpointManager(this.store);
    this.testSuiteManager = new TestSuiteManager(this.store);
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

  setCurrentTestTime(time: number) {
    this.timelineManager.setTime(time);
  }

  setCurrentTest(test: TestResult | null) {
    this.store.getState().setCurrentTest(test);
  }

  setFoldedLines(lines: number[]) {
    // When folded lines change, recalculate the current frame
    const state = this.store.getState();
    // Set folded lines first
    state.setFoldedLines(lines);
    // Then recalculate the frame with the new folded lines
    if (state.currentTest) {
      state.setCurrentTestTime(state.currentTest.time);
    }
  }

  // Editor store public methods
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

  // Test results store public methods - delegate to TestSuiteManager
  setTestSuiteResult(result: TestSuiteResult | null) {
    this.testSuiteManager.setTestSuiteResult(result);
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

      // Import and run our new test runner
      const { runTests } = await import("./test-runner/runTests");
      const testResults = runTests(currentCode);

      // Set the results in the store
      this.testSuiteManager.setTestSuiteResult(testResults);

      // Set the first test as current by default
      // This merges the test result into currentTest for display
      if (testResults.tests.length > 0) {
        this.testSuiteManager.setCurrentTestFromResult(testResults.tests[0]);
      }

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

  // Test result processing methods - delegate to TestSuiteManager
  getFirstExpect(): TestExpect | null {
    return this.testSuiteManager.getFirstExpect();
  }
}

// Re-export the hook from store.ts
export { useOrchestratorStore } from "./orchestrator/store";
export type { Orchestrator };

export default Orchestrator;
