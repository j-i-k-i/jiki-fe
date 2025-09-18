import React, { useState } from "react";
import type { EditorView } from "@codemirror/view";

import type { Orchestrator } from "../../lib/Orchestrator";
import { useOrchestratorStore } from "../../lib/Orchestrator";
import { readonlyCompartment } from "./editorCompartments";
import { useEditorSetup, type Handler } from "./useEditorSetup";

export { readonlyCompartment };
export type { Handler };
export type ViewRef = React.MutableRefObject<EditorView | null>;

export function CodeMirror({ orchestrator }: { orchestrator: Orchestrator }) {
  const { readonly, defaultCode, highlightedLine, shouldAutoRunCode } = useOrchestratorStore(orchestrator);
  const [textarea, setTextarea] = useState<HTMLDivElement | null>(null);

  // Use defaultCode as initial value
  const value = defaultCode;

  // Set up the editor using the custom hook
  useEditorSetup(orchestrator, textarea, value, readonly, highlightedLine, shouldAutoRunCode);

  return (
    <div className="editor-wrapper">
      <div id="bootcamp-cm-editor" data-ci="codemirror-editor" className="editor" ref={setTextarea} />
    </div>
  );
}
