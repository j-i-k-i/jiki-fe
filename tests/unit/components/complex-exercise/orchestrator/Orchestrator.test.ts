import { renderHook } from "@testing-library/react";
import Orchestrator, { useOrchestratorStore } from "@/components/complex-exercise/lib/Orchestrator";

describe("Orchestrator", () => {
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

    it("should initialize with mock test data", () => {
      const orchestrator = new Orchestrator("test-uuid", "");
      const state = orchestrator.getStore().getState();

      expect(state.currentTest).not.toBeNull();
      expect(state.currentTest?.frames).toHaveLength(5);
      expect(state.currentTest?.timelineTime).toBe(0);
      expect(state.currentTest?.animationTimeline).toBeDefined();
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
      const state = orchestrator.getStore().getState();

      // Initial frame should be the first one
      expect(state.currentTest?.currentFrame?.line).toBe(1);

      // Change timeline time to between frames (should NOT update currentFrame)
      orchestrator.setCurrentTestTimelineTime(150);
      let updatedState = orchestrator.getStore().getState();
      expect(updatedState.currentTest?.currentFrame?.line).toBe(1); // Should stay at 1

      // Change timeline time to exact frame position (should update currentFrame)
      orchestrator.setCurrentTestTimelineTime(200);
      updatedState = orchestrator.getStore().getState();
      expect(updatedState.currentTest?.currentFrame?.line).toBe(3); // Should update to line 3
    });

    it("should recalculate navigation frames when setFoldedLines is called", () => {
      const orchestrator = new Orchestrator("test-uuid", "");

      // Set timeline to line 2
      orchestrator.setCurrentTestTimelineTime(100);
      let state = orchestrator.getStore().getState();
      expect(state.currentTest?.currentFrame?.line).toBe(2);

      // Fold line 2
      orchestrator.setFoldedLines([2]);

      // currentFrame should remain the same (we haven't moved the timeline)
      state = orchestrator.getStore().getState();
      expect(state.currentTest?.currentFrame?.line).toBe(2);

      // But navigation frames should skip the folded line
      expect(state.currentTest?.prevFrame?.line).toBe(1);
      expect(state.currentTest?.nextFrame?.line).toBe(3);
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
});
