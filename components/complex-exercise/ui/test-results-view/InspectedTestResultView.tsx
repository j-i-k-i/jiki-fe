import { assembleClassNames } from "@/utils/assemble-classnames";
import { useEffect, useRef } from "react";
import { useOrchestratorStore } from "../../lib/Orchestrator";
import { useOrchestrator } from "../../lib/OrchestratorContext";
import type { NewTestResult } from "../../lib/test-results-types";
import type { ProcessedExpect } from "../../lib/types";
import { PassMessage } from "./PassMessage";
import { TestResultInfo } from "./TestResultInfo";

export function InspectedTestResultView() {
  const orchestrator = useOrchestrator();
  const { currentTest } = useOrchestratorStore(orchestrator);
  // currentTest now has NewTestResult properties merged in
  const result = currentTest && currentTest.expects ? (currentTest as unknown as NewTestResult) : null;
  const viewContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!result) {
      return;
    }
    if (!viewContainerRef.current) {
      return;
    }

    if (viewContainerRef.current.children.length > 0) {
      const oldView = viewContainerRef.current.children[0] as HTMLElement;
      document.body.appendChild(oldView);
      oldView.style.display = "none";
    }

    viewContainerRef.current.innerHTML = "";
    viewContainerRef.current.appendChild(result.view);
    result.view.style.display = "block";

  }, [result]);

  const firstExpect = orchestrator.getFirstExpect();

  if (!result) {
    return null;
  }

  return (
    <div className={assembleClassNames("c-scenario", result.status === "fail" ? "fail" : "pass")}>
      <InspectedTestResultViewLHS
        // if tests pass, this will be first processed `expect`, otherwise first failing `expect`.
        firstExpect={firstExpect}
        result={result}
      />

      <div className={assembleClassNames("spotlight")} ref={viewContainerRef} id="view-container" />
    </div>
  );
}

export function InspectedTestResultViewLHS({
  result,
  firstExpect
}: {
  result: NewTestResult;
  firstExpect: ProcessedExpect | null;
}) {
  return (
    <div data-ci="inspected-test-result-view" className="scenario-lhs">
      <div className="scenario-lhs-content">
        <h3>
          <strong>Scenario: </strong>
          {result.name}
        </h3>

        {result.status === "pass" && <PassMessage testIdx={0} />}
        <TestResultInfo result={result} firstExpect={firstExpect} />
      </div>
    </div>
  );
}
