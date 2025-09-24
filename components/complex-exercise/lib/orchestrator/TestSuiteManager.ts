import type { StoreApi } from "zustand/vanilla";
import type { TestResult, TestSuiteResult } from "../test-results-types";
import type { OrchestratorStore, ProcessedExpect } from "../types";

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
   * Get processed expects for the current test
   */
  getProcessedExpects(): ProcessedExpect[] {
    const currentTest = this.store.getState().currentTest;
    if (!currentTest) {
      return [];
    }
    // currentTest now has TestResult properties merged in
    const result = currentTest as unknown as TestResult;
    return this.processExpects(result);
  }

  /**
   * Get the first failing expect for the current test
   */
  getFirstFailingExpect(): ProcessedExpect | null {
    const currentTest = this.store.getState().currentTest;
    if (!currentTest) {
      return null;
    }
    // currentTest now has TestResult properties merged in
    const result = currentTest as unknown as TestResult;
    return this.getFirstFailingExpectInternal(result);
  }

  /**
   * Get the first expect (failing or first overall) for the current test
   */
  getFirstExpect(): ProcessedExpect | null {
    const firstFailing = this.getFirstFailingExpect();
    const processed = this.getProcessedExpects();
    return firstFailing || processed[0] || null;
  }

  /**
   * Find the first failing expect in a test result
   */
  private getFirstFailingExpectInternal(result: TestResult | null): ProcessedExpect | null {
    if (!result) {
      return null;
    }

    for (const expect of result.expects) {
      if (expect.pass === false) {
        return {
          errorHtml: expect.errorHtml,
          actual: expect.actual,
          pass: expect.pass,
          diff: []
        };
      }
    }
    return null;
  }

  /**
   * Process all expects in a test result into ProcessedExpect format
   */
  private processExpects(result: TestResult | null): ProcessedExpect[] {
    if (!result) {
      return [];
    }

    return result.expects.map((expect) => {
      // Always state expect
      return {
        errorHtml: expect.errorHtml,
        actual: expect.actual,
        pass: expect.pass,
        diff: []
      };
    });
  }
}
