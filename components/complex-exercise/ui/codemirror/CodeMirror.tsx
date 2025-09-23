import type { EditorView } from "@codemirror/view";
import React from "react";

import { useOrchestratorStore } from "../../lib/Orchestrator";
import { useOrchestrator } from "../../lib/OrchestratorContext";
import { readonlyCompartment } from "./setup/editorCompartments";

export { readonlyCompartment };
export type ViewRef = React.MutableRefObject<EditorView | null>;

export function CodeMirror() {
  const orchestrator = useOrchestrator();
  const { defaultCode, shouldAutoRunCode } = useOrchestratorStore(orchestrator);

  // Set up the editor - orchestrator ensures ref stability
  const editorRef = orchestrator.setupEditor(defaultCode, false, 0, shouldAutoRunCode);

  return (
    <div className="editor-wrapper">
      <div id="bootcamp-cm-editor" data-testid="codemirror-editor" className="editor" ref={editorRef} />
    </div>
  );
}

// Enable why-did-you-render tracking for this component
if (process.env.NODE_ENV === "development") {
  CodeMirror.whyDidYouRender = true;
}
