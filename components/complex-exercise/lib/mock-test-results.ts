import type { TestSuiteResult } from "./test-results-types";
import { mockFrame, mockAnimationTimeline } from "@/tests/mocks";

// Create a view element that works on both client and server
function createViewElement(): HTMLElement {
  if (typeof document === "undefined") {
    // Return a mock element for SSR
    return {} as HTMLElement;
  }
  return document.createElement("div");
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
        mockFrame(0, {
          line: 2,
          generateDescription: () => "Function greet() starts execution"
        }),
        mockFrame(25000, {
          line: 3,
          generateDescription: () => 'Processing input parameter: "World"'
        }),
        mockFrame(50000, {
          line: 4,
          generateDescription: () => 'Concatenating "Hello, " + "World" + "!"'
        }),
        mockFrame(75000, {
          line: 5,
          generateDescription: () => 'Returning "Hello, World!"'
        })
      ],
      animationTimeline: mockAnimationTimeline({ duration: 75 }),
      time: 0,
      view: createViewElement()
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
        mockFrame(0, {
          line: 2,
          generateDescription: () => "Function greet() starts execution"
        }),
        mockFrame(30000, {
          line: 3,
          generateDescription: () => 'Processing input parameter: ""'
        }),
        mockFrame(60000, {
          line: 4,
          status: "ERROR",
          generateDescription: () => 'Empty string detected - should return "Hello, stranger!"'
        }),
        mockFrame(90000, {
          line: 5,
          status: "ERROR",
          generateDescription: () => 'Incorrectly returning "Hello, !" instead of "Hello, stranger!"'
        })
      ],
      animationTimeline: mockAnimationTimeline({ duration: 75 }),
      time: 60000, // Start at error frame in microseconds
      view: createViewElement()
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
        mockFrame(0, {
          line: 2,
          generateDescription: () => "Function greet() starts execution"
        }),
        mockFrame(25000, {
          line: 3,
          status: "ERROR",
          generateDescription: () => "Processing input parameter: null"
        }),
        mockFrame(50000, {
          line: 4,
          status: "ERROR",
          generateDescription: () => "Null check missing - should handle null gracefully"
        }),
        mockFrame(75000, {
          line: 5,
          status: "ERROR",
          generateDescription: () => 'Incorrectly returning "Hello, null!" instead of "Hello, stranger!"'
        })
      ],
      animationTimeline: mockAnimationTimeline({ duration: 75 }),
      time: 25000, // Start at first error frame in microseconds
      view: createViewElement()
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
        mockFrame(0, {
          line: 8,
          generateDescription: () => "Function greetMultiple() starts execution"
        }),
        mockFrame(30000, {
          line: 9,
          generateDescription: () => 'Processing array input: ["Alice", "Bob"]'
        }),
        mockFrame(60000, {
          line: 10,
          status: "ERROR",
          generateDescription: () => "Function not implemented yet - should iterate over array"
        })
      ],
      animationTimeline: mockAnimationTimeline({ duration: 75 }),
      time: 0,
      view: createViewElement()
    }
  ]
};
