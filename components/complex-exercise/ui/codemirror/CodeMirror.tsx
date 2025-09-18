import type { EditorView } from "@codemirror/view";
import React from "react";

import type { Orchestrator } from "../../lib/Orchestrator";
import { useOrchestratorStore } from "../../lib/Orchestrator";
import { readonlyCompartment } from "./setup/editorCompartments";
import { useEditorSetup, type Handler } from "./setup/useEditorSetup";

export { readonlyCompartment };
export type { Handler };
export type ViewRef = React.MutableRefObject<EditorView | null>;

export function CodeMirror({ orchestrator }: { orchestrator: Orchestrator }) {
  const { readonly, defaultCode, highlightedLine, shouldAutoRunCode } = useOrchestratorStore(orchestrator);

  // Use defaultCode as initial value
  const value = defaultCode;

  // Set up the editor using the custom hook
  const { editorRef } = useEditorSetup(orchestrator, value, readonly, highlightedLine, shouldAutoRunCode);

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
