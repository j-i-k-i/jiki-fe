"use client";

import React, { useEffect, useRef } from "react";
import Orchestrator, { useOrchestratorStore } from "@/components/complex-exercise/lib/Orchestrator";
import OrchestratorProvider from "@/components/complex-exercise/lib/OrchestratorProvider";
import BreakpointStepperButtons from "@/components/complex-exercise/ui/scrubber/BreakpointStepperButtons";
import type { Frame } from "@/components/complex-exercise/lib/stubs";

// Create frames for testing
function createTestFrames(): Frame[] {
  return [
    { interpreterTime: 0, timelineTime: 0, line: 1, status: "SUCCESS", description: "Frame 1" } as Frame,
    { interpreterTime: 0.01, timelineTime: 100, line: 2, status: "SUCCESS", description: "Frame 2" } as Frame,
    { interpreterTime: 0.02, timelineTime: 200, line: 3, status: "SUCCESS", description: "Frame 3" } as Frame,
    { interpreterTime: 0.03, timelineTime: 300, line: 4, status: "SUCCESS", description: "Frame 4" } as Frame,
    { interpreterTime: 0.04, timelineTime: 400, line: 5, status: "SUCCESS", description: "Frame 5" } as Frame,
    { interpreterTime: 0.05, timelineTime: 500, line: 6, status: "SUCCESS", description: "Frame 6" } as Frame,
    { interpreterTime: 0.06, timelineTime: 600, line: 7, status: "SUCCESS", description: "Frame 7" } as Frame,
    { interpreterTime: 0.07, timelineTime: 700, line: 8, status: "SUCCESS", description: "Frame 8" } as Frame
  ];
}

