import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import FrameStepperButtons from "@/components/complex-exercise/ui/scrubber/FrameStepperButtons";
import type { Orchestrator } from "@/components/complex-exercise/lib/Orchestrator";
import type { Frame } from "@/components/complex-exercise/lib/stubs";
import { useOrchestratorStore } from "@/components/complex-exercise/lib/Orchestrator";

// Mock the orchestrator store hook
jest.mock("@/components/complex-exercise/lib/Orchestrator", () => ({
  useOrchestratorStore: jest.fn()
}));

// Helper to create mock frames
function createMockFrames(count: number): Frame[] {
  return Array.from({ length: count }, (_, i) => ({
    interpreterTime: i * 0.01,
    timelineTime: i * 100,
    line: i + 1,
    status: "SUCCESS" as const,
    description: `Frame ${i}`
  }));
}

// Helper to create mock orchestrator with configurable frame navigation
function createMockOrchestrator(
  options: {
    prevFrame?: Frame | undefined;
    nextFrame?: Frame | undefined;
  } = {}
): Orchestrator {
  return {
    exerciseUuid: "test-uuid",
    setCode: jest.fn(),
    setCurrentTestTimelineTime: jest.fn(),
    setCurrentTest: jest.fn(),
    setHasCodeBeenEdited: jest.fn(),
    setIsSpotlightActive: jest.fn(),
    getNearestCurrentFrame: jest.fn().mockReturnValue(null),
    findPrevFrame: jest.fn().mockReturnValue(options.prevFrame),
    findNextFrame: jest.fn().mockReturnValue(options.nextFrame),
    runCode: jest.fn(),
    getStore: jest.fn()
  } as unknown as Orchestrator;
}

// Helper to setup store mock
function setupStoreMock(currentFrame: Frame | null = null, timelineTime: number = 0) {
  (useOrchestratorStore as jest.Mock).mockReturnValue({
    currentTest: currentFrame ? { currentFrame, timelineTime } : null,
    foldedLines: []
  });
}

