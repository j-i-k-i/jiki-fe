import { TimelineManager } from "@/components/complex-exercise/lib/orchestrator/TimelineManager";
import type { Frame, AnimationTimeline } from "@/components/complex-exercise/lib/stubs";
import type { TestState } from "@/components/complex-exercise/lib/types";
import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";

// Helper to create mock frames
function createMockFrame(interpreterTime: number, timelineTime: number, line: number): Frame {
  return {
    interpreterTime,
    timelineTime,
    line,
    status: "SUCCESS" as const,
    description: `Frame at line ${line}`
  };
}

// Helper to create a test state
function createTestState(frames: Frame[], timelineTime: number = 0, currentFrame: Frame | null = null): TestState {
  return {
    frames,
    animationTimeline: {
      duration: 5,
      paused: true,
      seek: jest.fn(),
      play: jest.fn(),
      pause: jest.fn()
    } as unknown as AnimationTimeline,
    timelineTime,
    currentFrame: currentFrame || frames[0] || null
  };
}

// Helper to create a mock store
function createMockStore(currentTest: TestState | null = null, foldedLines: number[] = []) {
  const store = createStore(
    subscribeWithSelector((set) => ({
      exerciseUuid: "test-uuid",
      code: "",
      output: "",
      status: "idle" as const,
      error: null,
      currentTest,
      hasCodeBeenEdited: false,
      isSpotlightActive: false,
      foldedLines,

      // Actions
      setCurrentTestTimelineTime: (time: number) =>
        set((state: any) => {
          if (!state.currentTest) {
            return {};
          }

          // Calculate the nearest frame
          const nearestFrame = TimelineManager.findNearestFrame(state.currentTest.frames, time, state.foldedLines);

          return {
            currentTest: {
              ...state.currentTest,
              timelineTime: time,
              currentFrame: nearestFrame
            }
          };
        }),

      // Other actions as mocks
      setCode: jest.fn(),
      setOutput: jest.fn(),
      setStatus: jest.fn(),
      setError: jest.fn(),
      setCurrentTest: jest.fn(),
      setHasCodeBeenEdited: jest.fn(),
      setIsSpotlightActive: jest.fn(),
      setFoldedLines: jest.fn(),
      reset: jest.fn()
    }))
  );

  return store;
}

