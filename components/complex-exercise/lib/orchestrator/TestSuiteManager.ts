import { diffChars, diffWords, type Change } from "diff";
import type { StoreApi } from "zustand/vanilla";
import { mockBonusTestResults, mockTestResults } from "../mock-test-results";
import type { NewTestResult, TestSuiteResult } from "../test-results-types";
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
   * Set the bonus test suite result in the store
   */
  setBonusTestSuiteResult(result: TestSuiteResult | null): void {
    this.store.getState().setBonusTestSuiteResult(result);
  }

  /**
   * Set the inspected test result and update related state
   */
  setInspectedTestResult(result: NewTestResult | null): void {
    this.store.getState().setInspectedTestResult(result);

    // When setting a new inspected test result, also update the current test
    // so the scrubber uses the inspected test's frame data
    if (result && result.animationTimeline) {
      const testState = {
        frames: result.frames,
        animationTimeline: result.animationTimeline,
        timelineTime: result.timelineTime,
        currentFrame: result.frames.find((f) => f.timelineTime === result.timelineTime) || result.frames[0],
        prevFrame: undefined,
        nextFrame: undefined,
        prevBreakpointFrame: undefined,
        nextBreakpointFrame: undefined
      };
      this.store.getState().setCurrentTest(testState);
      this.store.getState().setHighlightedLine(testState.currentFrame.line || 0);
    } else {
      this.store.getState().setCurrentTest(null);
    }
  }

  /**
   * Update inspected test result timeline time and sync with test suite results
   */
  updateInspectedTestTimelineTime(time: number): void {
    const state = this.store.getState();
    const inspectedTest = state.inspectedTestResult;
    if (inspectedTest) {
      const updatedTest = {
        ...inspectedTest,
        timelineTime: time
      };
      state.setInspectedTestResult(updatedTest);

      // Update the test in the test suite results as well
      if (state.testSuiteResult) {
        const updatedTests = state.testSuiteResult.tests.map((test) =>
          test.slug === inspectedTest.slug ? updatedTest : test
        );
        state.setTestSuiteResult({
          ...state.testSuiteResult,
          tests: updatedTests
        });
      }

      if (state.bonusTestSuiteResult) {
        const updatedBonusTests = state.bonusTestSuiteResult.tests.map((test) =>
          test.slug === inspectedTest.slug ? updatedTest : test
        );
        state.setBonusTestSuiteResult({
          ...state.bonusTestSuiteResult,
          tests: updatedBonusTests
        });
      }
    }
  }

  /**
   * Set whether bonus tasks should be shown
   */
  setShouldShowBonusTasks(show: boolean): void {
    this.store.getState().setShouldShowBonusTasks(show);
  }

  /**
   * Set whether animation should autoplay
   */
  setShouldAutoplayAnimation(autoplay: boolean): void {
    this.store.getState().setShouldAutoplayAnimation(autoplay);
  }

  /**
   * Run tests and generate mock results
   */
  async runTests(): Promise<void> {
    const state = this.store.getState();

    // Simulate async execution
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate mock test results
    state.setTestSuiteResult(mockTestResults);
    state.setBonusTestSuiteResult(mockBonusTestResults);

    // Set the first test as inspected by default using the manager method
    // This will properly set up the scrubber state
    if (mockTestResults.tests.length > 0) {
      this.setInspectedTestResult(mockTestResults.tests[0]);
    }
  }

  /**
   * Get processed expects for the currently inspected test
   */
  getProcessedExpects(): ProcessedExpect[] {
    const result = this.store.getState().inspectedTestResult;
    return this.processExpects(result);
  }

  /**
   * Get the first failing expect for the currently inspected test
   */
  getFirstFailingExpect(): ProcessedExpect | null {
    const result = this.store.getState().inspectedTestResult;
    return this.getFirstFailingExpectInternal(result);
  }

  /**
   * Get the first expect (failing or first overall) for the currently inspected test
   */
  getFirstExpect(): ProcessedExpect | null {
    const firstFailing = this.getFirstFailingExpect();
    const processed = this.getProcessedExpects();
    return firstFailing || processed[0] || null;
  }

  /**
   * Find the first failing expect in a test result
   */
  private getFirstFailingExpectInternal(result: NewTestResult | null): ProcessedExpect | null {
    if (!result) {
      return null;
    }

    for (const expect of result.expects) {
      if (expect.pass === false) {
        if (result.type === "state") {
          return {
            errorHtml: expect.errorHtml,
            type: result.type,
            actual: expect.actual,
            pass: expect.pass,
            diff: []
          };
        }
        // io expect
        const { expected, actual } = expect;
        return {
          ...expect,
          type: result.type,
          diff: this.getDiffOfExpectedAndActual(false, expected, actual)
        };
      }
    }
    return null;
  }

  /**
   * Process all expects in a test result into ProcessedExpect format
   */
  private processExpects(result: NewTestResult | null): ProcessedExpect[] {
    if (!result) {
      return [];
    }

    return result.expects.map((expect) => {
      if (result.type === "state") {
        // state expect
        return {
          errorHtml: expect.errorHtml,
          type: "state" as const,
          actual: expect.actual,
          pass: expect.pass,
          diff: []
        };
      }

      // io expect
      const { expected, actual } = expect;
      return {
        ...expect,
        type: result.type,
        diff: this.getDiffOfExpectedAndActual(expect.pass, expected, actual)
      };
    });
  }

  /**
   * Format a Jiki object for display
   */
  private formatJikiObject(obj: any): string {
    if (obj === null) {
      return "null";
    }
    if (obj === undefined) {
      return "undefined";
    }
    if (typeof obj === "string") {
      return obj;
    }
    if (typeof obj === "boolean") {
      return obj.toString();
    }
    if (typeof obj === "number") {
      return obj.toString();
    }
    return JSON.stringify(obj);
  }

  /**
   * Generate diff between expected and actual values
   */
  private getDiffOfExpectedAndActual(passed: boolean, expected: any, actual: any): Change[] {
    if (passed) {
      return diffChars(this.formatJikiObject(expected), this.formatJikiObject(actual));
    }

    if (actual === null || actual === undefined) {
      return [
        {
          added: false,
          count: 1,
          removed: true,
          value: this.formatJikiObject(expected)
        },
        {
          added: true,
          count: 1,
          removed: false,
          value: "[Your function didn't return anything]"
        }
      ];
    }

    if (typeof expected == "string" && typeof actual == "string") {
      return diffChars(this.formatJikiObject(expected), this.formatJikiObject(actual));
    }
    if (typeof expected == "boolean" && typeof actual == "boolean") {
      return diffWords(this.formatJikiObject(expected), this.formatJikiObject(actual));
    }

    return [
      {
        added: false,
        count: 1,
        removed: true,
        value: this.formatJikiObject(expected)
      },
      {
        added: true,
        count: 1,
        removed: false,
        value: this.formatJikiObject(actual)
      }
    ];
  }
}
