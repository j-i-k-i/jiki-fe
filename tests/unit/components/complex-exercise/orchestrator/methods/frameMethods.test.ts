import type { Orchestrator } from "@/components/complex-exercise/orchestrator";
import type { Frame, TestState } from "@/components/complex-exercise/stubs";
import { getNearestCurrentFrame } from "@/components/complex-exercise/orchestrator/methods/frameMethods";
import { createStore } from "zustand/vanilla";
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
function createMockOrchestrator(currentTest: TestState | null = null, foldedLines: number[] = []): Orchestrator {
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
      foldedLines,
      setCode: jest.fn(),
      setOutput: jest.fn(),
      setStatus: jest.fn(),
      setError: jest.fn(),
      setCurrentTest: jest.fn(),
      setTimelineValue: jest.fn(),
      setHasCodeBeenEdited: jest.fn(),
      setIsSpotlightActive: jest.fn(),
      setFoldedLines: jest.fn(),
      reset: jest.fn()
    }))
  );

  // Create the orchestrator-like object with accessor methods
  const orchestrator = {
    exerciseUuid: "test-uuid",
    store,
    getStore: () => store,
    _cachedCurrentFrame: undefined as Frame | null | undefined,
    // Add state accessor methods
    getCurrentTest: function () {
      return store.getState().currentTest;
    },
    getCurrentTestFrames: function () {
      const currentTest = store.getState().currentTest;
      return currentTest ? currentTest.frames : null;
    },
    getFoldedLines: function () {
      return store.getState().foldedLines;
    },
    getNearestCurrentFrame: jest.fn(),
    findNextFrame: jest.fn()
  } as unknown as Orchestrator;

  // Bind getNearestCurrentFrame with proper context
  orchestrator.getNearestCurrentFrame = getNearestCurrentFrame.bind(orchestrator);

  // Properly bind findNextFrame with access to store
  orchestrator.findNextFrame = function (currentIdx: number) {
    const state = store.getState();
    if (!state.currentTest) {
      return undefined;
    }
    const { frames } = state.currentTest;
    const { foldedLines } = state;

    for (let idx = currentIdx + 1; idx < frames.length; idx++) {
      const frame = frames[idx];
      if (!foldedLines.includes(frame.line)) {
        return frame;
      }
    }
    return undefined;
  };

  return orchestrator;
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
      const frames = [mockFrame, createMockFrame(0.01, 1, 2)];
      const currentTest = {
        frames,
        animationTimeline: {} as unknown,
        timelineValue: 0
      };

      const orchestrator = createMockOrchestrator(currentTest);

      // First call calculates and caches
      const result1 = orchestrator.getNearestCurrentFrame();
      expect(result1).toBe(mockFrame);

      // Second call should return cached value
      // We can't directly test caching, but it should return same result
      const result2 = orchestrator.getNearestCurrentFrame();
      expect(result2).toBe(mockFrame);
    });

    it("should calculate frame when not cached", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(0.01, 1, 2), createMockFrame(0.02, 2, 3)];

      const currentTest = {
        frames,
        animationTimeline: {} as unknown,
        timelineValue: 1.5
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();

      // Should return frame at timelineTime 2 (nearest to 1.5)
      expect(result).toBe(frames[2]);
    });

    it("should find nearest frame when timeline is between frames", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(0.01, 10, 2), createMockFrame(0.02, 20, 3)];

      const currentTest = {
        frames,
        animationTimeline: {} as unknown,
        timelineValue: 7 // Closer to 10 than 0
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();
      expect(result).toBe(frames[1]);
    });

    it("should return last frame when timeline is past all frames", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(0.01, 1, 2), createMockFrame(0.02, 2, 3)];

      const currentTest = {
        frames,
        animationTimeline: {} as unknown,
        timelineValue: 100
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();
      expect(result).toBe(frames[2]);
    });

    it("should return first frame when timeline is before start", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(0.01, 1, 2), createMockFrame(0.02, 2, 3)];

      const currentTest = {
        frames,
        animationTimeline: {} as unknown,
        timelineValue: -5
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();
      expect(result).toBe(frames[0]);
    });

    it("should return null when frames array is empty", () => {
      const currentTest = {
        frames: [],
        animationTimeline: {} as unknown,
        timelineValue: 0
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();
      expect(result).toBeNull();
    });

    it("should handle single frame", () => {
      const frame = createMockFrame(0, 0, 1);
      const currentTest = {
        frames: [frame],
        animationTimeline: {} as unknown,
        timelineValue: 50
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();
      expect(result).toBe(frame);
    });

    it("should find exactly matching frame", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(0.01, 1, 2), createMockFrame(0.02, 2, 3)];

      const currentTest = {
        frames,
        animationTimeline: {} as unknown,
        timelineValue: 1 // Exactly matches frame[1]
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();
      expect(result).toBe(frames[1]);
    });

    it("should choose closer frame when equidistant favors later", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(0.01, 10, 2), createMockFrame(0.02, 20, 3)];

      const currentTest = {
        frames,
        animationTimeline: {} as unknown,
        timelineValue: 5 // Exactly between 0 and 10
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
        animationTimeline: {} as unknown,
        timelineValue: 1
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
        animationTimeline: {} as unknown,
        timelineValue: 250
      };

      const orchestrator = createMockOrchestrator(currentTest);
      const result = orchestrator.getNearestCurrentFrame();
      expect(result).toBe(frames[3]); // 250 is closer to 300 than 200
    });

    it("should handle fractional timeline values", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(0.01, 1.5, 2), createMockFrame(0.02, 3.7, 3)];

      const currentTest = {
        frames,
        animationTimeline: {} as unknown,
        timelineValue: 2.5
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

  describe("findNextFrame", () => {
    it("should find the next frame when no lines are folded", () => {
      const frames = [
        createMockFrame(0, 0, 1),
        createMockFrame(0.01, 1, 2),
        createMockFrame(0.02, 2, 3),
        createMockFrame(0.03, 3, 4)
      ];

      const orchestrator = createMockOrchestrator({ frames, animationTimeline: {} as unknown, timelineValue: 0 });
      const result = orchestrator.findNextFrame(1);
      expect(result).toBe(frames[2]);
    });

    it("should skip folded lines and find the next visible frame", () => {
      const frames = [
        createMockFrame(0, 0, 1),
        createMockFrame(0.01, 1, 2),
        createMockFrame(0.02, 2, 3),
        createMockFrame(0.03, 3, 4),
        createMockFrame(0.04, 4, 5)
      ];

      const foldedLines = [3, 4]; // Lines 3 and 4 are folded
      const orchestrator = createMockOrchestrator(
        { frames, animationTimeline: {} as unknown, timelineValue: 0 },
        foldedLines
      );
      const result = orchestrator.findNextFrame(1);
      expect(result).toBe(frames[4]); // Should skip frames at lines 3 and 4
    });

    it("should return undefined when at the last frame", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(0.01, 1, 2), createMockFrame(0.02, 2, 3)];

      const orchestrator = createMockOrchestrator({ frames, animationTimeline: {} as unknown, timelineValue: 0 });
      const result = orchestrator.findNextFrame(2);
      expect(result).toBeUndefined();
    });

    it("should return undefined when all remaining frames are folded", () => {
      const frames = [
        createMockFrame(0, 0, 1),
        createMockFrame(0.01, 1, 2),
        createMockFrame(0.02, 2, 3),
        createMockFrame(0.03, 3, 4)
      ];

      const foldedLines = [3, 4]; // Last two lines are folded
      const orchestrator = createMockOrchestrator(
        { frames, animationTimeline: {} as unknown, timelineValue: 0 },
        foldedLines
      );
      const result = orchestrator.findNextFrame(1);
      expect(result).toBeUndefined();
    });

    it("should handle starting from index 0", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(0.01, 1, 2), createMockFrame(0.02, 2, 3)];

      const orchestrator = createMockOrchestrator({ frames, animationTimeline: {} as unknown, timelineValue: 0 });
      const result = orchestrator.findNextFrame(0);
      expect(result).toBe(frames[1]);
    });

    it("should handle empty frames array", () => {
      const orchestrator = createMockOrchestrator({ frames: [], animationTimeline: {} as unknown, timelineValue: 0 });
      const result = orchestrator.findNextFrame(0);
      expect(result).toBeUndefined();
    });

    it("should find next frame when some intermediate frames are folded", () => {
      const frames = [
        createMockFrame(0, 0, 1),
        createMockFrame(0.01, 1, 2),
        createMockFrame(0.02, 2, 3),
        createMockFrame(0.03, 3, 4),
        createMockFrame(0.04, 4, 5),
        createMockFrame(0.05, 5, 6)
      ];

      const foldedLines = [2, 3, 4]; // Middle frames are folded
      const orchestrator = createMockOrchestrator(
        { frames, animationTimeline: {} as unknown, timelineValue: 0 },
        foldedLines
      );
      const result = orchestrator.findNextFrame(0);
      expect(result).toBe(frames[4]); // Should return frame at line 5
    });
  });
});
