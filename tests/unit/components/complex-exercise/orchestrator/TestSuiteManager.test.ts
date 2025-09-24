import { TestSuiteManager } from "@/components/complex-exercise/lib/orchestrator/TestSuiteManager";
import type { NewTestResult } from "@/components/complex-exercise/lib/test-results-types";
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
    it("should initialize prevFrame and nextFrame based on current frame position", () => {
      const mockFrames = [
        { time: 100000, timeInMs: 100, status: "SUCCESS", line: 1 },
        { time: 200000, timeInMs: 200, status: "SUCCESS", line: 2 },
        { time: 300000, timeInMs: 300, status: "SUCCESS", line: 3 }
      ];

      const testResult: NewTestResult = {
        slug: "test-1",
        name: "Test 1",
        status: "pass",
        type: "state",
        expects: [],
        frames: mockFrames as any,
        time: 100000, // Start at first frame
        animationTimeline: mockAnimationTimeline as any,
        codeRun: "test()",
        view: document.createElement("div")
      };

      testSuiteManager.setCurrentTestFromResult(testResult);

      const setCurrentTestCall = (store.getState().setCurrentTest as jest.Mock).mock.calls[0][0];

      // Should be at first frame, so no prevFrame but has nextFrame
      expect(setCurrentTestCall.currentFrame).toBe(mockFrames[0]);
      expect(setCurrentTestCall.prevFrame).toBeUndefined();
      expect(setCurrentTestCall.nextFrame).toBe(mockFrames[1]);
    });

    it("should set both prevFrame and nextFrame when in middle of frames", () => {
      const mockFrames = [
        { time: 100000, timeInMs: 100, status: "SUCCESS", line: 1 },
        { time: 200000, timeInMs: 200, status: "SUCCESS", line: 2 },
        { time: 300000, timeInMs: 300, status: "SUCCESS", line: 3 }
      ];

      const testResult: NewTestResult = {
        slug: "test-1",
        name: "Test 1",
        status: "pass",
        type: "state",
        expects: [],
        frames: mockFrames as any,
        time: 200000, // Start at second frame
        animationTimeline: mockAnimationTimeline as any,
        codeRun: "test()",
        view: document.createElement("div")
      };

      testSuiteManager.setCurrentTestFromResult(testResult);

      const setCurrentTestCall = (store.getState().setCurrentTest as jest.Mock).mock.calls[0][0];

      // Should be at second frame, so has both prevFrame and nextFrame
      expect(setCurrentTestCall.currentFrame).toBe(mockFrames[1]);
      expect(setCurrentTestCall.prevFrame).toBe(mockFrames[0]);
      expect(setCurrentTestCall.nextFrame).toBe(mockFrames[2]);
    });

    it("should set only prevFrame when at last frame", () => {
      const mockFrames = [
        { time: 100000, timeInMs: 100, status: "SUCCESS", line: 1 },
        { time: 200000, timeInMs: 200, status: "SUCCESS", line: 2 },
        { time: 300000, timeInMs: 300, status: "SUCCESS", line: 3 }
      ];

      const testResult: NewTestResult = {
        slug: "test-1",
        name: "Test 1",
        status: "pass",
        type: "state",
        expects: [],
        frames: mockFrames as any,
        time: 300000, // Start at last frame
        animationTimeline: mockAnimationTimeline as any,
        codeRun: "test()",
        view: document.createElement("div")
      };

      testSuiteManager.setCurrentTestFromResult(testResult);

      const setCurrentTestCall = (store.getState().setCurrentTest as jest.Mock).mock.calls[0][0];

      // Should be at last frame, so has prevFrame but no nextFrame
      expect(setCurrentTestCall.currentFrame).toBe(mockFrames[2]);
      expect(setCurrentTestCall.prevFrame).toBe(mockFrames[1]);
      expect(setCurrentTestCall.nextFrame).toBeUndefined();
    });

    it("should handle null result", () => {
      testSuiteManager.setCurrentTestFromResult(null);

      expect(store.getState().setCurrentTest).toHaveBeenCalledWith(null);
    });

    it("should handle result without animationTimeline", () => {
      const testResult: NewTestResult = {
        slug: "test-1",
        name: "Test 1",
        status: "pass",
        type: "state",
        expects: [],
        frames: [],
        time: 0,
        animationTimeline: null,
        codeRun: "test()",
        view: document.createElement("div")
      };

      testSuiteManager.setCurrentTestFromResult(testResult);

      expect(store.getState().setCurrentTest).toHaveBeenCalledWith(null);
    });
  });
});