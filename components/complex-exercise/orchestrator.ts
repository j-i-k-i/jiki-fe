// This is an orchestration class for the whole page.
// When the page loads, this is created and then is the thing that's
// passed around, controls the state, etc.

import { createStore, type StoreApi } from "zustand/vanilla";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { subscribeWithSelector } from "zustand/middleware";
import type { Frame, AnimationTimeline } from "./stubs";
import { getNearestCurrentFrame } from "./orchestrator/methods/frameMethods";

interface TestState {
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
}

// Private actions only accessible within the orchestrator
interface OrchestratorActions {
  setCode: (code: string) => void;
  setOutput: (output: string) => void;
  setStatus: (status: OrchestratorState["status"]) => void;
  setError: (error: string | null) => void;
  setCurrentTest: (test: TestState | null) => void;
  setTimelineValue: (value: number) => void;
  setHasCodeBeenEdited: (value: boolean) => void;
  setIsSpotlightActive: (value: boolean) => void;
  reset: () => void;
}

type OrchestratorStore = OrchestratorState & OrchestratorActions;

class Orchestrator {
  exerciseUuid: string;
  readonly store: StoreApi<OrchestratorStore>; // Made readonly instead of private for methods to access
  protected _cachedCurrentFrame: Frame | null | undefined; // undefined means needs recalculation, not private so methods can access

  constructor(exerciseUuid: string, initialCode: string) {
    this.exerciseUuid = exerciseUuid;

    // Temporary mock test data for testing the scrubber
    const mockTest: TestState = {
      frames: [
        { time: 0, timelineTime: 0, line: 1, status: "SUCCESS", description: "Start" } as Frame,
        { time: 0.01, timelineTime: 1, line: 2, status: "SUCCESS", description: "Line 2" } as Frame,
        { time: 0.02, timelineTime: 2, line: 3, status: "SUCCESS", description: "Line 3" } as Frame,
        { time: 0.03, timelineTime: 3, line: 4, status: "SUCCESS", description: "Line 4" } as Frame,
        { time: 0.04, timelineTime: 4, line: 5, status: "SUCCESS", description: "End" } as Frame
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
      timelineValue: 0
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

        // Private actions - not exposed to components
        setCode: (code) => set({ code, hasCodeBeenEdited: true }),
        setOutput: (output) => set({ output }),
        setStatus: (status) => set({ status }),
        setError: (error) => set({ error }),
        setCurrentTest: (test) => set({ currentTest: test }),
        setTimelineValue: (value) =>
          set((state) => {
            if (!state.currentTest) {
              return {};
            }
            return {
              currentTest: {
                ...state.currentTest,
                timelineValue: value
              }
            };
          }),
        setHasCodeBeenEdited: (value) => set({ hasCodeBeenEdited: value }),
        setIsSpotlightActive: (value) => set({ isSpotlightActive: value }),
        reset: () =>
          set({
            code: "",
            output: "",
            status: "idle",
            error: null,
            currentTest: mockTest, // Temporary: reset to mock test for testing
            hasCodeBeenEdited: false,
            isSpotlightActive: false
          })
      }))
    );
  }

  // Expose the store so a hook can use it
  getStore() {
    return this.store;
  }

  // Public methods that use the store actions
  setCode(code: string) {
    this.store.getState().setCode(code);
  }

  setTimelineValue(value: number) {
    this._cachedCurrentFrame = undefined; // Invalidate cache
    this.store.getState().setTimelineValue(value);
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

  // Method from frameMethods.ts
  getNearestCurrentFrame = getNearestCurrentFrame.bind(this);

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
      isSpotlightActive: state.isSpotlightActive
    }))
  );
}

export default Orchestrator;
export type { Orchestrator };