describe("FrameStepperButtons Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for useOrchestratorStore
    setupStoreMock();
  });

  describe("button rendering", () => {
    it("should render both previous and next buttons", () => {
      const mockOrchestrator = createMockOrchestrator();

      // Setup store mock with current frame
      setupStoreMock();
      render(<FrameStepperButtons orchestrator={mockOrchestrator} enabled={true} />);

      expect(screen.getByLabelText("Previous frame")).toBeInTheDocument();
      expect(screen.getByLabelText("Next frame")).toBeInTheDocument();
    });

    it("should have correct data-ci attribute on container", () => {
      const mockOrchestrator = createMockOrchestrator();

      // Setup store mock with current frame
      setupStoreMock();
      const { container } = render(<FrameStepperButtons orchestrator={mockOrchestrator} enabled={true} />);

      const buttonsContainer = container.querySelector('[data-ci="frame-stepper-buttons"]');
      expect(buttonsContainer).toBeInTheDocument();
      expect(buttonsContainer).toHaveClass("frame-stepper-buttons");
    });
  });

  describe("previous button functionality", () => {
    it("should be enabled when previous frame exists", () => {
      const frames = createMockFrames(5);
      const mockOrchestrator = createMockOrchestrator({
        prevFrame: frames[1] // Has a previous frame
      });

      // Setup store mock with current frame
      setupStoreMock(frames[2], 200);
      render(<FrameStepperButtons orchestrator={mockOrchestrator} enabled={true} />);

      const prevButton = screen.getByLabelText("Previous frame");
      expect(prevButton).not.toBeDisabled();
    });

    it("should be disabled when no previous frame exists", () => {
      const mockOrchestrator = createMockOrchestrator({
        prevFrame: undefined // No previous frame
      });

      // Setup store mock with current frame
      setupStoreMock();
      render(<FrameStepperButtons orchestrator={mockOrchestrator} enabled={true} />);

      const prevButton = screen.getByLabelText("Previous frame");
      expect(prevButton).toBeDisabled();
    });

    it("should be disabled when enabled prop is false", () => {
      const frames = createMockFrames(5);
      const mockOrchestrator = createMockOrchestrator({
        prevFrame: frames[1] // Has a previous frame
      });

      // Setup store mock with current frame
      setupStoreMock();
      render(<FrameStepperButtons orchestrator={mockOrchestrator} enabled={false} />);

      const prevButton = screen.getByLabelText("Previous frame");
      expect(prevButton).toBeDisabled();
    });

    it("should navigate to previous frame on click", () => {
      const frames = createMockFrames(5);
      const prevFrame = frames[2];
      const mockOrchestrator = createMockOrchestrator({
        prevFrame: prevFrame
      });

      // Setup store mock with current frame
      setupStoreMock();
      render(<FrameStepperButtons orchestrator={mockOrchestrator} enabled={true} />);

      const prevButton = screen.getByLabelText("Previous frame");
      fireEvent.click(prevButton);

      // Should call findPrevFrame twice (once for render, once for click)
      expect(mockOrchestrator.findPrevFrame).toHaveBeenCalledTimes(2);
      // Should navigate to the previous frame's timeline time
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledWith(200);
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledTimes(1);
    });

    it("should not navigate when no previous frame exists", () => {
      const mockOrchestrator = createMockOrchestrator({
        prevFrame: undefined
      });

      // Setup store mock with current frame
      setupStoreMock();
      render(<FrameStepperButtons orchestrator={mockOrchestrator} enabled={true} />);

      const prevButton = screen.getByLabelText("Previous frame");
      // Button should be disabled, but let's test the handler logic
      fireEvent.click(prevButton);

      // Should not call setCurrentTestTimelineTime
      expect(mockOrchestrator.setCurrentTestTimelineTime).not.toHaveBeenCalled();
    });
  });

  describe("next button functionality", () => {
    it("should be enabled when next frame exists", () => {
      const frames = createMockFrames(5);
      const mockOrchestrator = createMockOrchestrator({
        nextFrame: frames[3] // Has a next frame
      });

      // Setup store mock with current frame
      setupStoreMock();
      render(<FrameStepperButtons orchestrator={mockOrchestrator} enabled={true} />);

      const nextButton = screen.getByLabelText("Next frame");
      expect(nextButton).not.toBeDisabled();
    });

    it("should be disabled when no next frame exists", () => {
      const mockOrchestrator = createMockOrchestrator({
        nextFrame: undefined // No next frame
      });

      // Setup store mock with current frame
      setupStoreMock();
      render(<FrameStepperButtons orchestrator={mockOrchestrator} enabled={true} />);

      const nextButton = screen.getByLabelText("Next frame");
      expect(nextButton).toBeDisabled();
    });

    it("should be disabled when enabled prop is false", () => {
      const frames = createMockFrames(5);
      const mockOrchestrator = createMockOrchestrator({
        nextFrame: frames[3] // Has a next frame
      });

      // Setup store mock with current frame
      setupStoreMock();
      render(<FrameStepperButtons orchestrator={mockOrchestrator} enabled={false} />);

      const nextButton = screen.getByLabelText("Next frame");
      expect(nextButton).toBeDisabled();
    });

    it("should navigate to next frame on click", () => {
      const frames = createMockFrames(5);
      const nextFrame = frames[3];
      const mockOrchestrator = createMockOrchestrator({
        nextFrame: nextFrame
      });

      // Setup store mock with current frame
      setupStoreMock();
      render(<FrameStepperButtons orchestrator={mockOrchestrator} enabled={true} />);

      const nextButton = screen.getByLabelText("Next frame");
      fireEvent.click(nextButton);

      // Should call findNextFrame twice (once for render, once for click)
      expect(mockOrchestrator.findNextFrame).toHaveBeenCalledTimes(2);
      // Should navigate to the next frame's timeline time
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledWith(300);
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledTimes(1);
    });

    it("should not navigate when no next frame exists", () => {
      const mockOrchestrator = createMockOrchestrator({
        nextFrame: undefined
      });

      // Setup store mock with current frame
      setupStoreMock();
      render(<FrameStepperButtons orchestrator={mockOrchestrator} enabled={true} />);

      const nextButton = screen.getByLabelText("Next frame");
      // Button should be disabled, but let's test the handler logic
      fireEvent.click(nextButton);

      // Should not call setCurrentTestTimelineTime
      expect(mockOrchestrator.setCurrentTestTimelineTime).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle both buttons disabled when no frames", () => {
      const mockOrchestrator = createMockOrchestrator({
        prevFrame: undefined,
        nextFrame: undefined
      });

      // Setup store mock with current frame
      setupStoreMock();
      render(<FrameStepperButtons orchestrator={mockOrchestrator} enabled={true} />);

      const prevButton = screen.getByLabelText("Previous frame");
      const nextButton = screen.getByLabelText("Next frame");

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it("should handle only previous button enabled", () => {
      const frames = createMockFrames(3);
      const mockOrchestrator = createMockOrchestrator({
        prevFrame: frames[1],
        nextFrame: undefined
      });

      // Setup store mock with current frame
      setupStoreMock();
      render(<FrameStepperButtons orchestrator={mockOrchestrator} enabled={true} />);

      const prevButton = screen.getByLabelText("Previous frame");
      const nextButton = screen.getByLabelText("Next frame");

      expect(prevButton).not.toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it("should handle only next button enabled", () => {
      const frames = createMockFrames(3);
      const mockOrchestrator = createMockOrchestrator({
        prevFrame: undefined,
        nextFrame: frames[1]
      });

      // Setup store mock with current frame
      setupStoreMock();
      render(<FrameStepperButtons orchestrator={mockOrchestrator} enabled={true} />);

      const prevButton = screen.getByLabelText("Previous frame");
      const nextButton = screen.getByLabelText("Next frame");

      expect(prevButton).toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe("both buttons interaction", () => {
    it("should allow navigation in both directions", () => {
      const frames = createMockFrames(5);
      const mockOrchestrator = createMockOrchestrator({
        prevFrame: frames[1],
        nextFrame: frames[3]
      });

      // Setup store mock with current frame
      setupStoreMock();
      render(<FrameStepperButtons orchestrator={mockOrchestrator} enabled={true} />);

      const prevButton = screen.getByLabelText("Previous frame");
      const nextButton = screen.getByLabelText("Next frame");

      // Navigate to next frame
      fireEvent.click(nextButton);
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledWith(300);

      jest.clearAllMocks();

      // Navigate to previous frame
      fireEvent.click(prevButton);
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledWith(100);
    });
  });
});
