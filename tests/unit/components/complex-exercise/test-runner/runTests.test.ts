import { runTests } from "@/components/complex-exercise/lib/test-runner/runTests";
import { jikiscript } from "interpreters";

// Mock the interpreters module
jest.mock("interpreters", () => ({
  jikiscript: {
    interpret: jest.fn()
  },
  TIME_SCALE_FACTOR: 1000
}));

// Mock the BasicExercise
jest.mock("@/components/complex-exercise/lib/mock-exercise/BasicExercise", () => {
  return {
    BasicExercise: jest.fn().mockImplementation(() => ({
      position: 100, // This will match the expectation for start-at-0
      animations: [],
      availableFunctions: [
        {
          name: "move",
          func: jest.fn()
        }
      ],
      setStartPosition: jest.fn(),
      getState: jest.fn().mockReturnValue({ position: 100 }),
      getView: jest.fn().mockReturnValue(document.createElement("div"))
    }))
  };
});

// Mock the test scenarios
jest.mock("@/components/complex-exercise/lib/mock-exercise/BasicExercise.test", () => ({
  __esModule: true,
  default: {
    title: "Basic Movement",
    exerciseType: "basic",
    tasks: [
      {
        name: "Move the character",
        scenarios: [
          {
            slug: "start-at-0",
            name: "Starting from position 0",
            description: "Move the character 5 times starting from position 0",
            setup: jest.fn(),
            expectations: jest.fn(() => [{ pass: true }])
          },
          {
            slug: "start-at-50",
            name: "Starting from position 50",
            description: "Move the character 5 times starting from position 50",
            setup: jest.fn(),
            expectations: jest.fn(() => [{ pass: true }])
          }
        ]
      }
    ]
  }
}));

// Mock the AnimationTimeline
jest.mock("@/components/complex-exercise/lib/AnimationTimeline", () => {
  return {
    AnimationTimeline: jest.fn().mockImplementation((options, frames) => ({
      frames,
      duration: frames[frames.length - 1]?.time || 0,
      populateTimeline: jest.fn().mockReturnThis()
    }))
  };
});

describe("runTests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initial scrubber time", () => {
    it("should set initial time to first frame's time, not 0", () => {
      // Mock frames with first frame at 100000 microseconds
      const mockFrames = [
        { time: 100000, timeInMs: 100, status: "SUCCESS", line: 1 },
        { time: 200000, timeInMs: 200, status: "SUCCESS", line: 2 },
        { time: 300000, timeInMs: 300, status: "SUCCESS", line: 3 }
      ];

      (jikiscript.interpret as jest.Mock).mockReturnValue({
        frames: mockFrames,
        value: undefined,
        status: "SUCCESS"
      });

      const code = "move()\nmove()\nmove()";
      const result = runTests(code);

      // Check that the first test has time set to the first frame's time
      expect(result.tests[0].time).toBe(100000); // Should be first frame's time, not 0
      expect(result.tests[1].time).toBe(100000); // Both scenarios should start at first frame
    });

    it("should handle empty frames array", () => {
      (jikiscript.interpret as jest.Mock).mockReturnValue({
        frames: [],
        value: undefined,
        status: "SUCCESS"
      });

      const code = "";
      const result = runTests(code);

      // Should fallback to 0 when no frames
      expect(result.tests[0].time).toBe(0);
    });
  });

  describe("test execution", () => {
    it("should run all scenarios and return correct status", () => {
      const mockFrames = [
        { time: 100000, timeInMs: 100, status: "SUCCESS", line: 1 },
        { time: 200000, timeInMs: 200, status: "SUCCESS", line: 2 }
      ];

      (jikiscript.interpret as jest.Mock).mockReturnValue({
        frames: mockFrames,
        value: undefined,
        status: "SUCCESS"
      });

      const code = "move()\nmove()";
      const result = runTests(code);

      // Should have 2 test scenarios
      expect(result.tests).toHaveLength(2);
      expect(result.tests[0].slug).toBe("start-at-0");
      expect(result.tests[1].slug).toBe("start-at-50");

      // Both should pass with the mocked data
      expect(result.tests[0].status).toBe("pass");
      expect(result.tests[1].status).toBe("pass");
      expect(result.status).toBe("pass");
    });
  });
});
