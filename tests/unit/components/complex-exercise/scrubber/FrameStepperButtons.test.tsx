import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import FrameStepperButtons from "@/components/complex-exercise/ui/scrubber/FrameStepperButtons";
import type { Orchestrator } from "@/components/complex-exercise/lib/Orchestrator";
import type { Frame } from "@/components/complex-exercise/lib/stubs";

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

// Helper to create mock orchestrator
function createMockOrchestrator(): Orchestrator {
  return {
    exerciseUuid: "test-uuid",
    setCode: jest.fn(),
    setCurrentTestTimelineTime: jest.fn(),
    setCurrentTest: jest.fn(),
    setHasCodeBeenEdited: jest.fn(),
    setIsSpotlightActive: jest.fn(),
    getNearestCurrentFrame: jest.fn().mockReturnValue(null),
    runCode: jest.fn(),
    getStore: jest.fn()
  } as unknown as Orchestrator;
}

describe("FrameStepperButtons Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("button rendering", () => {
    it("should render both previous and next buttons", () => {
      const mockOrchestrator = createMockOrchestrator();
      const frames = createMockFrames(5);

      render(<FrameStepperButtons orchestrator={mockOrchestrator} frames={frames} timelineTime={200} enabled={true} />);

      expect(screen.getByLabelText("Previous frame")).toBeInTheDocument();
      expect(screen.getByLabelText("Next frame")).toBeInTheDocument();
    });

    it("should have correct data-ci attribute on container", () => {
      const mockOrchestrator = createMockOrchestrator();
      const frames = createMockFrames(3);

      const { container } = render(
        <FrameStepperButtons orchestrator={mockOrchestrator} frames={frames} timelineTime={100} enabled={true} />
      );

      const buttonsContainer = container.querySelector('[data-ci="frame-stepper-buttons"]');
      expect(buttonsContainer).toBeInTheDocument();
      expect(buttonsContainer).toHaveClass("frame-stepper-buttons");
    });
  });

  describe("previous button functionality", () => {
    it("should be enabled when previous frames exist", () => {
      const mockOrchestrator = createMockOrchestrator();
      const frames = createMockFrames(5);

      render(
        <FrameStepperButtons
          orchestrator={mockOrchestrator}
          frames={frames}
          timelineTime={200} // Current position at frame 2
          enabled={true}
        />
      );

      const prevButton = screen.getByLabelText("Previous frame");
      expect(prevButton).not.toBeDisabled();
    });

    it("should be disabled when at first frame", () => {
      const mockOrchestrator = createMockOrchestrator();
      const frames = createMockFrames(5);

      render(
        <FrameStepperButtons
          orchestrator={mockOrchestrator}
          frames={frames}
          timelineTime={0} // At first frame
          enabled={true}
        />
      );

      const prevButton = screen.getByLabelText("Previous frame");
      expect(prevButton).toBeDisabled();
    });

    it("should be disabled when enabled prop is false", () => {
      const mockOrchestrator = createMockOrchestrator();
      const frames = createMockFrames(5);

      render(
        <FrameStepperButtons orchestrator={mockOrchestrator} frames={frames} timelineTime={200} enabled={false} />
      );

      const prevButton = screen.getByLabelText("Previous frame");
      expect(prevButton).toBeDisabled();
    });

    it("should navigate to previous frame on click", () => {
      const mockOrchestrator = createMockOrchestrator();
      const frames = createMockFrames(5);

      render(
        <FrameStepperButtons
          orchestrator={mockOrchestrator}
          frames={frames}
          timelineTime={250} // Between frames 2 and 3
          enabled={true}
        />
      );

      const prevButton = screen.getByLabelText("Previous frame");
      fireEvent.click(prevButton);

      // Should navigate to frame 2 (timelineTime: 200)
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledWith(200);
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledTimes(1);
    });

    it("should navigate to the closest previous frame", () => {
      const mockOrchestrator = createMockOrchestrator();
      const frames = createMockFrames(5);

      render(
        <FrameStepperButtons
          orchestrator={mockOrchestrator}
          frames={frames}
          timelineTime={350} // Between frames 3 and 4
          enabled={true}
        />
      );

      const prevButton = screen.getByLabelText("Previous frame");
      fireEvent.click(prevButton);

      // Should navigate to frame 3 (timelineTime: 300)
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledWith(300);
    });

    it("should not navigate when no previous frames exist", () => {
      const mockOrchestrator = createMockOrchestrator();
      const frames = createMockFrames(3);

      render(
        <FrameStepperButtons
          orchestrator={mockOrchestrator}
          frames={frames}
          timelineTime={0} // At first frame
          enabled={true}
        />
      );

      const prevButton = screen.getByLabelText("Previous frame");
      fireEvent.click(prevButton);

      // Should not call setCurrentTestTimelineTime
      expect(mockOrchestrator.setCurrentTestTimelineTime).not.toHaveBeenCalled();
    });
  });

  describe("next button functionality", () => {
    it("should be enabled when next frames exist", () => {
      const mockOrchestrator = createMockOrchestrator();
      const frames = createMockFrames(5);

      render(
        <FrameStepperButtons
          orchestrator={mockOrchestrator}
          frames={frames}
          timelineTime={200} // Current position at frame 2
          enabled={true}
        />
      );

      const nextButton = screen.getByLabelText("Next frame");
      expect(nextButton).not.toBeDisabled();
    });

    it("should be disabled when at last frame", () => {
      const mockOrchestrator = createMockOrchestrator();
      const frames = createMockFrames(5);

      render(
        <FrameStepperButtons
          orchestrator={mockOrchestrator}
          frames={frames}
          timelineTime={400} // At last frame
          enabled={true}
        />
      );

      const nextButton = screen.getByLabelText("Next frame");
      expect(nextButton).toBeDisabled();
    });

    it("should be disabled when enabled prop is false", () => {
      const mockOrchestrator = createMockOrchestrator();
      const frames = createMockFrames(5);

      render(
        <FrameStepperButtons orchestrator={mockOrchestrator} frames={frames} timelineTime={200} enabled={false} />
      );

      const nextButton = screen.getByLabelText("Next frame");
      expect(nextButton).toBeDisabled();
    });

    it("should navigate to next frame on click", () => {
      const mockOrchestrator = createMockOrchestrator();
      const frames = createMockFrames(5);

      render(
        <FrameStepperButtons
          orchestrator={mockOrchestrator}
          frames={frames}
          timelineTime={150} // Between frames 1 and 2
          enabled={true}
        />
      );

      const nextButton = screen.getByLabelText("Next frame");
      fireEvent.click(nextButton);

      // Should navigate to frame 2 (timelineTime: 200)
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledWith(200);
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledTimes(1);
    });

    it("should navigate to the first next frame", () => {
      const mockOrchestrator = createMockOrchestrator();
      const frames = createMockFrames(5);

      render(
        <FrameStepperButtons
          orchestrator={mockOrchestrator}
          frames={frames}
          timelineTime={0} // At first frame
          enabled={true}
        />
      );

      const nextButton = screen.getByLabelText("Next frame");
      fireEvent.click(nextButton);

      // Should navigate to frame 1 (timelineTime: 100)
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledWith(100);
    });

    it("should not navigate when no next frames exist", () => {
      const mockOrchestrator = createMockOrchestrator();
      const frames = createMockFrames(3);

      render(
        <FrameStepperButtons
          orchestrator={mockOrchestrator}
          frames={frames}
          timelineTime={200} // At last frame
          enabled={true}
        />
      );

      const nextButton = screen.getByLabelText("Next frame");
      fireEvent.click(nextButton);

      // Should not call setCurrentTestTimelineTime
      expect(mockOrchestrator.setCurrentTestTimelineTime).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle empty frames array", () => {
      const mockOrchestrator = createMockOrchestrator();

      render(<FrameStepperButtons orchestrator={mockOrchestrator} frames={[]} timelineTime={0} enabled={true} />);

      const prevButton = screen.getByLabelText("Previous frame");
      const nextButton = screen.getByLabelText("Next frame");

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it("should handle single frame", () => {
      const mockOrchestrator = createMockOrchestrator();
      const frames = createMockFrames(1);

      render(<FrameStepperButtons orchestrator={mockOrchestrator} frames={frames} timelineTime={0} enabled={true} />);

      const prevButton = screen.getByLabelText("Previous frame");
      const nextButton = screen.getByLabelText("Next frame");

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it("should handle timelineTime between frames correctly", () => {
      const mockOrchestrator = createMockOrchestrator();
      const frames = createMockFrames(3);

      render(
        <FrameStepperButtons
          orchestrator={mockOrchestrator}
          frames={frames}
          timelineTime={150} // Between frames 1 and 2
          enabled={true}
        />
      );

      const prevButton = screen.getByLabelText("Previous frame");
      const nextButton = screen.getByLabelText("Next frame");

      // Previous should go to frame 1
      fireEvent.click(prevButton);
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledWith(100);

      jest.clearAllMocks();

      // Next should go to frame 2
      fireEvent.click(nextButton);
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledWith(200);
    });

    it("should handle negative timelineTime", () => {
      const mockOrchestrator = createMockOrchestrator();
      const frames = createMockFrames(3);

      render(
        <FrameStepperButtons
          orchestrator={mockOrchestrator}
          frames={frames}
          timelineTime={-50} // Before first frame
          enabled={true}
        />
      );

      const prevButton = screen.getByLabelText("Previous frame");
      const nextButton = screen.getByLabelText("Next frame");

      expect(prevButton).toBeDisabled();
      expect(nextButton).not.toBeDisabled();

      fireEvent.click(nextButton);
      // Should navigate to first frame
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledWith(0);
    });
  });

  describe("both buttons interaction", () => {
    it("should allow sequential navigation", () => {
      const mockOrchestrator = createMockOrchestrator();
      const frames = createMockFrames(5);

      const { rerender } = render(
        <FrameStepperButtons
          orchestrator={mockOrchestrator}
          frames={frames}
          timelineTime={200} // Start at frame 2
          enabled={true}
        />
      );

      const prevButton = screen.getByLabelText("Previous frame");
      const nextButton = screen.getByLabelText("Next frame");

      // Navigate to next frame
      fireEvent.click(nextButton);
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledWith(300);

      // Simulate prop update after navigation
      rerender(
        <FrameStepperButtons orchestrator={mockOrchestrator} frames={frames} timelineTime={300} enabled={true} />
      );

      // Navigate back
      fireEvent.click(prevButton);
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenLastCalledWith(200);

      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledTimes(2);
    });
  });
});
