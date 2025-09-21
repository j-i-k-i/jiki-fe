import { useStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { createStore, type StoreApi } from "zustand/vanilla";
import { TimelineManager } from "./TimelineManager";
import { BreakpointManager } from "./BreakpointManager";
import { mockTest } from "./mocks";
import type { OrchestratorState, OrchestratorStore, TestState } from "../types";
import type { Frame } from "../stubs";

// Helper function to recalculate navigation frames (prev/next)
function recalculateNavigationFrames(
  currentTest: TestState,
  foldedLines: number[]
): {
  prevFrame: Frame | undefined;
  nextFrame: Frame | undefined;
} {
  const prevFrame = TimelineManager.findPrevFrame(currentTest.frames, currentTest.timelineTime, foldedLines);
  const nextFrame = TimelineManager.findNextFrame(currentTest.frames, currentTest.timelineTime, foldedLines);

  return { prevFrame, nextFrame };
}

// Helper function to recalculate breakpoint frames
function recalculateBreakpointFrames(
  currentTest: TestState,
  breakpoints: number[],
  foldedLines: number[]
): {
  prevBreakpointFrame: Frame | undefined;
  nextBreakpointFrame: Frame | undefined;
} {
  const prevBreakpointFrame = BreakpointManager.findPrevBreakpointFrame(
    currentTest.currentFrame,
    currentTest.frames,
    breakpoints,
    foldedLines
  );
  const nextBreakpointFrame = BreakpointManager.findNextBreakpointFrame(
    currentTest.currentFrame,
    currentTest.frames,
    breakpoints,
    foldedLines
  );

  return { prevBreakpointFrame, nextBreakpointFrame };
}

// Factory function to create an instance-specific store
export function createOrchestratorStore(exerciseUuid: string, initialCode: string): StoreApi<OrchestratorStore> {
  return createStore<OrchestratorStore>()(
    subscribeWithSelector((set, get) => ({
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
      setCurrentTest: (test) =>
        set({
          currentTest: test,
          // Update highlighted line when setting a new test
          highlightedLine: test?.currentFrame?.line ?? 0
        }),
      setCurrentFrame: (frame) =>
        set((state) => {
          if (!state.currentTest) {
            return {};
          }

          const tempTestState = { ...state.currentTest, currentFrame: frame };

          // Recalculate breakpoint frames when current frame changes
          const { prevBreakpointFrame, nextBreakpointFrame } = recalculateBreakpointFrames(
            tempTestState,
            state.breakpoints,
            state.foldedLines
          );

          return {
            currentTest: {
              ...state.currentTest,
              currentFrame: frame,
              prevBreakpointFrame,
              nextBreakpointFrame
            },
            // Update highlighted line to match the new frame
            highlightedLine: frame.line
          };
        }),
      setCurrentTestTimelineTime: (time) => {
        set((state) => {
          if (!state.currentTest) {
            return {};
          }

          // Update timeline time and navigation frames
          const tempTestState = { ...state.currentTest, timelineTime: time };
          const { prevFrame, nextFrame } = recalculateNavigationFrames(tempTestState, state.foldedLines);

          return {
            currentTest: {
              ...state.currentTest,
              timelineTime: time,
              prevFrame,
              nextFrame
            }
          };
        });

        // Check if we landed on an exact frame and update if so
        const state = get();
        if (state.currentTest) {
          const exactFrame = state.currentTest.frames.find((f) => f.timelineTime === time);
          if (exactFrame) {
            state.setCurrentFrame(exactFrame);
          }
        }
      },
      setHasCodeBeenEdited: (value) => set({ hasCodeBeenEdited: value }),
      setIsSpotlightActive: (value) => set({ isSpotlightActive: value }),
      setFoldedLines: (lines) =>
        set((state) => {
          if (!state.currentTest) {
            return { foldedLines: lines };
          }

          // Recalculate navigation frames (affected by folded lines)
          const { prevFrame, nextFrame } = recalculateNavigationFrames(state.currentTest, lines);

          // Recalculate breakpoint frames (affected by folded lines)
          const { prevBreakpointFrame, nextBreakpointFrame } = recalculateBreakpointFrames(
            state.currentTest,
            state.breakpoints,
            lines
          );

          return {
            foldedLines: lines,
            currentTest: {
              ...state.currentTest,
              prevFrame,
              nextFrame,
              prevBreakpointFrame,
              nextBreakpointFrame
            }
          };
        }),

      // Editor store actions
      setDefaultCode: (code) => set({ defaultCode: code }),
      setReadonly: (readonly) => set({ readonly }),
      setShouldShowInformationWidget: (show) => set({ shouldShowInformationWidget: show }),
      setUnderlineRange: (range) => set({ underlineRange: range }),
      setHighlightedLineColor: (color) => set({ highlightedLineColor: color }),
      setHighlightedLine: (line) => set({ highlightedLine: line }),
      setInformationWidgetData: (data) => set({ informationWidgetData: data }),
      setBreakpoints: (breakpoints) =>
        set((state) => {
          if (!state.currentTest) {
            return { breakpoints };
          }

          // Only recalculate breakpoint frames (breakpoints don't affect navigation frames)
          const { prevBreakpointFrame, nextBreakpointFrame } = recalculateBreakpointFrames(
            state.currentTest,
            breakpoints,
            state.foldedLines
          );

          return {
            breakpoints,
            currentTest: {
              ...state.currentTest,
              prevBreakpointFrame,
              nextBreakpointFrame
            }
          };
        }),
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

// Hook to use with an orchestrator instance
export function useOrchestratorStore(orchestrator: { getStore: () => StoreApi<OrchestratorStore> }): OrchestratorState {
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
