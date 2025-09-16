/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
// ESLint thinks the type assertion is unnecessary but TypeScript needs it to access HTMLInputElement
// properties like min, max, and value. This is a known issue with @testing-library/react types.
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Scrubber from "@/components/complex-exercise/ui/Scrubber";
import type { Orchestrator } from "@/components/complex-exercise/lib/Orchestrator";
import type { Frame, AnimationTimeline } from "@/components/complex-exercise/lib/stubs";
import { useOrchestratorStore } from "@/components/complex-exercise/lib/Orchestrator";

// Mock the orchestrator store hook
jest.mock("@/components/complex-exercise/lib/Orchestrator", () => ({
  useOrchestratorStore: jest.fn(),
  default: jest.fn()
}));

// Helper to create mock frames
function createMockFrames(count: number): Frame[] {
  return Array.from({ length: count }, (_, i) => ({
    time: i * 0.01,
    timelineTime: i,
    line: i + 1,
    status: "SUCCESS" as const,
    description: `Frame ${i}`
  }));
}

// Helper to create mock animation timeline
function createMockAnimationTimeline(duration: number = 5): AnimationTimeline {
  return {
    duration,
    paused: true,
    seek: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    progress: 0,
    currentTime: 0,
    completed: false,
    hasPlayedOrScrubbed: false,
    seekEndOfTimeline: jest.fn(),
    onUpdate: jest.fn(),
    timeline: {
      duration,
      currentTime: 0
    }
  };
}

// Helper to create mock orchestrator
function createMockOrchestrator(): Orchestrator {
  return {
    exerciseUuid: "test-uuid",
    setCode: jest.fn(),
    setTimelineValue: jest.fn(),
    setCurrentTest: jest.fn(),
    setHasCodeBeenEdited: jest.fn(),
    setIsSpotlightActive: jest.fn(),
    getNearestCurrentFrame: jest.fn().mockReturnValue(null),
    runCode: jest.fn(),
    getStore: jest.fn()
  } as unknown as Orchestrator;
}

// Helper to create mock store state
function createMockStoreState(overrides?: Partial<ReturnType<typeof useOrchestratorStore>>) {
  return {
    currentTest: null,
    hasCodeBeenEdited: false,
    isSpotlightActive: false,
    exerciseUuid: "test-uuid",
    code: "",
    output: "",
    status: "idle" as const,
    error: null,
    foldedLines: [],
    ...overrides
  };
}

