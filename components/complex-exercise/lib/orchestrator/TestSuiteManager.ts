import type { StoreApi } from "zustand/vanilla";
import type { TestExpect, TestResult, TestSuiteResult } from "../test-results-types";
import type { OrchestratorStore } from "../types";

/**
 * Manages test suite execution, results, and processing
 */
export class TestSuiteManager {
  constructor(private readonly store: StoreApi<OrchestratorStore>) {}

  /**
   * Set the test suite result in the store
   */
  setTestSuiteResult(result: TestSuiteResult | null): void {
    this.store.getState().setTestSuiteResult(result);
  }

  /**
   * Set the current test from a test result
   * The store's setCurrentTest will internally trigger setCurrentTestTime
   */
  setCurrentTestFromResult(result: TestResult | null): void {
    // Just pass it through - the store handles triggering frame calculations
    this.store.getState().setCurrentTest(result);
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
