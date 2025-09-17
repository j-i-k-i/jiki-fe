// This is an orchestration class for the whole page.
// When the page loads, this is created and then is the thing that's
// passed around, controls the state, etc.

import type { EditorView } from "@codemirror/view";
import { useStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { createStore, type StoreApi } from "zustand/vanilla";
import { updateReadOnlyRangesEffect } from "../ui/codemirror/extensions/read-only-ranges/readOnlyRanges";
import { updateUnfoldableFunctions } from "../ui/codemirror/unfoldableFunctionNames";
import { loadCodeMirrorContent, saveCodeMirrorContent } from "./localStorage";
import { findNextFrame, getNearestCurrentFrame } from "./orchestrator/frameMethods";
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
import type { AnimationTimeline, Frame } from "./stubs";
import type { OrchestratorState, TestState } from "./types";

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

// Private actions only accessible within the orchestrator
interface OrchestratorActions {
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

type OrchestratorStore = OrchestratorState & OrchestratorActions;

class Orchestrator {
  exerciseUuid: string;
  readonly store: StoreApi<OrchestratorStore>; // Made readonly instead of private for methods to access
  protected _cachedCurrentFrame: Frame | null | undefined; // undefined means needs recalculation, not private so methods can access
  private editorView: EditorView | null = null;
  private editorHandler: any = null; // Handler from CodeMirror component

  constructor(exerciseUuid: string, initialCode: string) {
    this.exerciseUuid = exerciseUuid;

    // Temporary mock test data for testing the scrubber
    const mockTest: TestState = {
      frames: [
        { interpreterTime: 0, timelineTime: 0, line: 1, status: "SUCCESS", description: "Start" } as Frame,
        { interpreterTime: 1, timelineTime: 100, line: 2, status: "SUCCESS", description: "Line 2" } as Frame,
        { interpreterTime: 2, timelineTime: 200, line: 3, status: "SUCCESS", description: "Line 3" } as Frame,
        { interpreterTime: 3, timelineTime: 300, line: 4, status: "SUCCESS", description: "Line 4" } as Frame,
        { interpreterTime: 4, timelineTime: 400, line: 5, status: "SUCCESS", description: "End" } as Frame
      ],
      animationTimeline: {
        duration: 5,
        paused: true,
        seek: (_time: number) => {},
        play: () => {},
        pause: () => {},
        progress: 0,
        currentTime: 0,
        completed: false,
        hasPlayedOrScrubbed: false,
        seekEndOfTimeline: () => {},
        onUpdate: () => {},
        timeline: {
          duration: 5,
          currentTime: 0
        }
      } as AnimationTimeline,
      timelineTime: 0
    };

    // Create instance-specific store
    this.store = createStore<OrchestratorStore>()(
      subscribeWithSelector((set, _get) => ({
        exerciseUuid,
        code: initialCode,
        output: "",
        status: "idle",
        error: null,
        currentTest: mockTest, // Temporary: using mock test instead of null
        hasCodeBeenEdited: false,
        isSpotlightActive: false,
        foldedLines: [],

        // Editor store state
        defaultCode: initialCode,
        readonly: false,
        shouldShowInformationWidget: false,
        underlineRange: undefined,
        highlightedLineColor: "",
        highlightedLine: 0,
        informationWidgetData: { html: "", line: 0, status: "SUCCESS" },
        breakpoints: [],
        shouldAutoRunCode: false,

        // Error store state
        hasUnhandledError: false,
        unhandledErrorBase64: "",

        // Editor handler state
        latestValueSnapshot: undefined as string | undefined,

        // Private actions - not exposed to components
        setCode: (code) => set({ code, hasCodeBeenEdited: true }),
        setOutput: (output) => set({ output }),
        setStatus: (status) => set({ status }),
        setError: (error) => set({ error }),
        setCurrentTest: (test) => set({ currentTest: test }),
        setCurrentTestTimelineTime: (time) =>
          set((state) => {
            if (!state.currentTest) {
              return {};
            }
            return {
              currentTest: {
                ...state.currentTest,
                timelineTime: time
              }
            };
          }),
        setHasCodeBeenEdited: (value) => set({ hasCodeBeenEdited: value }),
        setIsSpotlightActive: (value) => set({ isSpotlightActive: value }),
        setFoldedLines: (lines) => {
          this._cachedCurrentFrame = undefined; // Invalidate cache when folded lines change
          set({ foldedLines: lines });
        },

        // Editor store actions
        setDefaultCode: (code) => set({ defaultCode: code }),
        setReadonly: (readonly) => set({ readonly }),
        setShouldShowInformationWidget: (show) => set({ shouldShowInformationWidget: show }),
        setUnderlineRange: (range) => set({ underlineRange: range }),
        setHighlightedLineColor: (color) => set({ highlightedLineColor: color }),
        setHighlightedLine: (line) => set({ highlightedLine: line }),
        setInformationWidgetData: (data) => set({ informationWidgetData: data }),
        setBreakpoints: (breakpoints) => set({ breakpoints }),
        setShouldAutoRunCode: (shouldAutoRun) => set({ shouldAutoRunCode: shouldAutoRun }),

        // Error store actions
        setHasUnhandledError: (hasError) => set({ hasUnhandledError: hasError }),
        setUnhandledErrorBase64: (errorData) => set({ unhandledErrorBase64: errorData }),

        // Editor handler actions
        setLatestValueSnapshot: (value) => set({ latestValueSnapshot: value }),
        reset: () =>
          set({
            code: "",
            output: "",
            status: "idle",
            error: null,
            currentTest: mockTest, // Temporary: reset to mock test for testing
            hasCodeBeenEdited: false,
            isSpotlightActive: false,
            foldedLines: [],

            // Reset editor store state
            defaultCode: "",
            readonly: false,
            shouldShowInformationWidget: false,
            underlineRange: undefined,
            highlightedLineColor: "",
            highlightedLine: 0,
            informationWidgetData: { html: "", line: 0, status: "SUCCESS" },
            breakpoints: [],
            shouldAutoRunCode: false,

            // Reset error store state
            hasUnhandledError: false,
            unhandledErrorBase64: "",

            // Reset editor handler state
            latestValueSnapshot: undefined
          })
      }))
    );
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
    this._cachedCurrentFrame = undefined; // Invalidate cache
    const state = this.store.getState();
    state.setCurrentTestTimelineTime(time);
    // Also seek the animation timeline if it exists
    const animationTimeline = state.currentTest?.animationTimeline;
    if (animationTimeline) {
      animationTimeline.seek(time / 100);
    }
  }

  setCurrentTestInterpreterTime(interpreterTime: number) {
    this.setCurrentTestTimelineTime(interpreterTime * 100);
  }

  setCurrentTest(test: TestState | null) {
    this._cachedCurrentFrame = undefined; // Invalidate cache when test changes
    this.store.getState().setCurrentTest(test);
  }

  setHasCodeBeenEdited(value: boolean) {
    this.store.getState().setHasCodeBeenEdited(value);
  }

  setIsSpotlightActive(value: boolean) {
    this.store.getState().setIsSpotlightActive(value);
  }

  setFoldedLines(lines: number[]) {
    this.store.getState().setFoldedLines(lines);
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

  setInformationWidgetData(data: InformationWidgetData) {
    this.store.getState().setInformationWidgetData(data);
  }

  setBreakpoints(breakpoints: number[]) {
    this.store.getState().setBreakpoints(breakpoints);
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

  // Methods from frameMethods.ts
  getNearestCurrentFrame = getNearestCurrentFrame.bind(this);
  findNextFrame = findNextFrame.bind(this);

  async runCode() {
    const state = this.store.getState();
    state.setStatus("running");
    state.setError(null);

    try {
      // Simulate running code
      // eslint-disable-next-line no-console
      console.log("Running code:", this.store.getState().code);

      // Simulate async execution
      await new Promise((resolve) => setTimeout(resolve, 500));

      const output = `Running exercise ${this.exerciseUuid}...\n\n> ${this.store.getState().code}\n\nOutput: Hello, World!`;
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
}

// Hook to use with an orchestrator instance
export function useOrchestratorStore(orchestrator: Orchestrator): OrchestratorState {
  return useStore(
    orchestrator.getStore(),
    useShallow((state) => ({
      exerciseUuid: state.exerciseUuid,
      code: state.code,
      output: state.output,
      status: state.status,
      error: state.error,
      currentTest: state.currentTest,
      hasCodeBeenEdited: state.hasCodeBeenEdited,
      isSpotlightActive: state.isSpotlightActive,
      foldedLines: state.foldedLines,

      // Editor store state
      defaultCode: state.defaultCode,
      readonly: state.readonly,
      shouldShowInformationWidget: state.shouldShowInformationWidget,
      underlineRange: state.underlineRange,
      highlightedLineColor: state.highlightedLineColor,
      highlightedLine: state.highlightedLine,
      informationWidgetData: state.informationWidgetData,
      breakpoints: state.breakpoints,
      shouldAutoRunCode: state.shouldAutoRunCode,

      // Error store state
      hasUnhandledError: state.hasUnhandledError,
      unhandledErrorBase64: state.unhandledErrorBase64,

      // Editor handler state
      latestValueSnapshot: state.latestValueSnapshot
    }))
  );
}

export default Orchestrator;
export type { Orchestrator };
