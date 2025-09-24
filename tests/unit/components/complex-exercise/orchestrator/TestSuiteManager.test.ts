import { TestSuiteManager } from "@/components/complex-exercise/lib/orchestrator/TestSuiteManager";
import type { TestResult } from "@/components/complex-exercise/lib/test-results-types";
import type { OrchestratorStore } from "@/components/complex-exercise/lib/types";
import type { StoreApi } from "zustand/vanilla";

// Mock AnimationTimeline
const mockAnimationTimeline = {
  duration: 400000,
  paused: true,
  seek: jest.fn(),
  play: jest.fn(),
  pause: jest.fn()
};

describe("TestSuiteManager", () => {
  let store: StoreApi<OrchestratorStore>;
  let testSuiteManager: TestSuiteManager;

  beforeEach(() => {
    // Create a mock store
    const storeState = {
      setTestSuiteResult: jest.fn(),
      setCurrentTest: jest.fn(),
      setHighlightedLine: jest.fn()
    };

    store = {
      getState: jest.fn(() => storeState),
      setState: jest.fn(),
      subscribe: jest.fn(),
      destroy: jest.fn()
    } as unknown as StoreApi<OrchestratorStore>;

    testSuiteManager = new TestSuiteManager(store);
  });

  describe("setCurrentTestFromResult", () => {
    it("should pass test result directly to store", () => {
      const mockFrames = [
        { time: 100000, timeInMs: 100, status: "SUCCESS", line: 1 },
        { time: 200000, timeInMs: 200, status: "SUCCESS", line: 2 },
        { time: 300000, timeInMs: 300, status: "SUCCESS", line: 3 }
      ];

      const testResult: TestResult = {
        slug: "test-1",
        name: "Test 1",
        status: "pass",
        expects: [],
        frames: mockFrames as any,
        time: 100000, // Start at first frame
        animationTimeline: mockAnimationTimeline as any,
        codeRun: "test()",
        view: document.createElement("div")
      };

      testSuiteManager.setCurrentTestFromResult(testResult);

      // Should pass the test result directly to the store
      expect(store.getState().setCurrentTest).toHaveBeenCalledWith(testResult);
    });

    // Navigation properties are now calculated by the store's setCurrentTestTime
    // which is called internally by setCurrentTest

    it("should handle null result", () => {
      testSuiteManager.setCurrentTestFromResult(null);

      expect(store.getState().setCurrentTest).toHaveBeenCalledWith(null);
    });

    it("should pass result directly to setCurrentTest", () => {
      const testResult: TestResult = {
        slug: "test-1",
        name: "Test 1",
        status: "pass",
        expects: [],
        frames: [],
        time: 0,
        animationTimeline: mockAnimationTimeline as any,
        codeRun: "test()",
        view: document.createElement("div")
      };

      testSuiteManager.setCurrentTestFromResult(testResult);

      // Should pass the result directly to the store
      expect(store.getState().setCurrentTest).toHaveBeenCalledWith(testResult);
    });
  });
});
