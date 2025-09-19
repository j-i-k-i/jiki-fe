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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "white",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#1a1a1a"
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: "600",
          marginBottom: "8px",
          color: "#111"
        }}
      >
        CodeMirror Extensions Testing UI
      </h1>
      <p
        style={{
          color: "#666",
          marginBottom: "32px",
          fontSize: "14px"
        }}
      >
        Test and interact with CodeMirror extensions using the controls below.
      </p>

      <div style={{ marginBottom: "32px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "500",
            marginBottom: "12px",
            color: "#333"
          }}
        >
          Code Editor
        </h2>
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}
        >
          <CodeMirror orchestrator={orchestrator} />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "24px"
        }}
      >
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
