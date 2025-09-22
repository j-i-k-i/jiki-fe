import type { AnimationTimeline } from "./stubs";
import type { TestSuiteResult } from "./test-results-types";

// Mock animation timeline for scrubber
function createMockAnimationTimeline(): AnimationTimeline {
  let currentTime = 0;
  let paused = true;
  const duration = 100;

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
      frames: [
        {
          description: 'Function called with "World"',
          line: 5,
          status: "SUCCESS"
        }
      ],
      // Scrubber data for timeline navigation
      scrubberFrames: [
        {
          line: 2,
          interpreterTime: 0,
          timelineTime: 0,
          status: "SUCCESS",
          description: "Function greet() starts execution"
        },
        {
          line: 3,
          interpreterTime: 25,
          timelineTime: 25,
          status: "SUCCESS",
          description: 'Processing input parameter: "World"'
        },
        {
          line: 4,
          interpreterTime: 50,
          timelineTime: 50,
          status: "SUCCESS",
          description: 'Concatenating "Hello, " + "World" + "!"'
        },
        {
          line: 5,
          interpreterTime: 75,
          timelineTime: 75,
          status: "SUCCESS",
          description: 'Returning "Hello, World!"'
        }
      ],
      animationTimeline: createMockAnimationTimeline(),
      timelineTime: 0
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
      frames: [
        {
          description: "Function should handle empty string input",
          line: 3,
          status: "ERROR"
        }
      ],
      // Scrubber data for timeline navigation
      scrubberFrames: [
        {
          line: 2,
          interpreterTime: 0,
          timelineTime: 0,
          status: "SUCCESS",
          description: "Function greet() starts execution"
        },
        {
          line: 3,
          interpreterTime: 30,
          timelineTime: 30,
          status: "SUCCESS",
          description: 'Processing input parameter: ""'
        },
        {
          line: 4,
          interpreterTime: 60,
          timelineTime: 60,
          status: "ERROR",
          description: 'Empty string detected - should return "Hello, stranger!"'
        },
        {
          line: 5,
          interpreterTime: 90,
          timelineTime: 90,
          status: "ERROR",
          description: 'Incorrectly returning "Hello, !" instead of "Hello, stranger!"'
        }
      ],
      animationTimeline: createMockAnimationTimeline(),
      timelineTime: 60 // Start at error frame
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
      frames: [
        {
          description: "Function should handle null input",
          line: 2,
          status: "ERROR"
        }
      ],
      // Scrubber data for timeline navigation
      scrubberFrames: [
        {
          line: 2,
          interpreterTime: 0,
          timelineTime: 0,
          status: "SUCCESS",
          description: "Function greet() starts execution"
        },
        {
          line: 3,
          interpreterTime: 25,
          timelineTime: 25,
          status: "ERROR",
          description: "Processing input parameter: null"
        },
        {
          line: 4,
          interpreterTime: 50,
          timelineTime: 50,
          status: "ERROR",
          description: "Null check missing - should handle null gracefully"
        },
        {
          line: 5,
          interpreterTime: 75,
          timelineTime: 75,
          status: "ERROR",
          description: 'Incorrectly returning "Hello, null!" instead of "Hello, stranger!"'
        }
      ],
      animationTimeline: createMockAnimationTimeline(),
      timelineTime: 25 // Start at first error frame
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
      frames: [
        {
          description: "Function should handle array input",
          line: 8,
          status: "ERROR"
        }
      ],
      // Scrubber data for timeline navigation
      scrubberFrames: [
        {
          line: 8,
          interpreterTime: 0,
          timelineTime: 0,
          status: "SUCCESS",
          description: "Function greetMultiple() starts execution"
        },
        {
          line: 9,
          interpreterTime: 30,
          timelineTime: 30,
          status: "SUCCESS",
          description: 'Processing array input: ["Alice", "Bob"]'
        },
        {
          line: 10,
          interpreterTime: 60,
          timelineTime: 60,
          status: "ERROR",
          description: "Function not implemented yet - should iterate over array"
        }
      ],
      animationTimeline: createMockAnimationTimeline(),
      timelineTime: 0
    }
  ]
};
