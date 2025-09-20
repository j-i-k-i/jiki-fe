/* eslint-disable no-console */
// This is an orchestration class for the whole page.
// When the page loads, this is created and then is the thing that's
// passed around, controls the state, etc.

import type { EditorView, ViewUpdate } from "@codemirror/view";
import { EditorView as EditorViewClass } from "@codemirror/view";
import { foldEffect, unfoldEffect } from "@codemirror/language";
import type { StateEffectType, Extension } from "@codemirror/state";
import { debounce } from "lodash";
import type { StoreApi } from "zustand/vanilla";
import { readonlyCompartment } from "../ui/codemirror/CodeMirror";
import {
  informationWidgetDataEffect,
  showInfoWidgetEffect,
  changeMultiLineHighlightEffect
} from "../ui/codemirror/extensions";
import { breakpointEffect } from "../ui/codemirror/extensions/breakpoint";
import { INFO_HIGHLIGHT_COLOR, changeColorEffect, changeLineEffect } from "../ui/codemirror/extensions/lineHighlighter";
import {
  readOnlyRangesStateField,
  updateReadOnlyRangesEffect
} from "../ui/codemirror/extensions/read-only-ranges/readOnlyRanges";
import { addUnderlineEffect } from "../ui/codemirror/extensions/underlineRange";
import { getBreakpointLines } from "../ui/codemirror/utils/getBreakpointLines";
import { getCodeMirrorFieldValue } from "../ui/codemirror/utils/getCodeMirrorFieldValue";
import { getFoldedLines as getCodeMirrorFoldedLines } from "../ui/codemirror/utils/getFoldedLines";
import { updateUnfoldableFunctions } from "../ui/codemirror/utils/unfoldableFunctionNames";
import { loadCodeMirrorContent, saveCodeMirrorContent } from "./localStorage";
import { TimelineManager } from "./orchestrator/TimelineManager";
import { createOrchestratorStore } from "./orchestrator/store";
import {
  getCode,
  getCurrentTest,
  getCurrentTestAnimationTimeline,
  getCurrentTestFrames,
  getCurrentTestTimelineTime,
  getError,
  getFoldedLines,
  getHasCodeBeenEdited,
  getIsSpotlightActive,
  getOutput,
  getStatus,
  hasValidTest
} from "./orchestrator/stateAccessors";
import type { TestState, UnderlineRange, InformationWidgetData, OrchestratorStore } from "./types";

class Orchestrator {
  exerciseUuid: string;
  readonly store: StoreApi<OrchestratorStore>; // Made readonly instead of private for methods to access
  private readonly timelineManager: TimelineManager;
  private editorView: EditorView | null = null;
  private editorHandler: any = null; // Handler from CodeMirror component
  private onEditorChangeCallback?: (view: EditorView) => void;
  private handleRunCodeCallback?: () => void;
  private isSaving = false;
  private saveDebounced: ReturnType<typeof debounce> | null = null;

  constructor(exerciseUuid: string, initialCode: string) {
    this.exerciseUuid = exerciseUuid;

    // Initialize debounced save function
    this.initializeAutoSave();

    // Create instance-specific store
    this.store = createOrchestratorStore(exerciseUuid, initialCode);

    // Initialize TimelineManager
    this.timelineManager = new TimelineManager(this.store);

    // Subscribe to state changes to automatically apply editor effects
    let previousInformationWidgetData = this.store.getState().informationWidgetData;
    let previousShouldShowInformationWidget = this.store.getState().shouldShowInformationWidget;
    let previousReadonly = this.store.getState().readonly;
    let previousHighlightedLine = this.store.getState().highlightedLine;
    let previousHighlightedLineColor = this.store.getState().highlightedLineColor;
    let previousUnderlineRange = this.store.getState().underlineRange;

    this.store.subscribe((state) => {
      if (state.informationWidgetData !== previousInformationWidgetData) {
        this.applyInformationWidgetData(state.informationWidgetData);
        previousInformationWidgetData = state.informationWidgetData;
      }

      if (state.shouldShowInformationWidget !== previousShouldShowInformationWidget) {
        this.applyShouldShowInformationWidget(state.shouldShowInformationWidget);
        previousShouldShowInformationWidget = state.shouldShowInformationWidget;
      }

      if (state.readonly !== previousReadonly) {
        this.applyReadonlyCompartment(state.readonly);
        previousReadonly = state.readonly;
      }

      if (state.highlightedLine !== previousHighlightedLine) {
        this.applyHighlightLine(state.highlightedLine);
        previousHighlightedLine = state.highlightedLine;
      }

      if (state.highlightedLineColor !== previousHighlightedLineColor) {
        this.applyHighlightLineColor(state.highlightedLineColor);
        previousHighlightedLineColor = state.highlightedLineColor;
      }

      if (state.underlineRange !== previousUnderlineRange) {
        this.applyUnderlineRange(state.underlineRange);
        previousUnderlineRange = state.underlineRange;
      }
    });
  }

