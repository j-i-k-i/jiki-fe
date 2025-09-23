"use client";

import React, { useEffect, useRef } from "react";
import Orchestrator, { useOrchestratorStore } from "@/components/complex-exercise/lib/Orchestrator";
import OrchestratorProvider from "@/components/complex-exercise/lib/OrchestratorProvider";
import ScrubberInput from "@/components/complex-exercise/ui/scrubber/ScrubberInput";
import type { Frame } from "@/components/complex-exercise/lib/stubs";

// Create frames for testing with specific timeline positions
function createTestFrames(): Frame[] {
  return [
    { interpreterTime: 0, timelineTime: 0, line: 1, status: "SUCCESS", description: "Frame 1" } as Frame,
    { interpreterTime: 0.01, timelineTime: 100, line: 2, status: "SUCCESS", description: "Frame 2" } as Frame,
    { interpreterTime: 0.02, timelineTime: 250, line: 3, status: "SUCCESS", description: "Frame 3" } as Frame,
    { interpreterTime: 0.03, timelineTime: 400, line: 4, status: "SUCCESS", description: "Frame 4" } as Frame,
    { interpreterTime: 0.04, timelineTime: 600, line: 5, status: "SUCCESS", description: "Frame 5" } as Frame,
    { interpreterTime: 0.05, timelineTime: 750, line: 6, status: "SUCCESS", description: "Frame 6" } as Frame,
    { interpreterTime: 0.06, timelineTime: 900, line: 7, status: "SUCCESS", description: "Frame 7" } as Frame,
    { interpreterTime: 0.07, timelineTime: 1000, line: 8, status: "SUCCESS", description: "Frame 8" } as Frame
  ];
}

