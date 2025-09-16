// This is an orchestration class for the whole page.
// When the page loads, this is created and then is the thing that's
// passed around, controls the state, etc.

import { createStore, StoreApi } from "zustand/vanilla";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { subscribeWithSelector } from "zustand/middleware";

import { scrollToLine } from "../CodeMirror/scrollToLine";

// Public read-only state that components can access
export interface OrchestratorState {
  exerciseUuid: string;
  code: string;
  output: string;
  status: "idle" | "running" | "success" | "error";
  error: string | null;
}

// Private actions only accessible within the orchestrator
interface OrchestratorActions {
  setCode: (code: string) => void;
  setOutput: (output: string) => void;
  setStatus: (status: OrchestratorState["status"]) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

type OrchestratorStore = OrchestratorState & OrchestratorActions;

class Orchestrator {
  exerciseUuid: string;
  private store: StoreApi<OrchestratorStore>;

  constructor(exerciseUuid: string, initialCode: string) {
    this.exerciseUuid = exerciseUuid;

    // Create instance-specific store
    this.store = createStore<OrchestratorStore>()(
      subscribeWithSelector((set) => ({
        exerciseUuid,
        code: initialCode,
        output: "",
        status: "idle",
        error: null,

        // Private actions - not exposed to components
        setCode: (code) => set({ code }),
        setOutput: (output) => set({ output }),
        setStatus: (status) => set({ status }),
        setError: (error) => set({ error }),
        reset: () =>
          set({
            code: "",
            output: "",
            status: "idle",
            error: null,
          }),
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

  async runCode() {
    const state = this.store.getState();
    state.setStatus("running");
    state.setError(null);

    try {
      // Simulate running code
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
export function useOrchestratorStore(
  orchestrator: Orchestrator
): OrchestratorState {
  return useStore(
    orchestrator.getStore(),
    useShallow((state) => ({
      exerciseUuid: state.exerciseUuid,
      code: state.code,
      output: state.output,
      status: state.status,
      error: state.error,
    }))
  );
}

export default Orchestrator;
