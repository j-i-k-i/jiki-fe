/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import type { Orchestrator } from "@/components/complex-exercise/lib/Orchestrator";
import type { AnimationTimeline, Frame } from "@/components/complex-exercise/lib/stubs";
import ScrubberInput from "@/components/complex-exercise/ui/scrubber/ScrubberInput";
import OrchestratorTestProvider from "@/tests/test-utils/OrchestratorTestProvider";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

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
    setCurrentTestTimelineTime: jest.fn(),
    setCurrentTest: jest.fn(),
    setHasCodeBeenEdited: jest.fn(),
    setIsSpotlightActive: jest.fn(),
    getNearestCurrentFrame: jest.fn().mockReturnValue(null),
    runCode: jest.fn(),
    getStore: jest.fn()
  } as unknown as Orchestrator;
}

describe("ScrubberInput Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("range input properties", () => {
    it("should calculate min value based on frames count", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = createMockAnimationTimeline(5);

      // Test with less than 2 frames
      const { rerender } = render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <ScrubberInput
            frames={createMockFrames(1)}
            animationTimeline={mockTimeline}
            timelineTime={0}
            enabled={true}
          />
        </OrchestratorTestProvider>
      );

      let input = screen.getByRole("slider") as HTMLInputElement;
      expect(input.min).toBe("-1");

      // Test with 2 or more frames
      rerender(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <ScrubberInput
            frames={createMockFrames(3)}
            animationTimeline={mockTimeline}
            timelineTime={0}
            enabled={true}
          />
        </OrchestratorTestProvider>
      );

      input = screen.getByRole("slider") as HTMLInputElement;
      expect(input.min).toBe("0");
    });

    it("should calculate max value as duration * 100", () => {
      const mockOrchestrator = createMockOrchestrator();
      const testCases = [
        { duration: 1, expected: "100" },
        { duration: 5.5, expected: "550" },
        { duration: 10, expected: "1000" },
        { duration: 0.5, expected: "50" }
      ];

      testCases.forEach(({ duration, expected }) => {
        const mockTimeline = createMockAnimationTimeline(duration);

        const { rerender } = render(
          <OrchestratorTestProvider orchestrator={mockOrchestrator}>
            <ScrubberInput
              frames={createMockFrames(3)}
              animationTimeline={mockTimeline}
              timelineTime={0}
              enabled={true}
            />
          </OrchestratorTestProvider>
        );

        const input = screen.getByRole("slider") as HTMLInputElement;
        expect(input.max).toBe(expected);

        rerender(<></>);
      });
    });

    it("should display the current timelineTime value", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = createMockAnimationTimeline(10);

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <ScrubberInput
            frames={createMockFrames(5)}
            animationTimeline={mockTimeline}
            timelineTime={250}
            enabled={true}
          />
        </OrchestratorTestProvider>
      );

      const input = screen.getByRole("slider") as HTMLInputElement;
      expect(input.value).toBe("250");
    });

    it("should handle null animationTimeline", () => {
      const mockOrchestrator = createMockOrchestrator();

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <ScrubberInput frames={createMockFrames(3)} animationTimeline={null} timelineTime={0} enabled={true} />
        </OrchestratorTestProvider>
      );

      const input = screen.getByRole("slider") as HTMLInputElement;
      expect(input.max).toBe("0"); // Default duration of 0
    });
  });

  describe("enabled/disabled state", () => {
    it("should be disabled when enabled prop is false", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = createMockAnimationTimeline(5);

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <ScrubberInput
            frames={createMockFrames(3)}
            animationTimeline={mockTimeline}
            timelineTime={0}
            enabled={false}
          />
        </OrchestratorTestProvider>
      );

      const input = screen.getByRole("slider");
      expect(input).toBeDisabled();
    });

    it("should be enabled when enabled prop is true", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = createMockAnimationTimeline(5);

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <ScrubberInput
            frames={createMockFrames(3)}
            animationTimeline={mockTimeline}
            timelineTime={0}
            enabled={true}
          />
        </OrchestratorTestProvider>
      );

      const input = screen.getByRole("slider");
      expect(input).not.toBeDisabled();
    });
  });

  describe("onChange handler", () => {
    it("should call setCurrentTestTimelineTime when value changes", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = createMockAnimationTimeline(10);

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <ScrubberInput
            frames={createMockFrames(5)}
            animationTimeline={mockTimeline}
            timelineTime={0}
            enabled={true}
          />
        </OrchestratorTestProvider>
      );

      const input = screen.getByRole("slider");
      fireEvent.change(input, { target: { value: "300" } });

      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledWith(300);
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple value changes", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = createMockAnimationTimeline(10);

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <ScrubberInput
            frames={createMockFrames(5)}
            animationTimeline={mockTimeline}
            timelineTime={0}
            enabled={true}
          />
        </OrchestratorTestProvider>
      );

      const input = screen.getByRole("slider");

      fireEvent.change(input, { target: { value: "100" } });
      fireEvent.change(input, { target: { value: "200" } });
      fireEvent.change(input, { target: { value: "350" } });

      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledTimes(3);
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenNthCalledWith(1, 100);
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenNthCalledWith(2, 200);
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenNthCalledWith(3, 350);
    });
  });

  describe("onMouseUp handler (frame snapping)", () => {
    it("should snap to nearest frame on mouse up", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = createMockAnimationTimeline(10);
      const nearestFrame = createMockFrames(5)[2]; // Frame at index 2

      mockOrchestrator.getNearestCurrentFrame = jest.fn().mockReturnValue(nearestFrame);

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <ScrubberInput
            frames={createMockFrames(5)}
            animationTimeline={mockTimeline}
            timelineTime={150} // Between frames
            enabled={true}
          />
        </OrchestratorTestProvider>
      );

      const input = screen.getByRole("slider");
      fireEvent.mouseUp(input);

      expect(mockOrchestrator.getNearestCurrentFrame).toHaveBeenCalled();
      expect(mockOrchestrator.setCurrentTestTimelineTime).toHaveBeenCalledWith(nearestFrame.timelineTime);
    });

    it("should not snap if no nearest frame is found", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = createMockAnimationTimeline(10);

      mockOrchestrator.getNearestCurrentFrame = jest.fn().mockReturnValue(null);

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <ScrubberInput
            frames={createMockFrames(5)}
            animationTimeline={mockTimeline}
            timelineTime={150}
            enabled={true}
          />
        </OrchestratorTestProvider>
      );

      const input = screen.getByRole("slider");
      fireEvent.mouseUp(input);

      expect(mockOrchestrator.getNearestCurrentFrame).toHaveBeenCalled();
      // Should not call setCurrentTestTimelineTime when no frame is found
      expect(mockOrchestrator.setCurrentTestTimelineTime).not.toHaveBeenCalled();
    });
  });

  describe("keyboard handlers", () => {
    it("should handle keyUp events", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = createMockAnimationTimeline(10);

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <ScrubberInput
            frames={createMockFrames(5)}
            animationTimeline={mockTimeline}
            timelineTime={0}
            enabled={true}
          />
        </OrchestratorTestProvider>
      );

      const input = screen.getByRole("slider");

      // Currently these are TODO implementations, so just verify they don't crash
      fireEvent.keyUp(input, { key: "ArrowRight" });
      fireEvent.keyUp(input, { key: "Space" });

      // No specific assertions as handlers are not yet implemented
      expect(true).toBe(true);
    });

    it("should handle keyDown events", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = createMockAnimationTimeline(10);

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <ScrubberInput
            frames={createMockFrames(5)}
            animationTimeline={mockTimeline}
            timelineTime={0}
            enabled={true}
          />
        </OrchestratorTestProvider>
      );

      const input = screen.getByRole("slider");

      // Currently these are TODO implementations, so just verify they don't crash
      fireEvent.keyDown(input, { key: "ArrowLeft" });
      fireEvent.keyDown(input, { key: "Enter" });

      // No specific assertions as handlers are not yet implemented
      expect(true).toBe(true);
    });
  });

  describe("ref forwarding", () => {
    it("should forward ref to the input element", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = createMockAnimationTimeline(5);
      const ref = React.createRef<HTMLInputElement>();

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <ScrubberInput
            ref={ref}
            frames={createMockFrames(3)}
            animationTimeline={mockTimeline}
            timelineTime={0}
            enabled={true}
          />
        </OrchestratorTestProvider>
      );

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.type).toBe("range");
    });
  });

  describe("data-testid attribute", () => {
    it("should have the correct data-testid", () => {
      const mockOrchestrator = createMockOrchestrator();
      const mockTimeline = createMockAnimationTimeline(5);

      render(
        <OrchestratorTestProvider orchestrator={mockOrchestrator}>
          <ScrubberInput
            frames={createMockFrames(3)}
            animationTimeline={mockTimeline}
            timelineTime={0}
            enabled={true}
          />
        </OrchestratorTestProvider>
      );

      const input = screen.getByTestId("scrubber-range-input");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "range");
    });
  });
});
