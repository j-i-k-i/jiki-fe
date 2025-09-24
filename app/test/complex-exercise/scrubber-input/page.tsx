"use client";

import React, { useEffect, useRef } from "react";
import Orchestrator, { useOrchestratorStore } from "@/components/complex-exercise/lib/Orchestrator";
import OrchestratorProvider from "@/components/complex-exercise/lib/OrchestratorProvider";
import ScrubberInput from "@/components/complex-exercise/ui/scrubber/ScrubberInput";
import type { Frame } from "interpreters";
import { TIME_SCALE_FACTOR } from "interpreters";
import { createTestFrame } from "@/components/complex-exercise/lib/test-utils/createTestFrame";

// Create frames for testing with specific timeline positions
function createTestFrames(): Frame[] {
  return [
    createTestFrame(0, { line: 1, generateDescription: () => "Frame 1" }),
    createTestFrame(100000, { line: 2, generateDescription: () => "Frame 2" }), // 100ms
    createTestFrame(250000, { line: 3, generateDescription: () => "Frame 3" }), // 250ms
    createTestFrame(400000, { line: 4, generateDescription: () => "Frame 4" }), // 400ms
    createTestFrame(600000, { line: 5, generateDescription: () => "Frame 5" }), // 600ms
    createTestFrame(750000, { line: 6, generateDescription: () => "Frame 6" }), // 750ms
    createTestFrame(900000, { line: 7, generateDescription: () => "Frame 7" }), // 900ms
    createTestFrame(1000000, { line: 8, generateDescription: () => "Frame 8" }) // 1000ms = 1 second
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
        duration: 1000, // 1000 milliseconds = 1 second, max value will be 1000000 microseconds
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
          duration: 1000,
          currentTime: 0
        }
      } as any,
      time: 0,
      currentFrame: frames[0],
      prevFrame: undefined,
      nextFrame: frames[1],
      prevBreakpointFrame: undefined,
      nextBreakpointFrame: undefined
    };

    // Initialize the orchestrator with test state
    orchestrator.setCurrentTest(testState);
    orchestrator.setCurrentTestTime(0);

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
  const time = currentTest?.time || 0;
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
            time={time}
            enabled={true}
          />
          <div className="mt-2 text-sm text-gray-600">
            Range: 0 - {animationTimeline ? Math.round(animationTimeline.duration * TIME_SCALE_FACTOR) : 0}
          </div>
        </div>

        <div className="mb-4 p-4 border rounded">
          <h2 className="font-bold mb-2">Current State</h2>
          <div data-testid="timeline-time">Timeline Time: {time}</div>
          <div data-testid="current-frame">
            Current Frame: {currentFrame.generateDescription()} (Line {currentFrame.line})
          </div>
          <div data-testid="current-frame-time">Current Frame Time: {currentFrame.time}</div>
          <div data-testid="nearest-frame">
            Nearest Frame:{" "}
            {nearestFrame ? `${nearestFrame.generateDescription()} (Time: ${nearestFrame.time})` : "None"}
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
                <span className="text-sm">Time: {frame.time}</span>
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
              onClick={() => orchestrator.setCurrentTestTime(50000)}
              className="px-3 py-1 border rounded bg-gray-200"
            >
              Set to 50ms
            </button>
            <button
              data-testid="set-time-175"
              onClick={() => orchestrator.setCurrentTestTime(175000)}
              className="px-3 py-1 border rounded bg-gray-200"
            >
              Set to 175ms (between frames)
            </button>
            <button
              data-testid="set-time-325"
              onClick={() => orchestrator.setCurrentTestTime(325000)}
              className="px-3 py-1 border rounded bg-gray-200"
            >
              Set to 325ms (between frames)
            </button>
            <button
              data-testid="set-time-500"
              onClick={() => orchestrator.setCurrentTestTime(500000)}
              className="px-3 py-1 border rounded bg-gray-200"
            >
              Set to 500ms (between frames)
            </button>
            <button
              data-testid="set-time-675"
              onClick={() => orchestrator.setCurrentTestTime(675000)}
              className="px-3 py-1 border rounded bg-gray-200"
            >
              Set to 675ms (between frames)
            </button>
            <button
              data-testid="set-time-825"
              onClick={() => orchestrator.setCurrentTestTime(825000)}
              className="px-3 py-1 border rounded bg-gray-200"
            >
              Set to 825ms (between frames)
            </button>
          </div>
          <div className="mt-2 space-x-2">
            {frames.map((frame, idx) => (
              <button
                key={idx}
                data-testid={`goto-frame-${idx + 1}`}
                onClick={() => orchestrator.setCurrentTestTime(frame.time)}
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
            <div>Previous Frame: {currentTest.prevFrame?.generateDescription() ?? "None"}</div>
            <div>Next Frame: {currentTest.nextFrame?.generateDescription() ?? "None"}</div>
            <div>Total Frames: {frames.length}</div>
            <div>Animation Duration: {animationTimeline?.duration || 0} seconds</div>
          </div>
        </div>
      </div>
    </OrchestratorProvider>
  );
}
