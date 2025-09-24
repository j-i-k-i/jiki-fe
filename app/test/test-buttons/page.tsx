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
  const { testSuiteResult, bonusTestSuiteResult, inspectedTestResult } = useOrchestratorStore(orchestrator);

  // Initialize test state in useEffect
  useEffect(() => {
    // Set up the orchestrator for testing
    orchestrator.setExerciseTitle("Test Buttons E2E Test");

    // Run tests and wait for completion before exposing to window
    const initializeTests = async () => {
      await orchestrator.runCode();
      // Now expose to window for E2E test access after tests have run
      (window as any).testOrchestrator = orchestrator;
    };

    void initializeTests();

    return () => {
      delete (window as any).testOrchestrator;
    };
  }, [orchestrator]);

  return (
    <OrchestratorProvider orchestrator={orchestrator}>
      <div data-testid="test-buttons-container" style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <h1>Test Buttons E2E Test Page</h1>

        <div style={{ marginBottom: "20px" }}>
          <h2>Regular Test Results</h2>
          <div data-testid="regular-test-buttons">
            <TestResultsButtons isBonus={false} />
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h2>Bonus Test Results</h2>
          <div data-testid="bonus-test-buttons">
            <TestResultsButtons isBonus={true} />
          </div>
        </div>

        {inspectedTestResult && (
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
          <p data-testid="regular-tests-count">Regular tests: {testSuiteResult?.tests.length || 0}</p>
          <p data-testid="bonus-tests-count">Bonus tests: {bonusTestSuiteResult?.tests.length || 0}</p>
          <p data-testid="inspected-test-name">Inspected test: {inspectedTestResult?.name || "None"}</p>
          <p data-testid="inspected-test-status">Inspected test status: {inspectedTestResult?.status || "None"}</p>
        </div>
      </div>
    </OrchestratorProvider>
  );
}
