"use client";
import { useRef } from "react";
import Orchestrator from "../../../lib/Orchestrator";
import { CodeMirror } from "../CodeMirror";
import BreakpointTest from "./BreakpointTest";
import InformationWidgetTest from "./InformationWidgetTest";
import LineHighlighterTest from "./LineHighlighterTest";
import MultiLineHighlighterTest from "./MultiLineHighlighterTest";
import ReadOnlyRangesTest from "./ReadOnlyRangesTest";
import UnderlineRangeTest from "./UnderlineRangeTest";

interface TestingPageProps {
  initialCode?: string;
}

export default function TestingPage({
  initialCode = "// Test CodeMirror extensions\nfunction hello() {\n  console.log('Hello, World!');\n}\n\nhello();"
}: TestingPageProps) {
  const orchestratorRef = useRef<Orchestrator>(new Orchestrator("testing-ui", initialCode));
  const orchestrator = orchestratorRef.current;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>CodeMirror Extensions Testing UI</h1>

      <div style={{ marginBottom: "20px" }}>
        <h2>Code Editor</h2>
        <div style={{ border: "1px solid #ccc", borderRadius: "4px" }}>
          <CodeMirror orchestrator={orchestrator} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <LineHighlighterTest orchestrator={orchestrator} />
        <UnderlineRangeTest orchestrator={orchestrator} />
        <ReadOnlyRangesTest orchestrator={orchestrator} />
        <InformationWidgetTest orchestrator={orchestrator} />
        <BreakpointTest orchestrator={orchestrator} />
        <MultiLineHighlighterTest orchestrator={orchestrator} />
      </div>
    </div>
  );
}
