import type { StoreApi } from "zustand/vanilla";
import type { TestExpect } from "../test-results-types";
import type { OrchestratorStore } from "../types";
import type { ExerciseDefinition } from "@jiki/curriculum";

/**
 * Manages test suite execution, results, and processing
 */
export class TestSuiteManager {
  constructor(private readonly store: StoreApi<OrchestratorStore>) {}

  /**
   * Run tests on the provided code
   */
  async runCode(code: string, exercise: ExerciseDefinition): Promise<void> {
    const state = this.store.getState();
    state.setStatus("running");
    state.setError(null);

    try {
      // Import and run our new test runner
      const { runTests } = await import("../test-runner/runTests");
      const testResults = runTests(code, exercise);

      // Set the results in the store (will also set the first test as current)
      state.setTestSuiteResult(testResults);

      state.setStatus("success");
    } catch (error) {
      state.setError(error instanceof Error ? error.message : "Unknown error");
      state.setStatus("error");
    }
  }

  /**
   * Get the first expect (failing or first overall) for the current test
   */
  getFirstExpect(): TestExpect | null {
    const currentTest = this.store.getState().currentTest;
    if (!currentTest) {
      return null;
    }
    const firstFailing = currentTest.expects.find((expect) => expect.pass === false);
    return firstFailing || currentTest.expects[0] || null;
  }
}
