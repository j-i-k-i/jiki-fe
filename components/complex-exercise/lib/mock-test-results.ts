import type { AnimationTimeline } from "./stubs";
import type { TestSuiteResult } from "./test-results-types";
import { createTestFrame } from "./test-utils/createTestFrame";

// Mock animation timeline for scrubber
function createMockAnimationTimeline(): AnimationTimeline {
  let currentTime = 0;
  let paused = true;
  const duration = 75; // Duration in milliseconds (matches max frame at 75ms)

  return {
    pause: () => {
      paused = true;
    },
    play: () => {
      paused = false;
    },
    paused,
    duration,
    progress: currentTime / duration,
    currentTime,
    completed: currentTime >= duration,
    hasPlayedOrScrubbed: false,
    seek: (time: number) => {
      currentTime = Math.max(0, Math.min(duration, time));
    },
    seekEndOfTimeline: () => {
      currentTime = duration;
    },
    onUpdate: (_callback: (anime: AnimationTimeline) => void) => {
      // Mock implementation - in real scenario this would be called during animation
    },
    timeline: {
      duration,
      currentTime
    }
  };
}

export const mockTestResults: TestSuiteResult = {
  status: "pass",
  tests: [
    {
      slug: "test-1",
      name: "Test 1: Basic Function Call",
      status: "pass",
      type: "io",
      codeRun: 'greet("World")',
      expects: [
        {
          pass: true,
          actual: "Hello, World!",
          expected: "Hello, World!"
        }
      ],
      // Frame data for timeline navigation
      frames: [
        createTestFrame(0, {
          line: 2,
          generateDescription: () => "Function greet() starts execution"
        }),
        createTestFrame(25000, {
          line: 3,
          generateDescription: () => 'Processing input parameter: "World"'
        }),
        createTestFrame(50000, {
          line: 4,
          generateDescription: () => 'Concatenating "Hello, " + "World" + "!"'
        }),
        createTestFrame(75000, {
          line: 5,
          generateDescription: () => 'Returning "Hello, World!"'
        })
      ],
      animationTimeline: createMockAnimationTimeline(),
      time: 0,
      view: document.createElement("div")
    },
    {
      slug: "test-2",
      name: "Test 2: Empty String Input",
      status: "fail",
      type: "io",
      codeRun: 'greet("")',
      expects: [
        {
          pass: false,
          actual: "Hello, !",
          expected: "Hello, stranger!"
        }
      ],
      // Frame data for timeline navigation
      frames: [
        createTestFrame(0, {
          line: 2,
          generateDescription: () => "Function greet() starts execution"
        }),
        createTestFrame(30000, {
          line: 3,
          generateDescription: () => 'Processing input parameter: ""'
        }),
        createTestFrame(60000, {
          line: 4,
          status: "ERROR",
          generateDescription: () => 'Empty string detected - should return "Hello, stranger!"'
        }),
        createTestFrame(90000, {
          line: 5,
          status: "ERROR",
          generateDescription: () => 'Incorrectly returning "Hello, !" instead of "Hello, stranger!"'
        })
      ],
      animationTimeline: createMockAnimationTimeline(),
      time: 60000, // Start at error frame in microseconds
      view: document.createElement("div")
    },
    {
      slug: "test-3",
      name: "Test 3: Null Input Handling",
      status: "fail",
      type: "state",
      codeRun: "greet(null)",
      expects: [
        {
          pass: false,
          actual: "Hello, null!",
          expected: "Hello, stranger!",
          errorHtml: "Expected function to handle null input gracefully, but got {value}"
        }
      ],
      // Frame data for timeline navigation
      frames: [
        createTestFrame(0, {
          line: 2,
          generateDescription: () => "Function greet() starts execution"
        }),
        createTestFrame(25000, {
          line: 3,
          status: "ERROR",
          generateDescription: () => "Processing input parameter: null"
        }),
        createTestFrame(50000, {
          line: 4,
          status: "ERROR",
          generateDescription: () => "Null check missing - should handle null gracefully"
        }),
        createTestFrame(75000, {
          line: 5,
          status: "ERROR",
          generateDescription: () => 'Incorrectly returning "Hello, null!" instead of "Hello, stranger!"'
        })
      ],
      animationTimeline: createMockAnimationTimeline(),
      time: 25000, // Start at first error frame in microseconds
      view: document.createElement("div")
    }
  ]
};

export const mockBonusTestResults: TestSuiteResult = {
  status: "idle",
  tests: [
    {
      slug: "bonus-1",
      name: "Bonus 1: Multiple Greetings",
      status: "idle",
      type: "io",
      codeRun: 'greetMultiple(["Alice", "Bob"])',
      expects: [
        {
          pass: false,
          actual: undefined,
          expected: ["Hello, Alice!", "Hello, Bob!"]
        }
      ],
      // Frame data for timeline navigation
      frames: [
        createTestFrame(0, {
          line: 8,
          generateDescription: () => "Function greetMultiple() starts execution"
        }),
        createTestFrame(30000, {
          line: 9,
          generateDescription: () => 'Processing array input: ["Alice", "Bob"]'
        }),
        createTestFrame(60000, {
          line: 10,
          status: "ERROR",
          generateDescription: () => "Function not implemented yet - should iterate over array"
        })
      ],
      animationTimeline: createMockAnimationTimeline(),
      time: 0,
      view: document.createElement("div")
    }
  ]
};
