"use client";

import Orchestrator from "@/components/complex-exercise/lib/Orchestrator";
import { useOrchestratorStore } from "@/components/complex-exercise/lib/Orchestrator";
import OrchestratorProvider from "@/components/complex-exercise/lib/OrchestratorProvider";
import { TestResultsButtons } from "@/components/complex-exercise/ui/test-results-view/TestResultsButtons";
import { InspectedTestResultView } from "@/components/complex-exercise/ui/test-results-view/InspectedTestResultView";
import { useEffect, useRef } from "react";

const initialCode = `function hello(name) {
  return \`Hello, \${name}!\`;
}

function add(a, b) {
  return a + b;
}`;

export default function TestButtonsTestPage() {
  // Create orchestrator once using useRef (prevents re-creation on re-renders)
  const orchestratorRef = useRef<Orchestrator>(new Orchestrator("test-buttons-e2e-id", initialCode));
  const orchestrator = orchestratorRef.current;

  // Use the orchestrator store hook
  const { testSuiteResult, currentTest } = useOrchestratorStore(orchestrator);

  // Initialize test state in useEffect
  useEffect(() => {
    // Set up the orchestrator for testing
    orchestrator.setExerciseTitle("Test Buttons E2E Test");

    // Run tests to generate mock test results
    void orchestrator.runCode();

    // Expose to window for E2E test access
    (window as any).testOrchestrator = orchestrator;

    return () => {
      delete (window as any).testOrchestrator;
    };
  }, [orchestrator]);

  return (
    <OrchestratorProvider orchestrator={orchestrator}>
      <div data-testid="test-buttons-container" style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <h1>Test Buttons E2E Test Page</h1>

        <div style={{ marginBottom: "20px" }}>
          <h2>Test Results</h2>
          <div data-testid="test-buttons">
            <TestResultsButtons />
          </div>
        </div>

        {currentTest && (
          <div style={{ marginTop: "30px" }}>
            <h2>Inspected Test Result</h2>
            <div data-testid="inspected-test-result">
              <InspectedTestResultView />
            </div>
          </div>
        )}

        {/* Debug info for E2E tests */}
        <div
          data-testid="debug-info"
          style={{ marginTop: "30px", padding: "10px", background: "#f5f5f5", borderRadius: "4px" }}
        >
          <h3>Debug Info</h3>
          <p data-testid="tests-count">Tests: {testSuiteResult?.tests.length || 0}</p>
          <p data-testid="inspected-test-name">Inspected test: {currentTest ? currentTest.name : "None"}</p>
          <p data-testid="inspected-test-status">Inspected test status: {currentTest ? currentTest.status : "None"}</p>
        </div>
      </div>
    </OrchestratorProvider>
  );
}
