import type { ProcessedExpect } from "../../lib/types";
import { StateTestResultView } from "./StateTestResultView";

export function TestResultInfo({ firstExpect }: { firstExpect: ProcessedExpect | null }) {
  if (!firstExpect) {
    return null;
  }

  let errorHtml = firstExpect.errorHtml || "";
  errorHtml = errorHtml.replace(/{value}/, firstExpect.actual);

  return <StateTestResultView isPassing={firstExpect.pass} errorHtml={errorHtml} />;
}
