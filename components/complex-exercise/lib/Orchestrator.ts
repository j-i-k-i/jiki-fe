/* eslint-disable no-console */
// This is an orchestration class for the whole page.
// When the page loads, this is created and then is the thing that's
// passed around, controls the state, etc.

import type { EditorView } from "@codemirror/view";
import type { StoreApi } from "zustand/vanilla";
import { EditorManager } from "./orchestrator/EditorManager";
import { TimelineManager } from "./orchestrator/TimelineManager";
import { createOrchestratorStore } from "./orchestrator/store";
import type { TestState, UnderlineRange, InformationWidgetData, OrchestratorStore } from "./types";

class Orchestrator {
  exerciseUuid: string;
  readonly store: StoreApi<OrchestratorStore>; // Made readonly instead of private for methods to access
  private readonly timelineManager: TimelineManager;
  private editorManager: EditorManager | null = null;
  private handleRunCodeCallback?: () => void;

  constructor(exerciseUuid: string, initialCode: string) {
    this.exerciseUuid = exerciseUuid;

    // Create instance-specific store
    this.store = createOrchestratorStore(exerciseUuid, initialCode);

    // Initialize timeline manager only
    this.timelineManager = new TimelineManager(this.store);
    // EditorManager will be created lazily when setupEditor is called
  }

  // Expose the store so a hook can use it
  getStore() {
    return this.store;
  }

  // Setup the editor - creates EditorManager if needed and returns ref
  setupEditor(value: string, readonly: boolean, highlightedLine: number, shouldAutoRunCode: boolean) {
    if (!this.editorManager) {
      this.editorManager = new EditorManager(
        this.store,
        this.exerciseUuid,
        this,
        value,
        readonly,
        highlightedLine,
        shouldAutoRunCode
      );
    }
    return this.editorManager.getEditorRef();
  }

  // EditorView management - delegate to EditorManager
  setEditorView(view: EditorView | null) {
    if (this.editorManager) {
      this.editorManager.setEditorView(view);
    }
  }

  getEditorView(): EditorView | null {
    return this.editorManager?.getEditorView() ?? null;
  }

  // Editor API management - delegate to EditorManager
  setEditorAPI(api: any) {
    if (this.editorManager) {
      this.editorManager.setEditorAPI(api);
    }
  }

  // Editor change callback management - delegate to EditorManager
  setOnEditorChangeCallback(callback?: (view: EditorView) => void) {
    if (this.editorManager) {
      this.editorManager.setOnEditorChangeCallback(callback);
    }
  }

  // Run code callback management
  // UNUSED: This function is currently not called.
  setHandleRunCodeCallback(callback?: () => void) {
    this.handleRunCodeCallback = callback;
  }

  // Call the run code callback if set, otherwise use orchestrator's runCode
  handleRunCode() {
    if (this.handleRunCodeCallback) {
      this.handleRunCodeCallback();
    } else {
      this.runCode().catch((error) => {
        console.error("Unexpected error in runCode:", error);
        const state = this.store.getState();
        state.setError(error instanceof Error ? error.message : "Unexpected error occurred");
        state.setStatus("error");
      });
    }
  }

  // Call the editor change callback if set - delegate to EditorManager
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

  // Save immediately (for cleanup) - delegate to EditorManager
  saveImmediately(code: string, readonlyRanges?: { from: number; to: number }[]) {
    if (this.editorManager) {
      this.editorManager.saveImmediately(code, readonlyRanges);
    }
  }

  // Get current editor value and update snapshot - delegate to EditorManager
  getCurrentEditorValue(): string | undefined {
    return this.editorManager?.getCurrentEditorValue();
  }

  // Public methods that use the store actions
  setCode(code: string) {
    this.store.getState().setCode(code);
  }

  setCurrentTestTimelineTime(time: number) {
    this.timelineManager.setTimelineTime(time);
  }

  // UNUSED: This function is currently not called.
  setCurrentTestInterpreterTime(interpreterTime: number) {
    this.timelineManager.setInterpreterTime(interpreterTime);
  }

  // UNUSED: This function is currently not called.
  setCurrentTest(test: TestState | null) {
    this.store.getState().setCurrentTest(test);
  }

  // UNUSED: This function is currently not called.
  setHasCodeBeenEdited(value: boolean) {
    this.store.getState().setHasCodeBeenEdited(value);
  }

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

  // Error store public methods
  setHasUnhandledError(hasError: boolean) {
    this.store.getState().setHasUnhandledError(hasError);
  }

  setUnhandledErrorBase64(errorData: string) {
    this.store.getState().setUnhandledErrorBase64(errorData);
  }

  // Delegate frame methods to TimelineManager
  getNearestCurrentFrame() {
    return this.timelineManager.getNearestCurrentFrame();
  }

  findNextFrame(currentIdx: number) {
    return this.timelineManager.findNextFrame(currentIdx);
  }

  async runCode() {
    const state = this.store.getState();
    state.setStatus("running");
    state.setError(null);

    try {
      // Get the current code from the editor
      const currentCode = this.getCurrentEditorValue() || this.store.getState().code;

      // Simulate running code

      console.log("Running code:", currentCode);

      // Simulate async execution
      await new Promise((resolve) => setTimeout(resolve, 500));

      const output = `Running exercise ${this.exerciseUuid}...\n\n> ${currentCode}\n\nOutput: Hello, World!`;
      state.setOutput(output);
      state.setStatus("success");
    } catch (error) {
      state.setError(error instanceof Error ? error.message : "Unknown error");
      state.setStatus("error");
    }
  }

  // Initialize editor with code, exercise data, and localStorage synchronization - delegate to EditorManager
  // UNUSED: This function is currently not called.
  initializeEditor(code: any, exercise: any, unfoldableFunctionNames: string[]) {
    if (this.editorManager) {
      this.editorManager.initializeEditor(code, exercise, unfoldableFunctionNames);
    }
  }

  // Reset editor to stub code and save to localStorage - delegate to EditorManager
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
}

// Re-export the hook from store.ts
export { useOrchestratorStore } from "./orchestrator/store";

export default Orchestrator;
export type { Orchestrator };