describe("TimelineManager", () => {
  describe("static findNearestFrame", () => {
    it("should return null when frames is undefined", () => {
      const result = TimelineManager.findNearestFrame(undefined, 0, []);
      expect(result).toBeNull();
    });

    it("should return null when frames array is empty", () => {
      const result = TimelineManager.findNearestFrame([], 0, []);
      expect(result).toBeNull();
    });

    it("should return first frame when timeline time is negative", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(1, 100, 2), createMockFrame(2, 200, 3)];
      const result = TimelineManager.findNearestFrame(frames, -50, []);
      expect(result).toEqual(frames[0]);
    });

    it("should return last frame when timeline time is past the last frame", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(1, 100, 2), createMockFrame(2, 200, 3)];
      const result = TimelineManager.findNearestFrame(frames, 300, []);
      expect(result).toEqual(frames[2]);
    });

    it("should return exact frame when timeline time matches", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(1, 100, 2), createMockFrame(2, 200, 3)];
      const result = TimelineManager.findNearestFrame(frames, 100, []);
      expect(result).toEqual(frames[1]);
    });

    it("should return nearest frame when timeline time is between frames", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(1, 100, 2), createMockFrame(2, 200, 3)];

      // Closer to frame 1 (timeline 100)
      let result = TimelineManager.findNearestFrame(frames, 80, []);
      expect(result).toEqual(frames[1]);

      // Closer to frame 2 (timeline 200)
      result = TimelineManager.findNearestFrame(frames, 160, []);
      expect(result).toEqual(frames[2]);
    });

    it("should skip folded lines", () => {
      const frames = [
        createMockFrame(0, 0, 1),
        createMockFrame(1, 100, 2),
        createMockFrame(2, 200, 3),
        createMockFrame(3, 300, 4)
      ];

      // Fold line 2
      const result = TimelineManager.findNearestFrame(frames, 100, [2]);

      // Should skip frame at line 2 and return nearest non-folded frame
      expect(result?.line).not.toBe(2);
    });

    it("should handle all frames being folded", () => {
      const frames = [createMockFrame(0, 0, 1), createMockFrame(1, 100, 2), createMockFrame(2, 200, 3)];

      // Fold all lines
      const result = TimelineManager.findNearestFrame(frames, 100, [1, 2, 3]);

      // Should return last frame as fallback
      expect(result).toEqual(frames[2]);
    });
  });

  describe("instance methods", () => {
    describe("setTimelineTime", () => {
      it("should update timeline time in store and seek animation timeline", () => {
        const mockSeek = jest.fn();
        const testState = createTestState([createMockFrame(0, 0, 1)]);
        testState.animationTimeline.seek = mockSeek;

        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        manager.setTimelineTime(200);

        const state = store.getState() as any;
        expect(state.currentTest?.timelineTime).toBe(200);
        expect(mockSeek).toHaveBeenCalledWith(2); // 200 / 100
      });

      it("should not seek if no animation timeline exists", () => {
        const store = createMockStore(null);
        const manager = new TimelineManager(store as any);

        // Should not throw
        expect(() => manager.setTimelineTime(200)).not.toThrow();
      });
    });

    describe("setInterpreterTime", () => {
      it("should convert interpreter time to timeline time", () => {
        const testState = createTestState([createMockFrame(0, 0, 1)]);
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        manager.setInterpreterTime(2);

        const state = store.getState() as any;
        expect(state.currentTest?.timelineTime).toBe(200);
      });
    });

    describe("getNearestCurrentFrame", () => {
      it("should return null when no current test", () => {
        const store = createMockStore(null);
        const manager = new TimelineManager(store as any);

        expect(manager.getNearestCurrentFrame()).toBeNull();
      });

      it("should return current frame from test state", () => {
        const mockFrame = createMockFrame(1, 100, 2);
        const testState = createTestState([createMockFrame(0, 0, 1), mockFrame], 100, mockFrame);
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        expect(manager.getNearestCurrentFrame()).toEqual(mockFrame);
      });
    });

    describe("findNextFrame", () => {
      it("should return undefined when no current test", () => {
        const store = createMockStore(null);
        const manager = new TimelineManager(store as any);

        expect(manager.findNextFrame(0)).toBeUndefined();
      });

      it("should return next non-folded frame", () => {
        const frames = [
          createMockFrame(0, 0, 1),
          createMockFrame(1, 100, 2),
          createMockFrame(2, 200, 3),
          createMockFrame(3, 300, 4)
        ];
        const testState = createTestState(frames);
        const store = createMockStore(testState, [3]); // Fold line 3
        const manager = new TimelineManager(store as any);

        // From index 1 (line 2), should skip folded line 3 and return line 4
        const result = manager.findNextFrame(1);
        expect(result).toEqual(frames[3]);
      });

      it("should return undefined when at last frame", () => {
        const frames = [createMockFrame(0, 0, 1), createMockFrame(1, 100, 2)];
        const testState = createTestState(frames);
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        expect(manager.findNextFrame(1)).toBeUndefined();
      });

      it("should skip multiple consecutive folded frames", () => {
        const frames = [
          createMockFrame(0, 0, 1),
          createMockFrame(1, 100, 2),
          createMockFrame(2, 200, 3),
          createMockFrame(3, 300, 4),
          createMockFrame(4, 400, 5)
        ];
        const testState = createTestState(frames);
        const store = createMockStore(testState, [2, 3, 4]); // Fold lines 2, 3, 4
        const manager = new TimelineManager(store as any);

        // From index 0 (line 1), should skip all folded lines and return line 5
        const result = manager.findNextFrame(0);
        expect(result).toEqual(frames[4]);
      });
    });
  });
});
