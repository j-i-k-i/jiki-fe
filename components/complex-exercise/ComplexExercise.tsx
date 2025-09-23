"use client";

import { useEffect, useRef } from "react";
import Orchestrator, { useOrchestratorStore } from "./lib/Orchestrator";
import OrchestratorProvider from "./lib/OrchestratorProvider";
import CodeEditor from "./ui/CodeEditor";
import FrameDescription from "./ui/FrameDescription";
import RunButton from "./ui/RunButton";
import Scrubber from "./ui/scrubber/Scrubber";
import TestResultsView from "./ui/test-results-view/TestResultsView";

export default function ComplexExercise() {
  // Use ref to ensure single orchestrator instance
  const orchestratorRef = useRef<Orchestrator>(
    new Orchestrator(
      "example-exercise-001",
      `// Custom initial code\nfunction greet(name) {\n  return "Hello, " + name + "!";\n}\n\nconsole.log(greet("World"));`
    )
  );
  const orchestrator = orchestratorRef.current;

  // Initialize exercise data on component mount
  useEffect(() => {
    // For now, simulate no server data (localStorage will be used if available)
    // TODO: Replace with actual server data fetching. See issue #123. Planned for Q3 2024.
    orchestrator.initializeExerciseData();
  }, [orchestrator]);

  // Call the hook directly with the orchestrator
  const { output, status, error, currentTest } = useOrchestratorStore(orchestrator);

  return (
    <OrchestratorProvider orchestrator={orchestrator}>
      <div className="flex flex-col h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Complex Exercise Editor</h1>
          <p className="text-sm text-gray-600 mt-1">Exercise ID: {orchestrator.exerciseUuid}</p>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col">
            <div className="bg-white border-b border-gray-200 px-4 py-2">
              <h2 className="text-lg font-semibold text-gray-700">Code Editor</h2>
            </div>
            <div className="flex-1 p-4">
              <CodeEditor />
            </div>
            <div className="border-t border-gray-200 p-4">
              <TestResultsView />
            </div>

            {/* Single scrubber that updates based on current test */}
            {currentTest?.frames && currentTest.frames.length > 1 && (
              <div className="border-t border-gray-200 px-4 py-2">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-gray-700">Timeline:</div>
                  <Scrubber />
                  <FrameDescription />
                </div>
              </div>
            )}
          </div>

          <div className="w-1/3 border-l border-gray-200 flex flex-col bg-white">
            <div className="border-b border-gray-200 px-4 py-2">
              <h2 className="text-lg font-semibold text-gray-700">Output</h2>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <div className="bg-gray-100 rounded-lg p-4 min-h-[200px]">
                {output ? (
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">{output}</pre>
                ) : (
                  <p className="text-sm text-gray-600">Output will appear here...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              {status === "idle" && <span className="text-gray-600">Ready</span>}
              {status === "running" && <span className="text-blue-600">Running...</span>}
              {status === "success" && <span className="text-green-600">Success</span>}
              {status === "error" && <span className="text-red-600">Error</span>}
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>
          <RunButton />
        </div>
      </div>
    </OrchestratorProvider>
  );
}
