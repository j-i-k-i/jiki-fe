import { useStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { createStore, type StoreApi } from "zustand/vanilla";
import { loadCodeMirrorContent } from "../localStorage";
import type { OrchestratorState, OrchestratorStore } from "../types";
import { BreakpointManager } from "./BreakpointManager";
import { mockTest } from "./mocks";
import { TimelineManager } from "./TimelineManager";

const ONE_MINUTE = 60 * 1000;

// Factory function to create an instance-specific store
export function createOrchestratorStore(exerciseUuid: string, initialCode: string): StoreApi<OrchestratorStore> {
  return createStore<OrchestratorStore>()(
    subscribeWithSelector((set, get) => ({
      exerciseUuid,
      exerciseTitle: "Greeting Function Exercise", // Default title
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

      // Test results state
      testSuiteResult: null,
      bonusTestSuiteResult: null,
      shouldShowBonusTasks: false,
      shouldAutoplayAnimation: false,

      // Frame navigation state (moved from currentTest to top level)
      prevFrame: undefined,
      nextFrame: undefined,
      prevBreakpointFrame: undefined,
      nextBreakpointFrame: undefined,

      // Test time persistence - maps test slugs to their current time positions
      testCurrentTimes: {},

      // Private actions - not exposed to components
      recalculateNavigationFrames: () => {
        const state = get();
        if (!state.currentTest) {
          set({
            prevFrame: undefined,
            nextFrame: undefined
          });
          return;
        }

        const prevFrame = TimelineManager.findPrevFrame(
          state.currentTest.frames,
          state.currentTest.time,
          state.foldedLines
        );
        const nextFrame = TimelineManager.findNextFrame(
          state.currentTest.frames,
          state.currentTest.time,
          state.foldedLines
        );

        set({
          prevFrame,
          nextFrame
        });
      },
      recalculateBreakpointFrames: () => {
        const state = get();
        if (!state.currentTest) {
          set({
            prevBreakpointFrame: undefined,
            nextBreakpointFrame: undefined
          });
          return;
        }

        const prevBreakpointFrame = BreakpointManager.findPrevBreakpointFrame(
          state.currentTest.currentFrame,
          state.currentTest.frames,
          state.breakpoints,
          state.foldedLines
        );
        const nextBreakpointFrame = BreakpointManager.findNextBreakpointFrame(
          state.currentTest.currentFrame,
          state.currentTest.frames,
          state.breakpoints,
          state.foldedLines
        );

        set({
          prevBreakpointFrame,
          nextBreakpointFrame
        });
      },
      setCode: (code) => set({ code, hasCodeBeenEdited: true }),
      setExerciseTitle: (title) => set({ exerciseTitle: title }),
      setOutput: (output) => set({ output }),
      setStatus: (status) => set({ status }),
      setError: (error) => set({ error }),
      setCurrentTest: (test) => {
        if (!test) {
          set({
            currentTest: test,
            highlightedLine: 0
          });
          return;
        }

        const state = get();
        // Check if we have a saved time for this test
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const savedTime = state.testCurrentTimes[test.slug];
        const timeToUse = savedTime !== undefined ? savedTime : test.time;

        // Create test with the appropriate time
        const testWithTime = {
          ...test,
          time: timeToUse
        };

        set({
          currentTest: testWithTime,
          // Update highlighted line when setting a new test
          highlightedLine: testWithTime.currentFrame?.line ?? 0
        });

        // Trigger frame calculations with the restored/initial time
        get().setCurrentTestTime(timeToUse);
      },
      setCurrentFrame: (frame) => {
        const state = get();
        if (!state.currentTest) {
          return;
        }

        set({
          currentTest: {
            ...state.currentTest,
            currentFrame: frame
          },
          highlightedLine: frame.line
        });

        // Recalculate both navigation and breakpoint frames after updating current frame
        get().recalculateNavigationFrames();
        get().recalculateBreakpointFrames();
      },
      setCurrentTestTime: (time) => {
        const state = get();
        if (!state.currentTest) {
          return;
        }

        // Update timeline time and persist it for this test
        set({
          currentTest: {
            ...state.currentTest,
            time: time
          },
          testCurrentTimes: {
            ...state.testCurrentTimes,
            [state.currentTest.slug]: time
          }
        });

        // Check if we landed on an exact frame and update if so
        const exactFrame = state.currentTest.frames.find((f) => f.time === time);
        if (exactFrame) {
          get().setCurrentFrame(exactFrame);
        }
      },
      setHasCodeBeenEdited: (value) => set({ hasCodeBeenEdited: value }),
      setIsSpotlightActive: (value) => set({ isSpotlightActive: value }),
      setFoldedLines: (lines) => {
        set({ foldedLines: lines });

        // Recalculate frames that are affected by folded lines
        get().recalculateNavigationFrames();
        get().recalculateBreakpointFrames();
      },

      // Editor store actions
      setDefaultCode: (code) => set({ defaultCode: code }),
      setReadonly: (readonly) => set({ readonly }),
      setShouldShowInformationWidget: (show) => set({ shouldShowInformationWidget: show }),
      setUnderlineRange: (range) => set({ underlineRange: range }),
      setHighlightedLineColor: (color) => set({ highlightedLineColor: color }),
      setHighlightedLine: (line) => set({ highlightedLine: line }),
      setInformationWidgetData: (data) => set({ informationWidgetData: data }),
      setBreakpoints: (breakpoints) => {
        set({ breakpoints });

        // Recalculate breakpoint frames
        get().recalculateBreakpointFrames();
      },
      setShouldAutoRunCode: (shouldAutoRun) => set({ shouldAutoRunCode: shouldAutoRun }),

      // Error store actions
      setHasUnhandledError: (hasError) => set({ hasUnhandledError: hasError }),
      setUnhandledErrorBase64: (errorData) => set({ unhandledErrorBase64: errorData }),

      // Editor handler actions
      setLatestValueSnapshot: (value) => set({ latestValueSnapshot: value }),

      // Test results actions
      setTestSuiteResult: (result) => set({ testSuiteResult: result }),
      setBonusTestSuiteResult: (result) => set({ bonusTestSuiteResult: result }),
      setShouldShowBonusTasks: (show) => set({ shouldShowBonusTasks: show }),
      setShouldAutoplayAnimation: (autoplay) => set({ shouldAutoplayAnimation: autoplay }),

      // Exercise data initialization with priority logic
      initializeExerciseData: (serverData?: {
        code: string;
        storedAt?: string;
        readonlyRanges?: { from: number; to: number }[];
      }) => {
        const localStorageResult = loadCodeMirrorContent(exerciseUuid);

        // Rule 1: No server data and no localStorage - use initial code
        if (!serverData && (!localStorageResult.success || !localStorageResult.data)) {
          set({
            code: initialCode,
            defaultCode: initialCode
          });
          return;
        }

        // Rule 2: No server data but localStorage exists - use localStorage
        if (!serverData && localStorageResult.success && localStorageResult.data) {
          set({
            code: localStorageResult.data.code,
            defaultCode: localStorageResult.data.code
          });
          return;
        }

        // Rule 3: Server data exists, check against localStorage
        if (serverData) {
          // No localStorage - use server data
          if (!localStorageResult.success || !localStorageResult.data) {
            set({
              code: serverData.code,
              defaultCode: serverData.code
            });
            return;
          }

          // Both exist - compare timestamps
          const localStorageData = localStorageResult.data;

          // If server has no timestamp, use localStorage
          if (!serverData.storedAt) {
            set({
              code: localStorageData.code,
              defaultCode: localStorageData.code
            });
            return;
          }

          // Compare timestamps - server data must be newer by at least 1 minute
          const serverTime = new Date(serverData.storedAt).getTime();
          const localTime = new Date(localStorageData.storedAt).getTime();

          // Check for invalid timestamps (NaN)
          const serverTimeValid = !isNaN(serverTime);
          const localTimeValid = !isNaN(localTime);

          // If both timestamps are invalid, use localStorage (safer default)
          if (!serverTimeValid && !localTimeValid) {
            set({
              code: localStorageData.code,
              defaultCode: localStorageData.code
            });
            return;
          }

          // If only server timestamp is invalid, use localStorage
          if (!serverTimeValid && localTimeValid) {
            set({
              code: localStorageData.code,
              defaultCode: localStorageData.code
            });
            return;
          }

          // If only localStorage timestamp is invalid, use server
          if (serverTimeValid && !localTimeValid) {
            set({
              code: serverData.code,
              defaultCode: serverData.code
            });
            return;
          }

          // Both timestamps are valid - compare them
          if (serverTime > localTime + ONE_MINUTE) {
            // Server is newer - use server data
            set({
              code: serverData.code,
              defaultCode: serverData.code
            });
          } else {
            // localStorage is newer or equal - use localStorage
            set({
              code: localStorageData.code,
              defaultCode: localStorageData.code
            });
          }
        }
      },

      reset: () =>
        set({
          code: "",
          exerciseTitle: "Greeting Function Exercise",
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
          latestValueSnapshot: undefined,

          // Reset test results state
          testSuiteResult: null,
          bonusTestSuiteResult: null,
          shouldShowBonusTasks: false,
          shouldAutoplayAnimation: false,

          // Reset frame navigation state
          prevFrame: undefined,
          nextFrame: undefined,
          prevBreakpointFrame: undefined,
          nextBreakpointFrame: undefined
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
      exerciseTitle: state.exerciseTitle,
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
      latestValueSnapshot: state.latestValueSnapshot,

      // Test results state
      testSuiteResult: state.testSuiteResult,
      bonusTestSuiteResult: state.bonusTestSuiteResult,
      shouldShowBonusTasks: state.shouldShowBonusTasks,
      shouldAutoplayAnimation: state.shouldAutoplayAnimation,

      // Frame navigation state
      prevFrame: state.prevFrame,
      nextFrame: state.nextFrame,
      prevBreakpointFrame: state.prevBreakpointFrame,
      nextBreakpointFrame: state.nextBreakpointFrame,

      // Test time persistence
      testCurrentTimes: state.testCurrentTimes
    }))
  );
}
