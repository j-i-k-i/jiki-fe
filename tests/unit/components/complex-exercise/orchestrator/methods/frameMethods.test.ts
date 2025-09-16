import type { Orchestrator } from "@/components/complex-exercise/orchestrator";
import type { Frame } from "@/components/complex-exercise/stubs";
import { getNearestCurrentFrame } from "@/components/complex-exercise/orchestrator/methods/frameMethods";
import { createStore, type StoreApi } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";

// Helper to create mock frames
function createMockFrame(time: number, timelineTime: number, line: number): Frame {
  return {
    time,
    timelineTime,
    line,
    status: "SUCCESS" as const,
    description: `Frame at line ${line}`
  };
}

// Helper to create a mock orchestrator with store
function createMockOrchestrator(currentTest: any = null): Orchestrator {
  const store = createStore(
    subscribeWithSelector(() => ({
      exerciseUuid: "test-uuid",
      code: "",
      output: "",
      status: "idle" as const,
      error: null,
      currentTest,
      hasCodeBeenEdited: false,
      isSpotlightActive: false,
      setCode: jest.fn(),
      setOutput: jest.fn(),
      setStatus: jest.fn(),
      setError: jest.fn(),
      setCurrentTest: jest.fn(),
      setTimelineValue: jest.fn(),
      setHasCodeBeenEdited: jest.fn(),
      setIsSpotlightActive: jest.fn(),
      reset: jest.fn()
    }))
  );

  return {
    exerciseUuid: "test-uuid",
    store,
    getStore: () => store,
    getNearestCurrentFrame: getNearestCurrentFrame.bind({ store })
  } as unknown as Orchestrator;
}

describe("frameMethods", () => {
  describe("getNearestCurrentFrame", () => {
    it("should return null when currentTest is null", () => {
      const orchestrator = createMockOrchestrator(null);
      const result = orchestrator.getNearestCurrentFrame();
      expect(result).toBeNull();
    });

    it("should return cached currentFrame when available", () => {
      const mockFrame = createMockFrame(0, 0, 1);
      const currentTest = {
        frames: [mockFrame, createMockFrame(0.01, 1, 2)],
        animationTimeline: {} as any,
        timelineValue: 0,
        currentFrame: mockFrame
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();
      expect(result).toBe(mockFrame);
    });

    it("should calculate and cache frame when not cached", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(0.01, 1, 2), createMockFrame(0.02, 2, 3)];

      const currentTest = {
        frames,
        animationTimeline: {} as any,
        timelineValue: 1.5,
        currentFrame: undefined
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();

      // Should return frame at timelineTime 2 (nearest to 1.5)
      expect(result).toBe(frames[2]);

      // Should cache the result
      const state = orchestrator.store.getState();
      expect(state.currentTest?.currentFrame).toBe(frames[2]);
    });

    it("should find nearest frame when timeline is between frames", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(0.01, 10, 2), createMockFrame(0.02, 20, 3)];

      const currentTest = {
        frames,
        animationTimeline: {} as any,
        timelineValue: 7, // Closer to 10 than 0
        currentFrame: undefined
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();
      expect(result).toBe(frames[1]);
    });

    it("should return last frame when timeline is past all frames", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(0.01, 1, 2), createMockFrame(0.02, 2, 3)];

      const currentTest = {
        frames,
        animationTimeline: {} as any,
        timelineValue: 100,
        currentFrame: undefined
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();
      expect(result).toBe(frames[2]);
    });

    it("should return first frame when timeline is before start", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(0.01, 1, 2), createMockFrame(0.02, 2, 3)];

      const currentTest = {
        frames,
        animationTimeline: {} as any,
        timelineValue: -5,
        currentFrame: undefined
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();
      expect(result).toBe(frames[0]);
    });

    it("should return null when frames array is empty", () => {
      const currentTest = {
        frames: [],
        animationTimeline: {} as any,
        timelineValue: 0,
        currentFrame: undefined
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();
      expect(result).toBeNull();
    });

    it("should handle single frame", () => {
      const frame = createMockFrame(0, 0, 1);
      const currentTest = {
        frames: [frame],
        animationTimeline: {} as any,
        timelineValue: 50,
        currentFrame: undefined
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();
      expect(result).toBe(frame);
    });

    it("should find exactly matching frame", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(0.01, 1, 2), createMockFrame(0.02, 2, 3)];

      const currentTest = {
        frames,
        animationTimeline: {} as any,
        timelineValue: 1, // Exactly matches frame[1]
        currentFrame: undefined
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();
      expect(result).toBe(frames[1]);
    });

    it("should choose closer frame when equidistant favors later", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(0.01, 10, 2), createMockFrame(0.02, 20, 3)];

      const currentTest = {
        frames,
        animationTimeline: {} as any,
        timelineValue: 5, // Exactly between 0 and 10
        currentFrame: undefined
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();
      // When equidistant, the algorithm chooses the later frame
      expect(result).toBe(frames[1]);
    });

    it("should handle frames with same timelineTime", () => {
      const frames = [
        createMockFrame(0, 0, 1),
        createMockFrame(0.01, 1, 2),
        createMockFrame(0.02, 1, 3), // Same timelineTime as previous
        createMockFrame(0.03, 2, 4)
      ];

      const currentTest = {
        frames,
        animationTimeline: {} as any,
        timelineValue: 1,
        currentFrame: undefined
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();
      // Should return the first frame with timelineTime 1
      expect(result).toBe(frames[1]);
    });

    it("should handle large timeline values", () => {
      const frames = [
        createMockFrame(0, 0, 1),
        createMockFrame(0.01, 100, 2),
        createMockFrame(0.02, 200, 3),
        createMockFrame(0.03, 300, 4)
      ];

      const currentTest = {
        frames,
        animationTimeline: {} as any,
        timelineValue: 250,
        currentFrame: undefined
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();
      expect(result).toBe(frames[3]); // 250 is closer to 300 than 200
    });

    it("should handle fractional timeline values", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(0.01, 1.5, 2), createMockFrame(0.02, 3.7, 3)];

      const currentTest = {
        frames,
        animationTimeline: {} as any,
        timelineValue: 2.5,
        currentFrame: undefined
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();
      expect(result).toBe(frames[1]); // 2.5 is closer to 1.5 than 3.7
    });
  });

  // Note: The following functions are internal and not directly exported,
  // but we're testing them through getNearestCurrentFrame's behavior.
  // The test cases above cover the various scenarios for:
  // - findFrameNearestTimelineTime
  // - findFrameIdxNearestTimelineTime
  // - findPrevFrameIdx (when folded lines are implemented)
});