  // Expose the store so a hook can use it
  getStore() {
    return this.store;
  }

  // EditorView management
  setEditorView(view: EditorView | null) {
    this.editorView = view;
  }

  getEditorView(): EditorView | null {
    return this.editorView;
  }

  // Editor handler management
  handleEditorDidMount(handler: any) {
    this.editorHandler = handler;
    // Editor is now ready - initialization should be called separately by the component
  }

  // Editor change callback management
  setOnEditorChangeCallback(callback?: (view: EditorView) => void) {
    this.onEditorChangeCallback = callback;
  }

  // Run code callback management
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

  // Call the editor change callback if set
  callOnEditorChangeCallback(view: EditorView) {
    if (this.onEditorChangeCallback) {
      this.onEditorChangeCallback(view);
    }
  }

  // Initialize auto-save functionality
  private initializeAutoSave() {
    const saveNow = (code: string, readonlyRanges?: { from: number; to: number }[]) => {
      if (this.isSaving) {
        return; // Prevent concurrent saves
      }

      this.isSaving = true;

      try {
        const result = saveCodeMirrorContent(this.exerciseUuid, code, readonlyRanges);

        if (result.success) {
          console.log("CodeMirror content saved successfully", result);
        } else {
          console.error("Failed to save CodeMirror content:", result.error);
        }
      } catch (error) {
        console.error(`Error saving exercise ${this.exerciseUuid}:`, error);
      } finally {
        this.isSaving = false;
      }
    };

    this.saveDebounced = debounce((code: string, readonlyRanges?: { from: number; to: number }[]) => {
      saveNow(code, readonlyRanges);
    }, 500);
  }

  // Auto-save the current editor content
  autoSaveContent(code: string, readonlyRanges?: { from: number; to: number }[]) {
    if (this.saveDebounced) {
      this.saveDebounced(code, readonlyRanges);
    }
  }

  // Save immediately (for cleanup)
  saveImmediately(code: string, readonlyRanges?: { from: number; to: number }[]) {
    if (this.saveDebounced) {
      this.saveDebounced.cancel();
    }

    if (this.isSaving) {
      return;
    }

    this.isSaving = true;

    try {
      const result = saveCodeMirrorContent(this.exerciseUuid, code, readonlyRanges);

      if (result.success) {
        console.log("CodeMirror content saved successfully", result);
      } else {
        console.error("Failed to save CodeMirror content:", result.error);
      }
    } catch (error) {
      console.error(`Error saving exercise ${this.exerciseUuid}:`, error);
    } finally {
      this.isSaving = false;
    }
  }

  getEditorHandler() {
    return this.editorHandler;
  }

  // Get current editor value and update snapshot
  getCurrentEditorValue(): string | undefined {
    if (this.editorHandler?.getValue) {
      const value = this.editorHandler.getValue();
      this.store.getState().setLatestValueSnapshot(value);
      return value;
    }
    return undefined;
  }

  // Public methods that use the store actions
  setCode(code: string) {
    this.store.getState().setCode(code);
  }

  setCurrentTestTimelineTime(time: number) {
    this.timelineManager.setTimelineTime(time);
  }

