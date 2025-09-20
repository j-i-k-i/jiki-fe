import type { EditorView } from "@codemirror/view";
import React from "react";

import type { Orchestrator } from "../../lib/Orchestrator";
import { useOrchestratorStore } from "../../lib/Orchestrator";
import { readonlyCompartment } from "./setup/editorCompartments";
import { setupEditor } from "./setup/setupEditor";

export { readonlyCompartment };
export type ViewRef = React.MutableRefObject<EditorView | null>;

export function CodeMirror({ orchestrator }: { orchestrator: Orchestrator }) {
  const { defaultCode, shouldAutoRunCode } = useOrchestratorStore(orchestrator);

  // Set up the editor - returns a ref callback
  const editorRef = setupEditor(orchestrator, defaultCode, false, 0, shouldAutoRunCode);

  return (
    <div className="editor-wrapper">
      <div id="bootcamp-cm-editor" data-ci="codemirror-editor" className="editor" ref={editorRef} />
    </div>
  );
}

// Enable why-did-you-render tracking for this component
if (process.env.NODE_ENV === "development") {
  CodeMirror.whyDidYouRender = true;
}