describe("Scrubber Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when currentTest is null", () => {
    it("should render a disabled scrubber with default values", () => {
      const mockOrchestrator = createMockOrchestrator();
      (useOrchestratorStore as jest.Mock).mockReturnValue(createMockStoreState());

      render(<Scrubber orchestrator={mockOrchestrator} />);

      const input = screen.getByRole("slider") as HTMLInputElement;
      expect(input).toBeDisabled();
      expect(input.min).toBe("-1"); // calculateMinInputValue([]) returns -1
      expect(input.max).toBe("0"); // calculateMaxInputValue({ duration: 0 }) returns 0
      expect(input.value).toBe("0");
    });

    it("should still render the scrubber container with data-testid", () => {
      const mockOrchestrator = createMockOrchestrator();
      (useOrchestratorStore as jest.Mock).mockReturnValue(createMockStoreState());

      render(<Scrubber orchestrator={mockOrchestrator} />);

      const container = screen.getByTestId("scrubber");
      expect(container).toBeInTheDocument();
    });
  });

  describe("when currentTest exists", () => {
    describe("range input min/max values", () => {
      it("should set min to -1 when less than 2 frames", () => {
        const mockOrchestrator = createMockOrchestrator();
        const mockTimeline = createMockAnimationTimeline(0);

        (useOrchestratorStore as jest.Mock).mockReturnValue(
          createMockStoreState({
            currentTest: {
              frames: createMockFrames(1),
              animationTimeline: mockTimeline,
              timelineValue: 0
            }
          })
        );

        render(<Scrubber orchestrator={mockOrchestrator} />);

        const input = screen.getByRole("slider") as HTMLInputElement;
        expect(input.min).toBe("-1");
      });

      it("should set min to 0 when 2 or more frames", () => {
        const mockOrchestrator = createMockOrchestrator();
        const mockTimeline = createMockAnimationTimeline(5);

        (useOrchestratorStore as jest.Mock).mockReturnValue(
          createMockStoreState({
            currentTest: {
              frames: createMockFrames(3),
              animationTimeline: mockTimeline,
              timelineValue: 0
            }
          })
        );

        render(<Scrubber orchestrator={mockOrchestrator} />);

        const input = screen.getByRole("slider") as HTMLInputElement;
        expect(input.min).toBe("0");
      });

      it("should calculate max value as duration * 100", () => {
        const mockOrchestrator = createMockOrchestrator();
        const mockTimeline = createMockAnimationTimeline(7.5);

        (useOrchestratorStore as jest.Mock).mockReturnValue(
          createMockStoreState({
            currentTest: {
              frames: createMockFrames(5),
              animationTimeline: mockTimeline,
              timelineValue: 0
            }
          })
        );

        render(<Scrubber orchestrator={mockOrchestrator} />);

        const input = screen.getByRole("slider") as HTMLInputElement;
        expect(input.max).toBe("750"); // 7.5 * 100
      });
    });

    describe("current value", () => {
      it("should display the current timelineValue", () => {
        const mockOrchestrator = createMockOrchestrator();
        const mockTimeline = createMockAnimationTimeline(10);

        (useOrchestratorStore as jest.Mock).mockReturnValue(
          createMockStoreState({
            currentTest: {
              frames: createMockFrames(5),
              animationTimeline: mockTimeline,
              timelineValue: 250
            }
          })
        );

        render(<Scrubber orchestrator={mockOrchestrator} />);

        const input = screen.getByRole("slider") as HTMLInputElement;
        expect(input.value).toBe("250");
      });
    });

    describe("handleChange", () => {
      it("should call setTimelineValue and seek when value changes", () => {
        const mockOrchestrator = createMockOrchestrator();
        const mockTimeline = createMockAnimationTimeline(10);

        (useOrchestratorStore as jest.Mock).mockReturnValue(
          createMockStoreState({
            currentTest: {
              frames: createMockFrames(5),
              animationTimeline: mockTimeline,
              timelineValue: 0
            }
          })
        );

        render(<Scrubber orchestrator={mockOrchestrator} />);

        const input = screen.getByRole("slider") as HTMLInputElement;
        fireEvent.change(input, { target: { value: "300" } });

        expect(mockOrchestrator.setTimelineValue).toHaveBeenCalledWith(300);
        expect(mockTimeline.seek).toHaveBeenCalledWith(3); // 300 / 100
      });
    });

    describe("disabled state", () => {
      it("should be disabled when hasCodeBeenEdited is true", () => {
        const mockOrchestrator = createMockOrchestrator();
        const mockTimeline = createMockAnimationTimeline(5);

        (useOrchestratorStore as jest.Mock).mockReturnValue(
          createMockStoreState({
            currentTest: {
              frames: createMockFrames(3),
              animationTimeline: mockTimeline,
              timelineValue: 0
            },
            hasCodeBeenEdited: true
          })
        );

        render(<Scrubber orchestrator={mockOrchestrator} />);

        const input = screen.getByRole("slider") as HTMLInputElement;
        expect(input).toBeDisabled();
      });

      it("should be disabled when isSpotlightActive is true", () => {
        const mockOrchestrator = createMockOrchestrator();
        const mockTimeline = createMockAnimationTimeline(5);

        (useOrchestratorStore as jest.Mock).mockReturnValue(
          createMockStoreState({
            currentTest: {
              frames: createMockFrames(3),
              animationTimeline: mockTimeline,
              timelineValue: 0
            },
            isSpotlightActive: true
          })
        );

        render(<Scrubber orchestrator={mockOrchestrator} />);

        const input = screen.getByRole("slider") as HTMLInputElement;
        expect(input).toBeDisabled();
      });

      it("should be disabled when less than 2 frames", () => {
        const mockOrchestrator = createMockOrchestrator();
        const mockTimeline = createMockAnimationTimeline(5);

        (useOrchestratorStore as jest.Mock).mockReturnValue(
          createMockStoreState({
            currentTest: {
              frames: createMockFrames(1),
              animationTimeline: mockTimeline,
              timelineValue: 0
            }
          })
        );

        render(<Scrubber orchestrator={mockOrchestrator} />);

        const input = screen.getByRole("slider") as HTMLInputElement;
        expect(input).toBeDisabled();
      });

      it("should be enabled when 2 or more frames", () => {
        const mockOrchestrator = createMockOrchestrator();
        const mockTimeline = createMockAnimationTimeline(5);

        (useOrchestratorStore as jest.Mock).mockReturnValue(
          createMockStoreState({
            currentTest: {
              frames: createMockFrames(2),
              animationTimeline: mockTimeline,
              timelineValue: 0
            }
          })
        );

        render(<Scrubber orchestrator={mockOrchestrator} />);

        const input = screen.getByRole("slider") as HTMLInputElement;
        expect(input).not.toBeDisabled();
      });
    });

    describe("focus on click", () => {
      it("should focus the range input when container is clicked", () => {
        const mockOrchestrator = createMockOrchestrator();
        const mockTimeline = createMockAnimationTimeline(5);

        (useOrchestratorStore as jest.Mock).mockReturnValue(
          createMockStoreState({
            currentTest: {
              frames: createMockFrames(3),
              animationTimeline: mockTimeline,
              timelineValue: 0
            }
          })
        );

        render(<Scrubber orchestrator={mockOrchestrator} />);

        const container = screen.getByTestId("scrubber");
        const input = screen.getByRole("slider") as HTMLInputElement;

        // Mock the focus method
        const focusSpy = jest.spyOn(input, "focus");

        fireEvent.click(container);

        expect(focusSpy).toHaveBeenCalled();
      });
    });
  });

  describe("helper functions", () => {
    // These tests verify the pure logic of the helper functions
    // by testing them through the component's behavior

    it("calculateMinInputValue returns -1 for single frame", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = createMockAnimationTimeline(0);

      (useOrchestratorStore as jest.Mock).mockReturnValue({
        currentTest: {
          frames: createMockFrames(1),
          animationTimeline: mockTimeline,
          timelineValue: 0
        }
      });

      render(<Scrubber orchestrator={mockOrchestrator} />);

      const input = screen.getByRole("slider") as HTMLInputElement;
      expect(input.min).toBe("-1");
    });

    it("calculateMaxInputValue scales duration by 100", () => {
      const mockOrchestrator = createMockOrchestrator();
      const testCases = [
        { duration: 1, expected: "100" },
        { duration: 5.5, expected: "550" },
        { duration: 10, expected: "1000" },
        { duration: 0.5, expected: "50" }
      ];

      testCases.forEach(({ duration, expected }) => {
        const mockTimeline = createMockAnimationTimeline(duration);

        (useOrchestratorStore as jest.Mock).mockReturnValue(
          createMockStoreState({
            currentTest: {
              frames: createMockFrames(3),
              animationTimeline: mockTimeline,
              timelineValue: 0
            }
          })
        );

        const { rerender } = render(<Scrubber orchestrator={mockOrchestrator} />);

        const input = screen.getByRole("slider") as HTMLInputElement;
        expect(input.max).toBe(expected);

        rerender(<></>); // Clean up between test cases
      });
    });
  });
});
