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
    console.log("[TestSuiteManager] Setting test suite result:", result);
    this.store.getState().setTestSuiteResult(result);
  }

  /**
   * Set the bonus test suite result in the store
   */
  setBonusTestSuiteResult(result: TestSuiteResult | null): void {
    this.store.getState().setBonusTestSuiteResult(result);
  }

  /**
   * Set the current test from a test result, merging NewTestResult properties into TestState
   */
  setCurrentTestFromResult(result: NewTestResult | null): void {
    console.log("[TestSuiteManager] Setting current test from result:", result?.slug);
    console.log("[TestSuiteManager] Has animationTimeline:", !!result?.animationTimeline);
    console.log("[TestSuiteManager] Frames count:", result?.frames?.length || 0);

    if (!result || !result.animationTimeline) {
      console.log("[TestSuiteManager] No result or animationTimeline, setting currentTest to null");
      this.store.getState().setCurrentTest(null);
      return;
    }

    const testState = {
      // Core TestState properties
      frames: result.frames,
      animationTimeline: result.animationTimeline,
      time: result.time,
      currentFrame: result.frames.find((f) => f.time === result.time) || result.frames[0],
      prevFrame: undefined,
      nextFrame: undefined,
      prevBreakpointFrame: undefined,
      nextBreakpointFrame: undefined,
      // NewTestResult properties for display
      name: result.name,
      status: result.status,
      type: result.type,
      expects: result.expects,
      view: result.view,
      imageSlug: result.imageSlug,
      slug: result.slug
    };

    console.log("[TestSuiteManager] Created test state:", {
      slug: testState.slug,
      frames: testState.frames.length,
      hasAnimationTimeline: !!testState.animationTimeline,
      hasView: !!testState.view,
      currentFrame: testState.currentFrame
    });

    this.store.getState().setCurrentTest(testState);
    this.store.getState().setHighlightedLine(testState.currentFrame.line || 0);
  }

  /**
   * Update current test time (in microseconds)
   */
  updateCurrentTestTime(time: number): void {
    const state = this.store.getState();
    // Simply update the timeline time for the current test
    state.setCurrentTestTime(time);
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

    // Set the first test as current by default
    // Merge NewTestResult properties into TestState format
    if (mockTestResults.tests.length > 0) {
      const firstTest = mockTestResults.tests[0];
      if (firstTest.animationTimeline) {
        const testState = {
          // Core TestState properties
          frames: firstTest.frames,
          animationTimeline: firstTest.animationTimeline,
          time: firstTest.time,
          currentFrame: firstTest.frames.find((f) => f.time === firstTest.time) || firstTest.frames[0],
          prevFrame: undefined,
          nextFrame: undefined,
          prevBreakpointFrame: undefined,
          nextBreakpointFrame: undefined,
          // NewTestResult properties
          name: firstTest.name,
          status: firstTest.status,
          type: firstTest.type,
          expects: firstTest.expects,
          view: firstTest.view,
          imageSlug: firstTest.imageSlug,
          slug: firstTest.slug
        };
        this.store.getState().setCurrentTest(testState);
        this.store.getState().setHighlightedLine(testState.currentFrame.line || 0);
      }
    }
  }

  /**
   * Get processed expects for the current test
   */
  getProcessedExpects(): ProcessedExpect[] {
    const currentTest = this.store.getState().currentTest;
    if (!currentTest || !currentTest.expects) {
      return [];
    }
    // currentTest now has NewTestResult properties merged in
    const result = currentTest as unknown as NewTestResult;
    return this.processExpects(result);
  }

  /**
   * Get the first failing expect for the current test
   */
  getFirstFailingExpect(): ProcessedExpect | null {
    const currentTest = this.store.getState().currentTest;
    if (!currentTest || !currentTest.expects) {
      return null;
    }
    // currentTest now has NewTestResult properties merged in
    const result = currentTest as unknown as NewTestResult;
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
