"use client";

import React, { useEffect, useState } from "react";
import { CodeMirror } from "@/components/complex-exercise/ui/codemirror/CodeMirror";
import Orchestrator from "@/components/complex-exercise/lib/Orchestrator";
import OrchestratorProvider from "@/components/complex-exercise/lib/OrchestratorProvider";

export default function OrchestratorCodeMirrorTestPage() {
  const [orchestrator, setOrchestrator] = useState<Orchestrator | null>(null);

  useEffect(() => {
    const orch = new Orchestrator("test-exercise", "// Initial code\nconst x = 42;");
    setOrchestrator(orch);

    // Expose orchestrator to window for E2E testing
    (window as any).testOrchestrator = orch;

    return () => {
      delete (window as any).testOrchestrator;
    };
  }, []);

  if (!orchestrator) {
    return <div>Loading...</div>;
  }

  return (
    <OrchestratorProvider orchestrator={orchestrator}>
      <div className="p-8">
        <h1 className="text-2xl mb-4">CodeMirror E2E Test Page</h1>
        <div id="editor-container" className="border border-gray-300 rounded" data-testid="editor-container">
          <CodeMirror />
        </div>
      </div>
    </OrchestratorProvider>
  );
}
