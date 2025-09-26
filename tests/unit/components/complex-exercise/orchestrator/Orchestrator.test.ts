import Orchestrator, { useOrchestratorStore } from "@/components/complex-exercise/lib/Orchestrator";
import * as localStorage from "@/components/complex-exercise/lib/localStorage";
import { mockFrame, mockAnimationTimeline } from "@/tests/mocks";
import { renderHook } from "@testing-library/react";

// Mock localStorage functions
jest.mock("@/components/complex-exercise/lib/localStorage", () => ({
  loadCodeMirrorContent: jest.fn(),
  saveCodeMirrorContent: jest.fn()
}));

const mockLoadCodeMirrorContent = localStorage.loadCodeMirrorContent as jest.MockedFunction<
  typeof localStorage.loadCodeMirrorContent
>;

describe("Orchestrator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock - no localStorage data
    mockLoadCodeMirrorContent.mockReturnValue({
      success: false,
      error: "No data found for this exercise"
    });
  });

  describe("constructor", () => {
    it("should initialize with provided exerciseUuid and initial code", () => {
      const orchestrator = new Orchestrator("test-uuid", "const x = 1;");
      const state = orchestrator.getStore().getState();

      expect(state.exerciseUuid).toBe("test-uuid");
      expect(state.code).toBe("const x = 1;");
    });

    it("should initialize with default values", () => {
      const orchestrator = new Orchestrator("test-uuid", "");
      const state = orchestrator.getStore().getState();

      expect(state.output).toBe("");
      expect(state.status).toBe("idle");
      expect(state.error).toBeNull();
      expect(state.hasCodeBeenEdited).toBe(false);
      expect(state.isSpotlightActive).toBe(false);
      expect(state.foldedLines).toEqual([]);
    });

    it("should create separate instances with separate stores", () => {
      const orchestrator1 = new Orchestrator("uuid1", "code1");
      const orchestrator2 = new Orchestrator("uuid2", "code2");

      const state1 = orchestrator1.getStore().getState();
      const state2 = orchestrator2.getStore().getState();

      expect(state1.exerciseUuid).toBe("uuid1");
      expect(state2.exerciseUuid).toBe("uuid2");
      expect(state1.code).toBe("code1");
      expect(state2.code).toBe("code2");
    });
  });

  describe("getStore", () => {
    it("should return the store instance", () => {
      const orchestrator = new Orchestrator("test-uuid", "");
      const store = orchestrator.getStore();

      expect(store).toBeDefined();
      expect(typeof store.getState).toBe("function");
      expect(typeof store.subscribe).toBe("function");
    });
  });

  describe("frame synchronization", () => {
    it("should only update currentFrame when landing exactly on a frame", () => {
      const orchestrator = new Orchestrator("test-uuid", "");

      // Create custom test frames
      const testFrames = [
        mockFrame(0, { line: 1 }),
        mockFrame(100000, { line: 2 }),
        mockFrame(200000, { line: 3 }),
        mockFrame(300000, { line: 4 }),
        mockFrame(400000, { line: 5 })
      ];

      // Set up test state with custom frames
      orchestrator.setCurrentTest({
        slug: "test-1",
        name: "Test 1",
        status: "pass" as const,
        expects: [],
        view: document.createElement("div"),
        frames: testFrames,
        animationTimeline: mockAnimationTimeline()
      });

      const state = orchestrator.getStore().getState();

      // Initial frame should be the first one
      expect(state.currentFrame?.line).toBe(1);

      // Change timeline time to between frames (should NOT update currentFrame)
      orchestrator.setCurrentTestTime(150000);
      let updatedState = orchestrator.getStore().getState();
      expect(updatedState.currentFrame?.line).toBe(1); // Should stay at 1

      // Change timeline time to exact frame position (should update currentFrame)
      orchestrator.setCurrentTestTime(200000);
      updatedState = orchestrator.getStore().getState();
      expect(updatedState.currentFrame?.line).toBe(3); // Should update to line 3
    });

    it("should recalculate navigation frames when setFoldedLines is called", () => {
      const orchestrator = new Orchestrator("test-uuid", "");

      // Create custom test frames
      const testFrames = [
        mockFrame(0, { line: 1 }),
        mockFrame(100000, { line: 2 }),
        mockFrame(200000, { line: 3 }),
        mockFrame(300000, { line: 4 })
      ];

      // Set up test state with custom frames at line 2
      orchestrator.setCurrentTest({
        slug: "test-1",
        name: "Test 1",
        status: "pass" as const,
        expects: [],
        view: document.createElement("div"),
        frames: testFrames,
        animationTimeline: mockAnimationTimeline()
      });

      // Verify initial state
      let state = orchestrator.getStore().getState();
      state.setCurrentTestTime(100000, "exact");

      // Refresh it
      state = orchestrator.getStore().getState();
      expect(state.currentFrame?.line).toBe(2);

      // Fold line 2
      orchestrator.setFoldedLines([2]);

      // When folding the current frame's line, it moves to the next non-folded frame
      state = orchestrator.getStore().getState();
      expect(state.currentFrame?.line).toBe(3);

      // Navigation frames should skip the folded line
      expect(state.prevFrame?.line).toBe(1);
      expect(state.nextFrame?.line).toBe(4);
    });
  });

  describe("useOrchestratorStore hook", () => {
    it("should return the current state", () => {
      const orchestrator = new Orchestrator("test-uuid", "initial code");

      const { result } = renderHook(() => useOrchestratorStore(orchestrator));

      expect(result.current.exerciseUuid).toBe("test-uuid");
      expect(result.current.code).toBe("initial code");
      expect(result.current.output).toBe("");
      expect(result.current.status).toBe("idle");
      expect(result.current.error).toBeNull();
      expect(result.current.hasCodeBeenEdited).toBe(false);
      expect(result.current.isSpotlightActive).toBe(false);
      expect(result.current.foldedLines).toEqual([]);
      expect(result.current.currentTest).toBeDefined();
    });

    it("should use shallow equality to prevent unnecessary renders", () => {
      const orchestrator = new Orchestrator("test-uuid", "code");

      const { result, rerender } = renderHook(() => useOrchestratorStore(orchestrator));

      const firstResult = result.current;

      // Rerender without changing anything
      rerender();

      const secondResult = result.current;

      // Should be the same object reference due to useShallow
      expect(firstResult).toBe(secondResult);
    });
  });

  describe("initializeExerciseData", () => {
    it("should initialize data with localStorage priority logic", () => {
      // Arrange
      const orchestrator = new Orchestrator("test-uuid", "initial code");
      const serverData = {
        code: "server code",
        storedAt: new Date().toISOString()
      };

      // Act
      orchestrator.initializeExerciseData(serverData);

      // Assert
      const state = orchestrator.getStore().getState();
      expect(state.code).toBe("server code");
      expect(state.defaultCode).toBe("server code");
    });

    it("should prefer localStorage when it exists and is newer", () => {
      // Arrange
      const localCode = "localStorage code";
      const serverCode = "server code";
      const serverTime = new Date();
      const localTime = new Date(serverTime.getTime() + 120000); // 2 minutes later

      mockLoadCodeMirrorContent.mockReturnValue({
        success: true,
        data: {
          code: localCode,
          storedAt: localTime.toISOString(),
          exerciseId: "test-uuid",
          version: 1
        }
      });

      const orchestrator = new Orchestrator("test-uuid", "initial code");
      const serverData = {
        code: serverCode,
        storedAt: serverTime.toISOString()
      };

      // Act
      orchestrator.initializeExerciseData(serverData);

      // Assert
      const state = orchestrator.getStore().getState();
      expect(state.code).toBe(localCode);
      expect(state.defaultCode).toBe(localCode);
    });
  });
});
