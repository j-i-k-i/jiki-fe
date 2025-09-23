"use client";

import { useCallback } from "react";
import { assembleClassNames } from "../../../../utils/assemble-classnames";
import { useOrchestratorStore } from "../../lib/Orchestrator";
import { useOrchestrator } from "../../lib/OrchestratorContext";
import type { NewTestResult } from "../../lib/test-results-types";

const TRANSITION_DELAY = 0.1;

interface TestResultsButtonsProps {
  isBonus?: boolean;
}

export function TestResultsButtons({ isBonus = false }: TestResultsButtonsProps) {
  const orchestrator = useOrchestrator();
  const { testSuiteResult, bonusTestSuiteResult, currentTest } = useOrchestratorStore(orchestrator);

  const testResults = isBonus ? bonusTestSuiteResult : testSuiteResult;

  const handleTestResultSelection = useCallback(
    (test: NewTestResult) => {
      if (!testResults) {
        return;
      }

      // Merge NewTestResult properties into TestState format
      if (test.animationTimeline) {
        const testState = {
          // Core TestState properties
          frames: test.frames,
          animationTimeline: test.animationTimeline,
          timelineTime: test.timelineTime,
          currentFrame: test.frames.find((f) => f.timelineTime === test.timelineTime) || test.frames[0],
          prevFrame: undefined,
          nextFrame: undefined,
          prevBreakpointFrame: undefined,
          nextBreakpointFrame: undefined,
          // NewTestResult properties
          name: test.name,
          status: test.status,
          type: test.type,
          expects: test.expects,
          view: test.view,
          imageSlug: test.imageSlug,
          slug: test.slug
        };
        orchestrator.setCurrentTest(testState);
      } else {
        // For tests without animation timeline, just set to null
        orchestrator.setCurrentTest(null);
      }

      // Set information widget data for single frame tests
      if (test.frames.length === 1) {
        const frame = test.frames[0];
        orchestrator.setInformationWidgetData({
          html: frame.description || "",
          line: frame.line,
          status: frame.status
        });
      }
    },
    [orchestrator, testResults]
  );

  if (isBonus && !testResults) {
    return null;
  }
  if (!testResults) {
    return null;
  }

  return (
    <div
      className={isBonus ? "test-selector-buttons bonus" : "test-selector-buttons"}
      style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap"
      }}
    >
      {testResults.tests.map((test, idx) => (
        <button
          key={(test.slug || test.name) + idx}
          onClick={() => handleTestResultSelection(test)}
          style={{
            transitionDelay: `${idx * TRANSITION_DELAY}s`,
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            backgroundColor: "#fff",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s ease"
          }}
          className={assembleClassNames(
            "test-button",
            test.status,
            currentTest?.slug === test.slug || currentTest?.name === test.name ? "selected" : ""
          )}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f3f4f6";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#fff";
          }}
        >
          {isBonus ? "★" : idx + 1}
        </button>
      ))}

      <style jsx>{`
        .test-button.pass {
          border-color: #10b981;
          color: #10b981;
        }
        .test-button.fail {
          border-color: #ef4444;
          color: #ef4444;
        }
        .test-button.selected {
          background-color: #3b82f6 !important;
          border-color: #3b82f6;
          color: white;
        }
        .test-button.selected:hover {
          background-color: #2563eb !important;
        }
      `}</style>
    </div>
  );
}
