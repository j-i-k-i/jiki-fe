/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
// ESLint thinks the type assertion is unnecessary but TypeScript needs it to access HTMLInputElement
// properties like min, max, and value. This is a known issue with @testing-library/react types.
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Scrubber from "@/components/complex-exercise/ui/scrubber/Scrubber";
import type { Orchestrator } from "@/components/complex-exercise/lib/Orchestrator";
import type { Frame } from "interpreters";
import { mockFrame, mockAnimationTimeline } from "@/tests/mocks";
import type { TestState } from "@/components/complex-exercise/lib/types";
import { useOrchestratorStore } from "@/components/complex-exercise/lib/Orchestrator";
import OrchestratorTestProvider from "@/tests/test-utils/OrchestratorTestProvider";

// Mock the orchestrator store hook
jest.mock("@/components/complex-exercise/lib/Orchestrator", () => ({
  useOrchestratorStore: jest.fn(),
  default: jest.fn()
}));

// Helper to create mock frames
function createMockFrames(count: number): Frame[] {
  return Array.from({ length: count }, (_, i) =>
    mockFrame(i * 100000, {
      // Each frame is 100ms apart
      line: i + 1,
      generateDescription: () => `Frame ${i}`
    })
  );
}

// Helper to create a TestState object
function createTestState(
  frames: Frame[],
  time: number,
  currentFrame: Frame | undefined,
  animationTimeline?: ReturnType<typeof mockAnimationTimeline>
): TestState {
  return {
    slug: "test-1",
    name: "Test 1",
    status: "pass" as const,
    expects: [],
    view: document.createElement("div"),
    frames,
    animationTimeline: animationTimeline || mockAnimationTimeline({ duration: 5 }),
    time,
    currentFrame
  };
}

// Helper to create mock orchestrator
function createMockOrchestrator(): Orchestrator {
  return {
    exerciseUuid: "test-uuid",
    setCode: jest.fn(),
    setCurrentTestTime: jest.fn(),
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
    breakpoints: [],
    prevFrame: undefined,
    nextFrame: undefined,
    prevBreakpointFrame: undefined,
    nextBreakpointFrame: undefined,
    ...overrides
  };
}