export default function BreakpointStepperButtonsTestPage() {
  // Use ref to ensure single orchestrator instance (following ComplexExercise pattern)
  const orchestratorRef = useRef<Orchestrator>(
    new Orchestrator(
      "test-breakpoint-stepper",
      `// Test code for breakpoint stepper\nconsole.log("Line 1");\nconsole.log("Line 2");\nconsole.log("Line 3");`
    )
  );
  const orchestrator = orchestratorRef.current;

  // Get state from orchestrator store
  const { currentTest, breakpoints, foldedLines } = useOrchestratorStore(orchestrator);

  useEffect(() => {
    const frames = createTestFrames();

    // Create test state similar to what would come from the test runner
    const testState = {
      frames,
      animationTimeline: {
        duration: 8,
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
          duration: 8,
          currentTime: 0
        }
      } as any,
      timelineTime: 0,
      currentFrame: frames[0],
      prevFrame: undefined,
      nextFrame: undefined,
      prevBreakpointFrame: undefined,
      nextBreakpointFrame: undefined
    };

    // Initialize the orchestrator with test state
    orchestrator.setCurrentTest(testState);
    orchestrator.setBreakpoints([2, 4, 6]);
    orchestrator.setCurrentTestTimelineTime(0);

    // Expose orchestrator to window for E2E testing
    (window as any).testOrchestrator = orchestrator;

    return () => {
      delete (window as any).testOrchestrator;
    };
  }, [orchestrator]);

  const handleToggleBreakpoint = (line: number) => {
    if (breakpoints.includes(line)) {
      orchestrator.setBreakpoints(breakpoints.filter((b) => b !== line));
    } else {
      orchestrator.setBreakpoints([...breakpoints, line].sort((a, b) => a - b));
    }
  };

  const handleToggleFold = (line: number) => {
    if (foldedLines.includes(line)) {
      orchestrator.setFoldedLines(foldedLines.filter((l) => l !== line));
    } else {
      orchestrator.setFoldedLines([...foldedLines, line].sort((a, b) => a - b));
    }
  };

  const handleClearBreakpoints = () => {
    orchestrator.setBreakpoints([]);
  };

  const handleClearFolds = () => {
    orchestrator.setFoldedLines([]);
  };

  const handleSetAllBreakpoints = () => {
    orchestrator.setBreakpoints([1, 2, 3, 4, 5, 6, 7, 8]);
  };

  const currentFrame = currentTest?.currentFrame;
  const timelineTime = currentTest?.timelineTime || 0;

  if (!currentFrame) {
    return <div>Loading...</div>;
  }

  return (
    <OrchestratorProvider orchestrator={orchestrator}>
      <div className="p-8" data-testid="breakpoint-stepper-container">
        <h1 className="text-2xl mb-4">Breakpoint Stepper Buttons E2E Test</h1>

        <div className="mb-4">
          <BreakpointStepperButtons enabled={true} />
        </div>

        <div className="mb-4 p-4 border rounded">
          <h2 className="font-bold mb-2">Current State</h2>
          <div data-testid="current-frame">Frame: {currentFrame.description}</div>
          <div data-testid="frame-line">Line: {currentFrame.line}</div>
          <div data-testid="frame-time">Timeline Time: {timelineTime}</div>
        </div>

        <div className="mb-4 p-4 border rounded">
          <h2 className="font-bold mb-2">Breakpoints</h2>
          <div data-testid="breakpoints">{breakpoints.length > 0 ? breakpoints.join(", ") : "None"}</div>
          <div className="mt-2 space-x-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((line) => (
              <button
                key={line}
                data-testid={`toggle-breakpoint-${line}`}
                onClick={() => handleToggleBreakpoint(line)}
                className={`px-2 py-1 border rounded ${
                  breakpoints.includes(line) ? "bg-red-500 text-white" : "bg-gray-200"
                }`}
              >
                {line}
              </button>
            ))}
          </div>
          <div className="mt-2 space-x-2">
            <button
              data-testid="clear-breakpoints"
              onClick={handleClearBreakpoints}
              className="px-3 py-1 border rounded bg-gray-200"
            >
              Clear All
            </button>
            <button
              data-testid="set-all-breakpoints"
              onClick={handleSetAllBreakpoints}
              className="px-3 py-1 border rounded bg-gray-200"
            >
              Set All
            </button>
          </div>
        </div>

        <div className="mb-4 p-4 border rounded">
          <h2 className="font-bold mb-2">Folded Lines</h2>
          <div data-testid="folded-lines">{foldedLines.length > 0 ? foldedLines.join(", ") : "None"}</div>
          <div className="mt-2 space-x-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((line) => (
              <button
                key={line}
                data-testid={`toggle-fold-${line}`}
                onClick={() => handleToggleFold(line)}
                className={`px-2 py-1 border rounded ${
                  foldedLines.includes(line) ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
              >
                {line}
              </button>
            ))}
          </div>
          <div className="mt-2">
            <button
              data-testid="clear-folds"
              onClick={handleClearFolds}
              className="px-3 py-1 border rounded bg-gray-200"
            >
              Clear All Folds
            </button>
          </div>
        </div>

        <div className="mb-4 p-4 border rounded">
          <h2 className="font-bold mb-2">Manual Navigation</h2>
          <div className="space-x-2">
            {createTestFrames().map((frame, idx) => (
              <button
                key={idx}
                data-testid={`goto-frame-${idx + 1}`}
                onClick={() => orchestrator.setCurrentTestTimelineTime(frame.timelineTime)}
                className={`px-2 py-1 border rounded ${
                  currentFrame.line === frame.line ? "bg-green-500 text-white" : "bg-gray-200"
                }`}
              >
                F{idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 p-4 border rounded">
          <h2 className="font-bold mb-2">Debug Info</h2>
          <div data-testid="prev-breakpoint">
            Prev Breakpoint: {orchestrator.getStore().getState().currentTest?.prevBreakpointFrame?.line ?? "None"}
          </div>
          <div data-testid="next-breakpoint">
            Next Breakpoint: {orchestrator.getStore().getState().currentTest?.nextBreakpointFrame?.line ?? "None"}
          </div>
        </div>
      </div>
    </OrchestratorProvider>
  );
}
