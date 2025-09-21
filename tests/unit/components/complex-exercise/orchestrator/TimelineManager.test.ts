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
  // Calculate prev/next frames based on timeline time
  const prevFrame =
    frames.length > 0 && timelineTime > 0 ? TimelineManager.findPrevFrame(frames, timelineTime, []) : undefined;
  const nextFrame = frames.length > 0 ? TimelineManager.findNextFrame(frames, timelineTime, []) : undefined;

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
    currentFrame: currentFrame || frames[0] || null,
    prevFrame,
    nextFrame,
    prevBreakpointFrame: undefined,
    nextBreakpointFrame: undefined
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

      it("should calculate nearest frame to current timeline time", () => {
        const frames = [
          createMockFrame(0, 0, 1),
          createMockFrame(1, 100, 2),
          createMockFrame(2, 200, 3),
          createMockFrame(3, 300, 4)
        ];
        // Set timeline time to 150 (between frames 1 and 2)
        const testState = createTestState(frames, 150, null);
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        // Should return frame 2 (at time 200) as it's the nearest to 150
        expect(manager.getNearestCurrentFrame()).toEqual(frames[2]);
      });

      it("should find nearest frame even when stored currentFrame is different", () => {
        const frames = [
          createMockFrame(0, 0, 1),
          createMockFrame(1, 100, 2),
          createMockFrame(2, 200, 3),
          createMockFrame(3, 300, 4)
        ];
        // Timeline time at 250, but stored frame is frame 0 (incorrect)
        const testState = createTestState(frames, 250, frames[0]);
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        // Should correctly calculate and return frame 3 (at time 300) as nearest
        expect(manager.getNearestCurrentFrame()).toEqual(frames[3]);
      });

      it("should handle folded lines when finding nearest frame", () => {
        const frames = [
          createMockFrame(0, 0, 1),
          createMockFrame(1, 100, 2),
          createMockFrame(2, 200, 3), // This will be folded
          createMockFrame(3, 300, 4)
        ];
        const testState = createTestState(frames, 150, null);
        const store = createMockStore(testState, [3]); // Fold line 3
        const manager = new TimelineManager(store as any);

        // Should return frame 1, not the folded frame 2
        expect(manager.getNearestCurrentFrame()).toEqual(frames[1]);
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

      it("should use current position when no index provided", () => {
        const frames = [
          createMockFrame(0, 0, 1),
          createMockFrame(1, 100, 2),
          createMockFrame(2, 200, 3),
          createMockFrame(3, 300, 4)
        ];
        // Timeline at 150 (between frame 1 and 2)
        const testState = createTestState(frames, 150);
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        // Should find next from current position
        const result = manager.findNextFrame();
        expect(result).toEqual(frames[2]);
      });

      it("should handle timeline time before all frames", () => {
        const frames = [createMockFrame(0, 100, 1), createMockFrame(1, 200, 2), createMockFrame(2, 300, 3)];
        const testState = createTestState(frames, -50); // Before all frames
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        const result = manager.findNextFrame();
        expect(result).toEqual(frames[0]); // Should return first frame
      });

      it("should handle timeline time after all frames", () => {
        const frames = [createMockFrame(0, 100, 1), createMockFrame(1, 200, 2), createMockFrame(2, 300, 3)];
        const testState = createTestState(frames, 400); // After all frames
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        const result = manager.findNextFrame();
        expect(result).toBeUndefined(); // No next frame
      });

      it("should handle empty frames array", () => {
        const testState = createTestState([]);
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        expect(manager.findNextFrame()).toBeUndefined();
        expect(manager.findNextFrame(0)).toBeUndefined();
      });

      it("should handle all frames being folded", () => {
        const frames = [createMockFrame(0, 0, 1), createMockFrame(1, 100, 2), createMockFrame(2, 200, 3)];
        const testState = createTestState(frames, 50);
        const store = createMockStore(testState, [1, 2, 3]); // All folded
        const manager = new TimelineManager(store as any);

        expect(manager.findNextFrame(0)).toBeUndefined();
      });
    });

    describe("findPrevFrame", () => {
      it("should return undefined when no current test", () => {
        const store = createMockStore(null);
        const manager = new TimelineManager(store as any);

        expect(manager.findPrevFrame(0)).toBeUndefined();
      });

      it("should return previous non-folded frame", () => {
        const frames = [
          createMockFrame(0, 0, 1),
          createMockFrame(1, 100, 2),
          createMockFrame(2, 200, 3),
          createMockFrame(3, 300, 4)
        ];
        const testState = createTestState(frames);
        const store = createMockStore(testState, [3]); // Fold line 3
        const manager = new TimelineManager(store as any);

        // From index 3, should skip folded line 3 and return line 2
        const result = manager.findPrevFrame(3);
        expect(result).toEqual(frames[1]);
      });

      it("should return undefined when at first frame", () => {
        const frames = [createMockFrame(0, 0, 1), createMockFrame(1, 100, 2)];
        const testState = createTestState(frames);
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        expect(manager.findPrevFrame(0)).toBeUndefined();
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

        // From index 4 (line 5), should skip all folded lines and return line 1
        const result = manager.findPrevFrame(4);
        expect(result).toEqual(frames[0]);
      });

      it("should use current position when no index provided", () => {
        const frames = [
          createMockFrame(0, 0, 1),
          createMockFrame(1, 100, 2),
          createMockFrame(2, 200, 3),
          createMockFrame(3, 300, 4)
        ];
        // Timeline at 250 (between frame 2 and 3)
        const testState = createTestState(frames, 250);
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        // Should find prev from current position
        const result = manager.findPrevFrame();
        expect(result).toEqual(frames[1]);
      });

      it("should handle timeline time before all frames", () => {
        const frames = [createMockFrame(0, 100, 1), createMockFrame(1, 200, 2), createMockFrame(2, 300, 3)];
        const testState = createTestState(frames, 50); // Before all frames
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        const result = manager.findPrevFrame();
        expect(result).toBeUndefined(); // No previous frame
      });

      it("should handle timeline time after all frames", () => {
        const frames = [createMockFrame(0, 100, 1), createMockFrame(1, 200, 2), createMockFrame(2, 300, 3)];
        const testState = createTestState(frames, 400); // After all frames
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        const result = manager.findPrevFrame();
        expect(result).toEqual(frames[2]); // Should return last frame as previous
      });

      it("should handle empty frames array", () => {
        const testState = createTestState([]);
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        expect(manager.findPrevFrame()).toBeUndefined();
        expect(manager.findPrevFrame(0)).toBeUndefined();
      });

      it("should handle all frames being folded", () => {
        const frames = [createMockFrame(0, 0, 1), createMockFrame(1, 100, 2), createMockFrame(2, 200, 3)];
        const testState = createTestState(frames, 150);
        const store = createMockStore(testState, [1, 2, 3]); // All folded
        const manager = new TimelineManager(store as any);

        expect(manager.findPrevFrame(2)).toBeUndefined();
      });
    });

    describe("getCurrentOrFirstFrameIdx", () => {
      it("should return undefined when no frames", () => {
        const store = createMockStore(null);
        const manager = new TimelineManager(store as any);

        // Access private method via any
        const result = (manager as any).getCurrentOrFirstFrameIdx();
        expect(result).toBeUndefined();
      });

      it("should return -1 when timeline time is undefined", () => {
        const frames = [createMockFrame(0, 0, 1), createMockFrame(1, 100, 2)];
        const testState = { ...createTestState(frames), timelineTime: undefined };
        const store = createMockStore(testState as any);
        const manager = new TimelineManager(store as any);

        const result = (manager as any).getCurrentOrFirstFrameIdx();
        expect(result).toBe(-1);
      });

      it("should return -1 when timeline time is negative", () => {
        const frames = [createMockFrame(0, 0, 1), createMockFrame(1, 100, 2)];
        const testState = createTestState(frames, -50);
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        const result = (manager as any).getCurrentOrFirstFrameIdx();
        expect(result).toBe(-1);
      });

      it("should return -1 when timeline time is before first frame", () => {
        const frames = [
          createMockFrame(0, 100, 1), // First frame at 100
          createMockFrame(1, 200, 2)
        ];
        const testState = createTestState(frames, 50); // Before first frame
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        const result = (manager as any).getCurrentOrFirstFrameIdx();
        expect(result).toBe(-1);
      });

      it("should return correct index when timeline time is between frames", () => {
        const frames = [
          createMockFrame(0, 0, 1),
          createMockFrame(1, 100, 2),
          createMockFrame(2, 200, 3),
          createMockFrame(3, 300, 4)
        ];
        const testState = createTestState(frames, 150); // Between frame 1 and 2
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        const result = (manager as any).getCurrentOrFirstFrameIdx();
        expect(result).toBe(1); // Index of frame just before timeline time
      });

      it("should return last index when timeline time is after all frames", () => {
        const frames = [createMockFrame(0, 0, 1), createMockFrame(1, 100, 2), createMockFrame(2, 200, 3)];
        const testState = createTestState(frames, 300); // After all frames
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        const result = (manager as any).getCurrentOrFirstFrameIdx();
        expect(result).toBe(2); // Last frame index
      });

      it("should return exact frame index when timeline time matches", () => {
        const frames = [createMockFrame(0, 0, 1), createMockFrame(1, 100, 2), createMockFrame(2, 200, 3)];
        const testState = createTestState(frames, 100); // Exactly at frame 1
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        const result = (manager as any).getCurrentOrFirstFrameIdx();
        expect(result).toBe(1); // Frame at timeline time 100
      });

      it("should handle single frame", () => {
        const frames = [createMockFrame(0, 100, 1)];

        // Before frame
        let testState = createTestState(frames, 50);
        let store = createMockStore(testState);
        let manager = new TimelineManager(store as any);
        expect((manager as any).getCurrentOrFirstFrameIdx()).toBe(-1);

        // At frame
        testState = createTestState(frames, 100);
        store = createMockStore(testState);
        manager = new TimelineManager(store as any);
        expect((manager as any).getCurrentOrFirstFrameIdx()).toBe(0);

        // After frame
        testState = createTestState(frames, 150);
        store = createMockStore(testState);
        manager = new TimelineManager(store as any);
        expect((manager as any).getCurrentOrFirstFrameIdx()).toBe(0);
      });
    });

    describe("getCurrentOrLastFrameIdx", () => {
      it("should return undefined when no frames", () => {
        const store = createMockStore(null);
        const manager = new TimelineManager(store as any);

        const result = (manager as any).getCurrentOrLastFrameIdx();
        expect(result).toBeUndefined();
      });

      it("should return frames.length when timeline time is undefined", () => {
        const frames = [createMockFrame(0, 0, 1), createMockFrame(1, 100, 2)];
        const testState = { ...createTestState(frames), timelineTime: undefined };
        const store = createMockStore(testState as any);
        const manager = new TimelineManager(store as any);

        const result = (manager as any).getCurrentOrLastFrameIdx();
        expect(result).toBe(2); // frames.length
      });

      it("should return 0 when timeline time is before all frames", () => {
        const frames = [
          createMockFrame(0, 100, 1), // First frame at 100
          createMockFrame(1, 200, 2)
        ];
        const testState = createTestState(frames, 50); // Before all frames
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        const result = (manager as any).getCurrentOrLastFrameIdx();
        expect(result).toBe(0); // Should return 0 as starting point for prev search
      });

      it("should return correct index when timeline time is between frames", () => {
        const frames = [
          createMockFrame(0, 0, 1),
          createMockFrame(1, 100, 2),
          createMockFrame(2, 200, 3),
          createMockFrame(3, 300, 4)
        ];
        const testState = createTestState(frames, 150); // Between frame 1 and 2
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        const result = (manager as any).getCurrentOrLastFrameIdx();
        expect(result).toBe(1); // Last frame before or at timeline time
      });

      it("should return last index when timeline time is after all frames", () => {
        const frames = [createMockFrame(0, 0, 1), createMockFrame(1, 100, 2), createMockFrame(2, 200, 3)];
        const testState = createTestState(frames, 300); // After all frames
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        const result = (manager as any).getCurrentOrLastFrameIdx();
        expect(result).toBe(2); // Last frame index
      });

      it("should return exact frame index when timeline time matches", () => {
        const frames = [createMockFrame(0, 0, 1), createMockFrame(1, 100, 2), createMockFrame(2, 200, 3)];
        const testState = createTestState(frames, 100); // Exactly at frame 1
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        const result = (manager as any).getCurrentOrLastFrameIdx();
        expect(result).toBe(1); // Frame at timeline time 100
      });

      it("should handle negative timeline time", () => {
        const frames = [createMockFrame(0, 0, 1), createMockFrame(1, 100, 2)];
        const testState = createTestState(frames, -50);
        const store = createMockStore(testState);
        const manager = new TimelineManager(store as any);

        const result = (manager as any).getCurrentOrLastFrameIdx();
        expect(result).toBe(0); // Should return 0 for negative time
      });

      it("should handle single frame", () => {
        const frames = [createMockFrame(0, 100, 1)];

        // Before frame
        let testState = createTestState(frames, 50);
        let store = createMockStore(testState);
        let manager = new TimelineManager(store as any);
        expect((manager as any).getCurrentOrLastFrameIdx()).toBe(0);

        // At frame
        testState = createTestState(frames, 100);
        store = createMockStore(testState);
        manager = new TimelineManager(store as any);
        expect((manager as any).getCurrentOrLastFrameIdx()).toBe(0);

        // After frame
        testState = createTestState(frames, 150);
        store = createMockStore(testState);
        manager = new TimelineManager(store as any);
        expect((manager as any).getCurrentOrLastFrameIdx()).toBe(0);
      });
    });
  });
});
