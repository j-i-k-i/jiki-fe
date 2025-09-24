import Orchestrator from "@/components/complex-exercise/lib/Orchestrator";
import { mockFrame } from "@/tests/mocks";
import type { TestState } from "@/components/complex-exercise/lib/types";

// Mock localStorage functions to prevent actual localStorage usage
jest.mock("@/components/complex-exercise/lib/localStorage", () => ({
  loadCodeMirrorContent: jest.fn(() => ({ success: false })),
  saveCodeMirrorContent: jest.fn()
}));

// Helper to create a test state
function createTestState(slug: string, time: number = 0, frames?: ReturnType<typeof mockFrame>[]): TestState {
  const defaultFrames = frames || [
    mockFrame(0, { line: 1 }),
    mockFrame(100000, { line: 2 }),
    mockFrame(200000, { line: 3 })
  ];

  return {
    slug,
    name: `Test ${slug}`,
    status: "pass" as const,
    expects: [],
    view: document.createElement("div"),
    frames: defaultFrames,
    animationTimeline: null as any,
    time,
    currentFrame: defaultFrames[0]
  };
}

describe("Store Test Time Persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("testCurrentTimes initialization", () => {
    it("should initialize testCurrentTimes as an empty object", () => {
      const orchestrator = new Orchestrator("test-uuid", "");
      const state = orchestrator.getStore().getState();

      expect(state.testCurrentTimes).toEqual({});
    });
  });

  describe("setCurrentTestTime", () => {
    it("should save the current time to testCurrentTimes when updating time", () => {
      const orchestrator = new Orchestrator("test-uuid", "");
      const test = createTestState("test-1", 0);

      orchestrator.setCurrentTest(test);
      orchestrator.setCurrentTestTime(150000);

      const state = orchestrator.getStore().getState();
      expect(state.testCurrentTimes["test-1"]).toBe(150000);
    });

    it("should update the saved time when scrubbing multiple times", () => {
      const orchestrator = new Orchestrator("test-uuid", "");
      const test = createTestState("test-1", 0);

      orchestrator.setCurrentTest(test);

      // First scrub
      orchestrator.setCurrentTestTime(50000);
      let state = orchestrator.getStore().getState();
      expect(state.testCurrentTimes["test-1"]).toBe(50000);

      // Second scrub
      orchestrator.setCurrentTestTime(150000);
      state = orchestrator.getStore().getState();
      expect(state.testCurrentTimes["test-1"]).toBe(150000);

      // Third scrub
      orchestrator.setCurrentTestTime(75000);
      state = orchestrator.getStore().getState();
      expect(state.testCurrentTimes["test-1"]).toBe(75000);
    });

    it("should maintain separate times for different tests", () => {
      const orchestrator = new Orchestrator("test-uuid", "");
      const test1 = createTestState("test-1", 0);
      const test2 = createTestState("test-2", 0);

      // Set time for test 1
      orchestrator.setCurrentTest(test1);
      orchestrator.setCurrentTestTime(100000);

      // Set time for test 2
      orchestrator.setCurrentTest(test2);
      orchestrator.setCurrentTestTime(200000);

      const state = orchestrator.getStore().getState();
      expect(state.testCurrentTimes["test-1"]).toBe(100000);
      expect(state.testCurrentTimes["test-2"]).toBe(200000);
    });
  });

  describe("setCurrentTest", () => {
    it("should use the test's initial time when no saved time exists", () => {
      const orchestrator = new Orchestrator("test-uuid", "");
      const test = createTestState("test-1", 50000);

      orchestrator.setCurrentTest(test);

      const state = orchestrator.getStore().getState();
      expect(state.currentTest?.time).toBe(50000);
      expect(state.testCurrentTimes["test-1"]).toBe(50000);
    });

    it("should restore the saved time when switching back to a test", () => {
      const orchestrator = new Orchestrator("test-uuid", "");
      const test1 = createTestState("test-1", 0);
      const test2 = createTestState("test-2", 0);

      // Set test 1 and scrub to a position
      orchestrator.setCurrentTest(test1);
      orchestrator.setCurrentTestTime(150000);

      // Switch to test 2
      orchestrator.setCurrentTest(test2);
      orchestrator.setCurrentTestTime(75000);

      // Switch back to test 1 - should restore the saved position
      orchestrator.setCurrentTest(test1);

      const state = orchestrator.getStore().getState();
      expect(state.currentTest?.time).toBe(150000); // Restored position
      expect(state.currentTest?.slug).toBe("test-1");
    });

    it("should handle switching between multiple tests and preserve all positions", () => {
      const orchestrator = new Orchestrator("test-uuid", "");
      const test1 = createTestState("test-1", 0);
      const test2 = createTestState("test-2", 0);
      const test3 = createTestState("test-3", 0);

      // Set positions for all three tests
      orchestrator.setCurrentTest(test1);
      orchestrator.setCurrentTestTime(100000);

      orchestrator.setCurrentTest(test2);
      orchestrator.setCurrentTestTime(200000);

      orchestrator.setCurrentTest(test3);
      orchestrator.setCurrentTestTime(300000);

      // Verify all positions are saved
      let state = orchestrator.getStore().getState();
      expect(state.testCurrentTimes["test-1"]).toBe(100000);
      expect(state.testCurrentTimes["test-2"]).toBe(200000);
      expect(state.testCurrentTimes["test-3"]).toBe(300000);

      // Switch back to test 2 and verify restoration
      orchestrator.setCurrentTest(test2);
      state = orchestrator.getStore().getState();
      expect(state.currentTest?.time).toBe(200000);

      // Switch to test 1 and verify restoration
      orchestrator.setCurrentTest(test1);
      state = orchestrator.getStore().getState();
      expect(state.currentTest?.time).toBe(100000);

      // Switch to test 3 and verify restoration
      orchestrator.setCurrentTest(test3);
      state = orchestrator.getStore().getState();
      expect(state.currentTest?.time).toBe(300000);
    });

    it("should handle setting a null test", () => {
      const orchestrator = new Orchestrator("test-uuid", "");
      const test = createTestState("test-1", 0);

      orchestrator.setCurrentTest(test);
      orchestrator.setCurrentTestTime(150000);

      // Set null test
      orchestrator.setCurrentTest(null);

      const state = orchestrator.getStore().getState();
      expect(state.currentTest).toBeNull();
      // Saved times should still be preserved
      expect(state.testCurrentTimes["test-1"]).toBe(150000);
    });

    it("should update the saved time even when switching to the same test", () => {
      const orchestrator = new Orchestrator("test-uuid", "");
      const test = createTestState("test-1", 0);

      orchestrator.setCurrentTest(test);
      orchestrator.setCurrentTestTime(100000);

      // Create a new test object with same slug but different initial time
      const sameTestNewTime = createTestState("test-1", 50000);
      orchestrator.setCurrentTest(sameTestNewTime);

      const state = orchestrator.getStore().getState();
      // Should use the saved time, not the new test's initial time
      expect(state.currentTest?.time).toBe(100000);
    });
  });

  describe("frame synchronization with persisted times", () => {
    it("should correctly set currentFrame when restoring a saved time that matches a frame", () => {
      const orchestrator = new Orchestrator("test-uuid", "");
      const frames = [mockFrame(0, { line: 1 }), mockFrame(100000, { line: 2 }), mockFrame(200000, { line: 3 })];
      const test1 = createTestState("test-1", 0, frames);
      const test2 = createTestState("test-2", 0, frames);

      // Set test 1 and move to exact frame position
      orchestrator.setCurrentTest(test1);
      orchestrator.setCurrentTestTime(100000); // Exact frame at line 2

      // Switch to test 2
      orchestrator.setCurrentTest(test2);

      // Switch back to test 1
      orchestrator.setCurrentTest(test1);

      const state = orchestrator.getStore().getState();
      expect(state.currentTest?.time).toBe(100000);
      expect(state.currentTest?.currentFrame?.line).toBe(2);
    });

    it("should handle restoring a time between frames", () => {
      const orchestrator = new Orchestrator("test-uuid", "");
      const frames = [mockFrame(0, { line: 1 }), mockFrame(100000, { line: 2 }), mockFrame(200000, { line: 3 })];
      const test = createTestState("test-1", 0, frames);

      orchestrator.setCurrentTest(test);
      orchestrator.setCurrentTestTime(150000); // Between frames

      // Switch away and back
      orchestrator.setCurrentTest(null);
      orchestrator.setCurrentTest(test);

      const state = orchestrator.getStore().getState();
      expect(state.currentTest?.time).toBe(150000);
      // currentFrame should still be the last frame we passed
      expect(state.currentTest?.currentFrame?.line).toBe(1);
    });
  });
});