describe("Scrubber Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("container rendering", () => {
    it("should render the scrubber container with data-testid", () => {
      const mockOrchestrator = createMockOrchestrator();
      (useOrchestratorStore as jest.Mock).mockReturnValue(createMockStoreState());

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <Scrubber />
        </OrchestratorTestProvider>
      );

      const container = screen.getByTestId("scrubber");
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute("id", "scrubber");
    });

    it("should render all child components", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = mockAnimationTimeline({ duration: 5 });

      (useOrchestratorStore as jest.Mock).mockReturnValue(
        createMockStoreState({
          currentTest: createTestState(createMockFrames(3), 100, createMockFrames(3)[1], mockTimeline)
        })
      );

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <Scrubber />
        </OrchestratorTestProvider>
      );

      // Check ScrubberInput is rendered
      expect(screen.getByTestId("scrubber-range-input")).toBeInTheDocument();

      // Check FrameStepperButtons are rendered
      expect(screen.getByLabelText("Previous frame")).toBeInTheDocument();
      expect(screen.getByLabelText("Next frame")).toBeInTheDocument();
    });
  });

  describe("when currentTest is null", () => {
    it("should pass default values to child components", () => {
      const mockOrchestrator = createMockOrchestrator();
      (useOrchestratorStore as jest.Mock).mockReturnValue(createMockStoreState());

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <Scrubber />
        </OrchestratorTestProvider>
      );

      const input = screen.getByRole("slider") as HTMLInputElement;
      expect(input).toBeDisabled();
      expect(input.value).toBe("0"); // Default time
    });
  });

  describe("enabled/disabled state logic", () => {
    it("should be disabled when hasCodeBeenEdited is true", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = mockAnimationTimeline({ duration: 5 });

      const frames = createMockFrames(3);
      (useOrchestratorStore as jest.Mock).mockReturnValue(
        createMockStoreState({
          currentTest: createTestState(frames, 0, frames[0], mockTimeline),
          hasCodeBeenEdited: true
        })
      );

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <Scrubber />
        </OrchestratorTestProvider>
      );

      const input = screen.getByRole("slider");
      const prevButton = screen.getByLabelText("Previous frame");
      const nextButton = screen.getByLabelText("Next frame");

      expect(input).toBeDisabled();
      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it("should be disabled when isSpotlightActive is true", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = mockAnimationTimeline({ duration: 5 });

      const frames = createMockFrames(3);
      (useOrchestratorStore as jest.Mock).mockReturnValue(
        createMockStoreState({
          currentTest: createTestState(frames, 0, frames[0], mockTimeline),
          isSpotlightActive: true
        })
      );

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <Scrubber />
        </OrchestratorTestProvider>
      );

      const input = screen.getByRole("slider");
      expect(input).toBeDisabled();
    });

    it("should be disabled when less than 2 frames", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = mockAnimationTimeline({ duration: 5 });

      const frames = createMockFrames(1);
      (useOrchestratorStore as jest.Mock).mockReturnValue(
        createMockStoreState({
          currentTest: createTestState(frames, 0, frames[0], mockTimeline)
        })
      );

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <Scrubber />
        </OrchestratorTestProvider>
      );

      const input = screen.getByRole("slider");
      expect(input).toBeDisabled();
    });

    it("should be enabled when all conditions are met", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = mockAnimationTimeline({ duration: 5 });

      const frames = createMockFrames(2);
      (useOrchestratorStore as jest.Mock).mockReturnValue(
        createMockStoreState({
          currentTest: createTestState(frames, 0, frames[0], mockTimeline),
          hasCodeBeenEdited: false,
          isSpotlightActive: false
        })
      );

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <Scrubber />
        </OrchestratorTestProvider>
      );

      const input = screen.getByRole("slider");
      expect(input).not.toBeDisabled();
    });
  });

  describe("focus on container click", () => {
    it("should focus the range input when container is clicked", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = mockAnimationTimeline({ duration: 5 });

      const frames = createMockFrames(3);
      (useOrchestratorStore as jest.Mock).mockReturnValue(
        createMockStoreState({
          currentTest: createTestState(frames, 0, frames[0], mockTimeline)
        })
      );

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <Scrubber />
        </OrchestratorTestProvider>
      );

      const container = screen.getByTestId("scrubber");
      const input = screen.getByRole("slider") as HTMLInputElement;

      // Mock the focus method
      const focusSpy = jest.spyOn(input, "focus");

      fireEvent.click(container);

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe("prop passing to child components", () => {
    it("should pass correct props to ScrubberInput", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = mockAnimationTimeline({ duration: 300 }); // 300ms duration to accommodate time: 150
      const frames = createMockFrames(3);

      (useOrchestratorStore as jest.Mock).mockReturnValue(
        createMockStoreState({
          currentTest: createTestState(frames, 150, frames[2], mockTimeline)
        })
      );

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <Scrubber />
        </OrchestratorTestProvider>
      );

      const input = screen.getByRole("slider") as HTMLInputElement;
      expect(input.value).toBe("150");
      expect(input).not.toBeDisabled();
    });

    it("should pass correct props to FrameStepperButtons", () => {
      const mockTimeline = mockAnimationTimeline({ duration: 400 }); // 400ms duration
      const frames = createMockFrames(4); // Creates frames at time: 0, 100000, 200000, 300000 microseconds

      // Create mock orchestrator with methods that can be updated
      const mockOrchestrator = createMockOrchestrator();

      // Test navigation at first frame (position 0)
      // At first frame: no previous, has next
      (useOrchestratorStore as jest.Mock).mockReturnValue(
        createMockStoreState({
          currentTest: createTestState(frames, 0, frames[0], mockTimeline),
          hasCodeBeenEdited: false,
          isSpotlightActive: false,
          prevFrame: undefined,
          nextFrame: frames[1]
        })
      );

      const { rerender } = render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <Scrubber />
        </OrchestratorTestProvider>
      );

      expect(screen.getByLabelText("Previous frame")).toBeDisabled(); // No previous frame
      expect(screen.getByLabelText("Next frame")).not.toBeDisabled(); // Has next frame

      // Test navigation at middle position (between frames)
      // In middle: has both previous and next
      (useOrchestratorStore as jest.Mock).mockReturnValue(
        createMockStoreState({
          currentTest: createTestState(frames, 150000, frames[1], mockTimeline), // 150ms in microseconds
          hasCodeBeenEdited: false,
          isSpotlightActive: false,
          prevFrame: frames[0],
          nextFrame: frames[2]
        })
      );

      rerender(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <Scrubber />
        </OrchestratorTestProvider>
      );

      expect(screen.getByLabelText("Previous frame")).not.toBeDisabled(); // Has previous frames
      expect(screen.getByLabelText("Next frame")).not.toBeDisabled(); // Has next frame

      // Test navigation at last frame (position 3)
      // At last frame: has previous, no next
      (useOrchestratorStore as jest.Mock).mockReturnValue(
        createMockStoreState({
          currentTest: createTestState(frames, 300000, frames[3], mockTimeline), // 300ms in microseconds
          hasCodeBeenEdited: false,
          isSpotlightActive: false,
          prevFrame: frames[2],
          nextFrame: undefined
        })
      );

      rerender(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <Scrubber />
        </OrchestratorTestProvider>
      );

      expect(screen.getByLabelText("Previous frame")).not.toBeDisabled(); // Has previous frame
      expect(screen.getByLabelText("Next frame")).toBeDisabled(); // No next frame
    });
  });
});