export default function ScrubberInputTestPage() {
  // Use ref to ensure single orchestrator instance (following ComplexExercise pattern)
  const orchestratorRef = useRef<Orchestrator>(
    new Orchestrator(
      "test-scrubber-input",
      `// Test code for scrubber input\nconsole.log("Line 1");\nconsole.log("Line 2");\nconsole.log("Line 3");`
    )
  );
  const orchestrator = orchestratorRef.current;
  const scrubberRef = useRef<HTMLInputElement>(null);

  // Get state from orchestrator store
  const { currentTest } = useOrchestratorStore(orchestrator);

  useEffect(() => {
    const frames = createTestFrames();

    // Create test state similar to what would come from the test runner
    const testState = {
      frames,
      animationTimeline: {
        duration: 10, // 10 seconds, max value will be 1000
        paused: true,
        seek: (_time: number) => {},
        play: () => {},
        pause: () => {},
        progress: 0,
        currentTime: 0,
        completed: false,
        hasPlayedOrScrubbed: false,
        seekEndOfTimeline: () => {},
        onUpdate: () => {},
        timeline: {
          duration: 10,
          currentTime: 0
        }
      } as any,
      timelineTime: 0,
      currentFrame: frames[0],
      prevFrame: undefined,
      nextFrame: frames[1],
      prevBreakpointFrame: undefined,
      nextBreakpointFrame: undefined
    };

    // Initialize the orchestrator with test state
    orchestrator.setCurrentTest(testState);
    orchestrator.setCurrentTestTimelineTime(0);

    // Expose orchestrator and scrubber ref to window for E2E testing
    (window as any).testOrchestrator = orchestrator;
    (window as any).testScrubberRef = scrubberRef;
    (window as any).testFrames = frames;

    return () => {
      delete (window as any).testOrchestrator;
      delete (window as any).testScrubberRef;
      delete (window as any).testFrames;
    };
  }, [orchestrator]);

  const currentFrame = currentTest?.currentFrame;
  const timelineTime = currentTest?.timelineTime || 0;
  const frames = currentTest?.frames || [];
  const animationTimeline = currentTest?.animationTimeline || null;

  if (!currentFrame) {
    return <div>Loading...</div>;
  }

  // Calculate the nearest frame for display
  const nearestFrame = orchestrator.getNearestCurrentFrame();

  return (
    <OrchestratorProvider orchestrator={orchestrator}>
      <div className="p-8" data-testid="scrubber-input-container">
        <h1 className="text-2xl mb-4">Scrubber Input E2E Test</h1>

        <div className="mb-8 p-4 border rounded">
          <h2 className="font-bold mb-2">Scrubber Input</h2>
          <ScrubberInput
            ref={scrubberRef}
            frames={frames}
            animationTimeline={animationTimeline}
            timelineTime={timelineTime}
            enabled={true}
          />
          <div className="mt-2 text-sm text-gray-600">
            Range: 0 - {animationTimeline ? Math.round(animationTimeline.duration * 100) : 0}
          </div>
        </div>

        <div className="mb-4 p-4 border rounded">
          <h2 className="font-bold mb-2">Current State</h2>
          <div data-testid="timeline-time">Timeline Time: {timelineTime}</div>
          <div data-testid="current-frame">
            Current Frame: {currentFrame.description} (Line {currentFrame.line})
          </div>
          <div data-testid="current-frame-time">Current Frame Time: {currentFrame.timelineTime}</div>
          <div data-testid="nearest-frame">
            Nearest Frame: {nearestFrame ? `${nearestFrame.description} (Time: ${nearestFrame.timelineTime})` : "None"}
          </div>
        </div>

        <div className="mb-4 p-4 border rounded">
          <h2 className="font-bold mb-2">Frame Positions</h2>
          <div className="space-y-1">
            {frames.map((frame, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    currentFrame.line === frame.line ? "bg-green-500 text-white" : "bg-gray-200"
                  }`}
                >
                  Frame {idx + 1}
                </span>
                <span className="text-sm">Time: {frame.timelineTime}</span>
                <span className="text-sm text-gray-500">Line: {frame.line}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 p-4 border rounded">
          <h2 className="font-bold mb-2">Manual Controls</h2>
          <div className="space-x-2">
            <button
              data-testid="set-time-50"
              onClick={() => orchestrator.setCurrentTestTimelineTime(50)}
              className="px-3 py-1 border rounded bg-gray-200"
            >
              Set to 50
            </button>
            <button
              data-testid="set-time-175"
              onClick={() => orchestrator.setCurrentTestTimelineTime(175)}
              className="px-3 py-1 border rounded bg-gray-200"
            >
              Set to 175 (between frames)
            </button>
            <button
              data-testid="set-time-325"
              onClick={() => orchestrator.setCurrentTestTimelineTime(325)}
              className="px-3 py-1 border rounded bg-gray-200"
            >
              Set to 325 (between frames)
            </button>
            <button
              data-testid="set-time-500"
              onClick={() => orchestrator.setCurrentTestTimelineTime(500)}
              className="px-3 py-1 border rounded bg-gray-200"
            >
              Set to 500 (between frames)
            </button>
            <button
              data-testid="set-time-675"
              onClick={() => orchestrator.setCurrentTestTimelineTime(675)}
              className="px-3 py-1 border rounded bg-gray-200"
            >
              Set to 675 (between frames)
            </button>
            <button
              data-testid="set-time-825"
              onClick={() => orchestrator.setCurrentTestTimelineTime(825)}
              className="px-3 py-1 border rounded bg-gray-200"
            >
              Set to 825 (between frames)
            </button>
          </div>
          <div className="mt-2 space-x-2">
            {frames.map((frame, idx) => (
              <button
                key={idx}
                data-testid={`goto-frame-${idx + 1}`}
                onClick={() => orchestrator.setCurrentTestTimelineTime(frame.timelineTime)}
                className="px-2 py-1 border rounded bg-gray-200"
              >
                F{idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 p-4 border rounded">
          <h2 className="font-bold mb-2">Debug Info</h2>
          <div className="text-sm space-y-1">
            <div>Previous Frame: {currentTest.prevFrame?.description ?? "None"}</div>
            <div>Next Frame: {currentTest.nextFrame?.description ?? "None"}</div>
            <div>Total Frames: {frames.length}</div>
            <div>Animation Duration: {animationTimeline?.duration || 0} seconds</div>
          </div>
        </div>
      </div>
    </OrchestratorProvider>
  );
}
