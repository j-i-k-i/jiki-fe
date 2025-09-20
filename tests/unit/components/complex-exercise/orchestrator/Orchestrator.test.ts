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
    it("should update currentFrame when setCurrentTestTimelineTime is called", () => {
      const orchestrator = new Orchestrator("test-uuid", "");
      const state = orchestrator.getStore().getState();

      // Initial frame should be the first one
      expect(state.currentTest?.currentFrame?.line).toBe(1);

      // Change timeline time
      orchestrator.setCurrentTestTimelineTime(150);

      // Frame should update to nearest frame (equidistant from 100 and 200, picks later)
      const updatedState = orchestrator.getStore().getState();
      expect(updatedState.currentTest?.currentFrame?.line).toBe(3);
    });

    it("should recalculate frame when setFoldedLines is called", () => {
      const orchestrator = new Orchestrator("test-uuid", "");

      // Set timeline to line 2
      orchestrator.setCurrentTestTimelineTime(100);
      let state = orchestrator.getStore().getState();
      expect(state.currentTest?.currentFrame?.line).toBe(2);

      // Fold line 2
      orchestrator.setFoldedLines([2]);

      // Frame should skip the folded line and pick nearest non-folded (line 1 or 3)
      state = orchestrator.getStore().getState();
      expect(state.currentTest?.currentFrame?.line).not.toBe(2);
      // Should pick line 3 since it's the next available frame when line 2 is folded
      expect(state.currentTest?.currentFrame?.line).toBe(3);
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
