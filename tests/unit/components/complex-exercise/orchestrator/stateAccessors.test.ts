import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";
import type { Orchestrator } from "@/components/complex-exercise/lib/Orchestrator";
import type { TestState } from "@/components/complex-exercise/lib/types";
import type { Frame, AnimationTimeline } from "@/components/complex-exercise/lib/stubs";
import {
  getCode,
  getOutput,
  getStatus,
  getError,
  getHasCodeBeenEdited,
  getIsSpotlightActive,
  getFoldedLines,
  getCurrentTest,
  getCurrentTestFrames,
  getCurrentTestAnimationTimeline,
  getCurrentTestTimelineValue,
  hasValidTest
} from "@/components/complex-exercise/lib/orchestrator/stateAccessors";

// Helper to create a mock orchestrator with custom state
function createMockOrchestrator(customState: Record<string, unknown> = {}): Orchestrator {
  const defaultState = {
    exerciseUuid: "test-uuid",
    code: "",
    output: "",
    status: "idle",
    error: null,
    currentTest: null,
    hasCodeBeenEdited: false,
    isSpotlightActive: false,
    foldedLines: [],
    ...customState
  };

  const store = createStore(subscribeWithSelector(() => defaultState));

  return {
    store,
    getStore: () => store
  } as Orchestrator;
}

describe("stateAccessors", () => {
  describe("Primary State Accessors", () => {
    it("getCode should return the code from state", () => {
      const orchestrator = createMockOrchestrator({ code: "const x = 1;" });
      const result = getCode.call(orchestrator);
      expect(result).toBe("const x = 1;");
    });

    it("getOutput should return the output from state", () => {
      const orchestrator = createMockOrchestrator({ output: "Test output" });
      const result = getOutput.call(orchestrator);
      expect(result).toBe("Test output");
    });

    it("getStatus should return the status from state", () => {
      const orchestrator = createMockOrchestrator({ status: "running" });
      const result = getStatus.call(orchestrator);
      expect(result).toBe("running");
    });

    it("getError should return the error from state", () => {
      const orchestrator = createMockOrchestrator({ error: "Test error" });
      const result = getError.call(orchestrator);
      expect(result).toBe("Test error");
    });

    it("getHasCodeBeenEdited should return hasCodeBeenEdited from state", () => {
      const orchestrator = createMockOrchestrator({ hasCodeBeenEdited: true });
      const result = getHasCodeBeenEdited.call(orchestrator);
      expect(result).toBe(true);
    });

    it("getIsSpotlightActive should return isSpotlightActive from state", () => {
      const orchestrator = createMockOrchestrator({ isSpotlightActive: true });
      const result = getIsSpotlightActive.call(orchestrator);
      expect(result).toBe(true);
    });

    it("getFoldedLines should return foldedLines from state", () => {
      const orchestrator = createMockOrchestrator({ foldedLines: [1, 3, 5] });
      const result = getFoldedLines.call(orchestrator);
      expect(result).toEqual([1, 3, 5]);
    });

    it("getCurrentTest should return currentTest from state", () => {
      const testState: TestState = {
        frames: [],
        animationTimeline: { duration: 5 } as AnimationTimeline,
        timelineValue: 100
      };
      const orchestrator = createMockOrchestrator({ currentTest: testState });
      const result = getCurrentTest.call(orchestrator);
      expect(result).toBe(testState);
    });
  });

  describe("Derived State Accessors", () => {
    describe("getCurrentTestFrames", () => {
      it("should return frames when currentTest exists", () => {
        const frames: Frame[] = [{ line: 1, time: 0, timelineTime: 0, status: "SUCCESS" }];
        const testState: TestState = {
          frames,
          animationTimeline: { duration: 5 } as AnimationTimeline,
          timelineValue: 0
        };
        const orchestrator = createMockOrchestrator({ currentTest: testState });

        const result = getCurrentTestFrames.call(orchestrator);
        expect(result).toBe(frames);
      });

      it("should return null when currentTest is null", () => {
        const orchestrator = createMockOrchestrator({ currentTest: null });
        const result = getCurrentTestFrames.call(orchestrator);
        expect(result).toBeNull();
      });
    });

    describe("getCurrentTestAnimationTimeline", () => {
      it("should return animationTimeline when currentTest exists", () => {
        const animationTimeline = { duration: 5 };
        const testState: TestState = {
          frames: [],
          animationTimeline: animationTimeline as AnimationTimeline,
          timelineValue: 0
        };
        const orchestrator = createMockOrchestrator({ currentTest: testState });

        const result = getCurrentTestAnimationTimeline.call(orchestrator);
        expect(result).toBe(animationTimeline);
      });

      it("should return null when currentTest is null", () => {
        const orchestrator = createMockOrchestrator({ currentTest: null });
        const result = getCurrentTestAnimationTimeline.call(orchestrator);
        expect(result).toBeNull();
      });
    });

    describe("getCurrentTestTimelineValue", () => {
      it("should return timelineValue when currentTest exists", () => {
        const testState: TestState = {
          frames: [],
          animationTimeline: { duration: 5 } as AnimationTimeline,
          timelineValue: 250
        };
        const orchestrator = createMockOrchestrator({ currentTest: testState });

        const result = getCurrentTestTimelineValue.call(orchestrator);
        expect(result).toBe(250);
      });

      it("should return null when currentTest is null", () => {
        const orchestrator = createMockOrchestrator({ currentTest: null });
        const result = getCurrentTestTimelineValue.call(orchestrator);
        expect(result).toBeNull();
      });
    });

    describe("hasValidTest", () => {
      it("should return true when currentTest exists with frames", () => {
        const testState: TestState = {
          frames: [{ line: 1, time: 0, timelineTime: 0, status: "SUCCESS" }],
          animationTimeline: { duration: 5 } as AnimationTimeline,
          timelineValue: 0
        };
        const orchestrator = createMockOrchestrator({ currentTest: testState });

        const result = hasValidTest.call(orchestrator);
        expect(result).toBe(true);
      });

      it("should return false when currentTest exists but has no frames", () => {
        const testState: TestState = {
          frames: [],
          animationTimeline: { duration: 5 } as AnimationTimeline,
          timelineValue: 0
        };
        const orchestrator = createMockOrchestrator({ currentTest: testState });

        const result = hasValidTest.call(orchestrator);
        expect(result).toBe(false);
      });

      it("should return false when currentTest is null", () => {
        const orchestrator = createMockOrchestrator({ currentTest: null });
        const result = hasValidTest.call(orchestrator);
        expect(result).toBe(false);
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle empty arrays", () => {
      const orchestrator = createMockOrchestrator({ foldedLines: [] });
      const result = getFoldedLines.call(orchestrator);
      expect(result).toEqual([]);
    });

    it("should handle null error", () => {
      const orchestrator = createMockOrchestrator({ error: null });
      const result = getError.call(orchestrator);
      expect(result).toBeNull();
    });

    it("should handle empty code string", () => {
      const orchestrator = createMockOrchestrator({ code: "" });
      const result = getCode.call(orchestrator);
      expect(result).toBe("");
    });

    it("should handle all status values", () => {
      const statuses = ["idle", "running", "success", "error"] as const;

      statuses.forEach((status) => {
        const orchestrator = createMockOrchestrator({ status });
        const result = getStatus.call(orchestrator);
        expect(result).toBe(status);
      });
    });
  });
});
