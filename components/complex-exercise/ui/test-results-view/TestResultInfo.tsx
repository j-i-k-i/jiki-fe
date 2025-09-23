import type { NewTestResult } from "../../lib/test-results-types";
import type { ProcessedExpect } from "../../lib/types";
import { CodeRun } from "./CodeRun";
import { IOTestResultView } from "./IOTestResultView";
import { StateTestResultView } from "./StateTestResultView";

export function TestResultInfo({
  result,
  firstExpect
}: {
  result: NewTestResult;
  firstExpect: ProcessedExpect | null;
}) {
  if (!firstExpect) {
    return null;
  }
  if (firstExpect.type === "state") {
    let errorHtml = firstExpect.errorHtml || "";
    errorHtml = errorHtml.replace(/{value}/, firstExpect.actual);

    return <StateTestResultView isPassing={firstExpect.pass} errorHtml={errorHtml} />;
  }
  return (
    <table className="io-test-result-info">
      <tbody>
        <>
          <CodeRun codeRun={firstExpect.codeRun || result.codeRun || ""} />
          <IOTestResultView diff={firstExpect.diff} />
        </>
      </tbody>
    </table>
  );
}
