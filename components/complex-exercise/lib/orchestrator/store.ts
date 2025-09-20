import { useStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { createStore, type StoreApi } from "zustand/vanilla";
import { TimelineManager } from "./TimelineManager";
import { mockTest } from "./mocks";
import type { OrchestratorState, OrchestratorStore } from "../types";

// Factory function to create an instance-specific store
export function createOrchestratorStore(exerciseUuid: string, initialCode: string): StoreApi<OrchestratorStore> {
  return createStore<OrchestratorStore>()(
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

          // Calculate the nearest frame for the new timeline time
          const nearestFrame = TimelineManager.findNearestFrame(state.currentTest.frames, time, state.foldedLines);

          // Calculate prev/next frames using static methods
          const prevFrame = TimelineManager.findPrevFrame(state.currentTest.frames, time, state.foldedLines);
          const nextFrame = TimelineManager.findNextFrame(state.currentTest.frames, time, state.foldedLines);

          return {
            currentTest: {
              ...state.currentTest,
              timelineTime: time,
              currentFrame: nearestFrame,
              prevFrame,
              nextFrame
            }
          };
        }),
      setHasCodeBeenEdited: (value) => set({ hasCodeBeenEdited: value }),
      setIsSpotlightActive: (value) => set({ isSpotlightActive: value }),
      setFoldedLines: (lines) => {
        set((state) => {
          // Update folded lines
          const newState: any = { foldedLines: lines };

          // If we have a current test, recalculate prev/next frames
          if (state.currentTest) {
            const prevFrame = TimelineManager.findPrevFrame(
              state.currentTest.frames,
              state.currentTest.timelineTime,
              lines
            );
            const nextFrame = TimelineManager.findNextFrame(
              state.currentTest.frames,
              state.currentTest.timelineTime,
              lines
            );

            newState.currentTest = {
              ...state.currentTest,
              prevFrame,
              nextFrame
            };
          }

          return newState;
        });
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