  setCurrentTestInterpreterTime(interpreterTime: number) {
    this.timelineManager.setInterpreterTime(interpreterTime);
  }

  setCurrentTest(test: TestState | null) {
    this.store.getState().setCurrentTest(test);
  }

  setHasCodeBeenEdited(value: boolean) {
    this.store.getState().setHasCodeBeenEdited(value);
  }

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
    const editorView = this.getEditorView();
    if (!editorView) {
      return;
    }

    // Convert range to array of lines
    if (fromLine === 0 && toLine === 0) {
      // Clear highlights
      editorView.dispatch({
        effects: changeMultiLineHighlightEffect.of([])
      });
    } else {
      const lines = [];
      for (let i = fromLine; i <= toLine; i++) {
        lines.push(i);
      }
      editorView.dispatch({
        effects: changeMultiLineHighlightEffect.of(lines)
      });
    }
  }

  setMultipleLineHighlights(lines: number[]) {
    const editorView = this.getEditorView();
    if (!editorView) {
      return;
    }

    // Now we can directly pass the array of lines
    editorView.dispatch({
      effects: changeMultiLineHighlightEffect.of(lines)
    });
  }

  setInformationWidgetData(data: InformationWidgetData) {
    this.store.getState().setInformationWidgetData(data);
  }

  setBreakpoints(breakpoints: number[]) {
    this.store.getState().setBreakpoints(breakpoints);
    this.applyBreakpoints(breakpoints);
  }

  // Apply breakpoints to the editor
  applyBreakpoints(breakpoints: number[]) {
    const editorView = this.getEditorView();
    if (!editorView) {
      return;
    }

    // Get current breakpoints from the editor
    const currentBreakpoints = getBreakpointLines(editorView);

    // Remove breakpoints that are no longer needed
    const effects = [];
    for (const line of currentBreakpoints) {
      if (!breakpoints.includes(line)) {
        try {
          const pos = editorView.state.doc.line(line).from;
          effects.push(breakpointEffect.of({ pos, on: false }));
        } catch (error) {
          console.warn(`Failed to remove breakpoint at line ${line}:`, error);
        }
      }
    }

    // Add new breakpoints
    for (const line of breakpoints) {
      if (!currentBreakpoints.includes(line) && line >= 1 && line <= editorView.state.doc.lines) {
        try {
          const pos = editorView.state.doc.line(line).from;
          effects.push(breakpointEffect.of({ pos, on: true }));
        } catch (error) {
          console.warn(`Failed to add breakpoint at line ${line}:`, error);
        }
      }
    }

    if (effects.length > 0) {
      editorView.dispatch({ effects });
    }
  }

  setShouldAutoRunCode(shouldAutoRun: boolean) {
    this.store.getState().setShouldAutoRunCode(shouldAutoRun);
  }

  // Methods to apply editor effects directly through the orchestrator
  applyInformationWidgetData(data: InformationWidgetData) {
    const editorView = this.getEditorView();
    if (!editorView) {
      return;
    }

    editorView.dispatch({
      effects: informationWidgetDataEffect.of(data)
    });
  }

  applyShouldShowInformationWidget(show: boolean) {
    const editorView = this.getEditorView();
    if (!editorView) {
      return;
    }

    editorView.dispatch({
      effects: showInfoWidgetEffect.of(show)
    });
  }

  applyReadonlyCompartment(readonly: boolean) {
    const editorView = this.getEditorView();
    if (!editorView) {
      return;
    }

    editorView.dispatch({
      effects: readonlyCompartment.reconfigure([EditorViewClass.editable.of(!readonly)])
    });
  }

  applyHighlightLine(highlightedLine: number) {
    const editorView = this.getEditorView();
    if (!editorView) {
      return;
    }

    // Always dispatch the effect, even for 0 (clear)
    editorView.dispatch({
      effects: changeLineEffect.of(highlightedLine)
    });
  }

  applyHighlightLineColor(highlightedLineColor: string) {
    const editorView = this.getEditorView();
    if (!editorView) {
      return;
    }

    if (highlightedLineColor) {
      editorView.dispatch({
        effects: changeColorEffect.of(highlightedLineColor)
      });
    }
  }

  applyUnderlineRange(range: UnderlineRange | undefined) {
    const editorView = this.getEditorView();
    if (!editorView) {
      return;
    }

    // Always dispatch the effect - for clearing, pass {from: 0, to: 0}
    const effectRange = range || { from: 0, to: 0 };
    editorView.dispatch({
      effects: addUnderlineEffect.of(effectRange)
    });

    // Only scroll if we're adding an underline (not clearing)
    if (range) {
      const line = document.querySelector(".cm-underline");
      if (line) {
        line.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    }
  }

  // Error store public methods
  setHasUnhandledError(hasError: boolean) {
    this.store.getState().setHasUnhandledError(hasError);
  }

  setUnhandledErrorBase64(errorData: string) {
    this.store.getState().setUnhandledErrorBase64(errorData);
  }

  // Protected state accessor methods from stateAccessors.ts
  protected getCode = getCode.bind(this);
  protected getOutput = getOutput.bind(this);
  protected getStatus = getStatus.bind(this);
  protected getError = getError.bind(this);
  protected getHasCodeBeenEdited = getHasCodeBeenEdited.bind(this);
  protected getIsSpotlightActive = getIsSpotlightActive.bind(this);
  protected getFoldedLines = getFoldedLines.bind(this);
  protected getCurrentTest = getCurrentTest.bind(this);
  protected getCurrentTestFrames = getCurrentTestFrames.bind(this);
  protected getCurrentTestAnimationTimeline = getCurrentTestAnimationTimeline.bind(this);
  protected getCurrentTestTimelineTime = getCurrentTestTimelineTime.bind(this);
  protected hasValidTest = hasValidTest.bind(this);

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

  // Initialize editor with code, exercise data, and localStorage synchronization
  initializeEditor(code: any, exercise: any, unfoldableFunctionNames: string[]) {
    // Load from localStorage first
    const localStorageResult = loadCodeMirrorContent(this.exerciseUuid);

    if (
      localStorageResult.success &&
      localStorageResult.data &&
      code.storedAt &&
      // If the code on the server is newer than in localStorage, use server code
      // Code on the server must be newer by at least a minute
      new Date(localStorageResult.data.storedAt).getTime() < new Date(code.storedAt).getTime() - 60000
    ) {
      // Use server code and save to localStorage
      this.setDefaultCode(code.code);
      this.setupEditor(unfoldableFunctionNames, {
        code: code.code,
        readonlyRanges: code.readonlyRanges
      });

      // Save the newer server code to localStorage
      saveCodeMirrorContent(this.exerciseUuid, code.code, code.readonlyRanges);
    } else if (localStorageResult.success && localStorageResult.data) {
      // Use localStorage code
      this.setDefaultCode(localStorageResult.data.code);
      this.setupEditor(unfoldableFunctionNames, {
        code: localStorageResult.data.code,
        readonlyRanges: localStorageResult.data.readonlyRanges ?? []
      });
    } else {
      // No localStorage data, use provided code
      this.setDefaultCode(code.code || "");
      this.setupEditor(unfoldableFunctionNames, {
        code: code.code || "",
        readonlyRanges: code.readonlyRanges || []
      });
    }
  }

  // Reset editor to stub code and save to localStorage
  resetEditorToStub(
    stubCode: string,
    defaultReadonlyRanges: { from: number; to: number }[],
    unfoldableFunctionNames: string[]
  ) {
    if (!this.editorHandler) {
      return;
    }

    // Save reset to localStorage
    saveCodeMirrorContent(this.exerciseUuid, stubCode, defaultReadonlyRanges);

    // Clear editor first
    this.setupEditor(unfoldableFunctionNames, {
      code: "",
      readonlyRanges: []
    });

    // Then set the stub code
    this.setupEditor(unfoldableFunctionNames, {
      code: stubCode,
      readonlyRanges: defaultReadonlyRanges
    });
  }

  // Private method for setting up the editor with code and readonly ranges
  private setupEditor(
    unfoldableFunctionNames: string[],
    { readonlyRanges, code }: { readonlyRanges?: { from: number; to: number }[]; code: string }
  ) {
    if (!this.editorView) {
      return;
    }

    // This needs to happen before the code is added.
    updateUnfoldableFunctions(this.editorView, unfoldableFunctionNames);

    if (code) {
      this.editorView.dispatch({
        changes: {
          from: 0,
          to: this.editorView.state.doc.length,
          insert: code
        }
      });
    }
    if (readonlyRanges) {
      this.editorView.dispatch({
        effects: updateReadOnlyRangesEffect.of(readonlyRanges)
      });
    }
  }

  // =====================================================
  // CodeMirror Event Handler Methods
  // =====================================================

  // Low-level event factories
  private onEditorChange(...cb: Array<(update: ViewUpdate) => void>): Extension {
    return EditorViewClass.updateListener.of((update) => {
      if (update.docChanged) {
        cb.forEach((fn) => fn(update));
      }
    });
  }

  private onBreakpointChange(...cb: Array<(update: ViewUpdate) => void>): Extension {
    return this.onViewChange([breakpointEffect], ...cb);
  }

  private onFoldChange(...cb: Array<(update: ViewUpdate) => void>): Extension {
    return this.onViewChange([foldEffect, unfoldEffect], ...cb);
  }

  private onViewChange(effectTypes: StateEffectType<any>[], ...cb: Array<(update: ViewUpdate) => void>): Extension {
    return EditorViewClass.updateListener.of((update) => {
      const changed = update.transactions.some((transaction) =>
        transaction.effects.some((effect) => effectTypes.some((effectType) => effect.is(effectType)))
      );
      if (changed) {
        cb.forEach((fn) => fn(update));
      }
    });
  }

  // High-level orchestrator-specific event handlers
  createEditorChangeHandlers(shouldAutoRunCode: boolean): Extension {
    return this.onEditorChange(
      // Reset information widget
      () =>
        this.setInformationWidgetData({
          html: "",
          line: 0,
          status: "SUCCESS"
        }),

      // Reset highlighted line
      () => this.setHighlightedLine(0),

      // Auto-save content with readonly ranges
      (e) => {
        const code = e.state.doc.toString();
        const readonlyRanges = getCodeMirrorFieldValue(e.view, readOnlyRangesStateField);
        this.autoSaveContent(code, readonlyRanges);
      },

      // Set highlight color
      () => this.setHighlightedLineColor(INFO_HIGHLIGHT_COLOR),

      // Hide information widget
      () => this.setShouldShowInformationWidget(false),

      // Mark code as edited
      () => this.setHasCodeBeenEdited(true),

      // Clear underline range
      () => this.setUnderlineRange(undefined),

      // Update breakpoints
      () => {
        const view = this.getEditorView();
        if (view) {
          this.setBreakpoints(getBreakpointLines(view));
        }
      },

      // Update folded lines
      () => {
        const view = this.getEditorView();
        if (view) {
          this.setFoldedLines(getCodeMirrorFoldedLines(view));
        }
      },

      // Auto-run code if enabled
      () => {
        if (shouldAutoRunCode) {
          this.handleRunCode();
        }
      },

      // Trigger custom callback
      () => {
        const view = this.getEditorView();
        if (view) {
          this.callOnEditorChangeCallback(view);
        }
      }
    );
  }

  createBreakpointChangeHandler(): Extension {
    return this.onBreakpointChange(() => {
      const view = this.getEditorView();
      if (view) {
        this.setBreakpoints(getBreakpointLines(view));
      }
    });
  }

  createFoldChangeHandler(): Extension {
    return this.onFoldChange(() => {
      const view = this.getEditorView();
      if (view) {
        this.setFoldedLines(getCodeMirrorFoldedLines(view));
      }
    });
  }
}

// Re-export the hook from store.ts
export { useOrchestratorStore } from "./orchestrator/store";

export default Orchestrator;
export type { Orchestrator };
