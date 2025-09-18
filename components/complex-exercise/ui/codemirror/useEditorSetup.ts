import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useCallback, useEffect } from "react";

import type { Orchestrator } from "../../lib/Orchestrator";
import { readOnlyRangesStateField } from "./extensions/read-only-ranges/readOnlyRanges";
import { getCodeMirrorFieldValue } from "./getCodeMirrorFieldValue";
import { createEditorExtensions } from "./editorExtensions";
import {
  createBreakpointChangeHandler,
  createEditorChangeHandlers,
  createFoldChangeHandler
} from "./editorEventHandlers";

export interface Handler {
  setValue: (value: string) => void;
  getValue: () => string;
  focus: () => void;
}

export function useEditorSetup(
  orchestrator: Orchestrator,
  textarea: HTMLDivElement | null,
  value: string,
  readonly: boolean,
  highlightedLine: number,
  shouldAutoRunCode: boolean
) {
  const getEditorView = useCallback((): EditorView | null => {
    return orchestrator.getEditorView();
  }, [orchestrator]);

  const setValue = useCallback(
    (text: string) => {
      const editorView = getEditorView();
      if (!editorView) {
        return;
      }

      const transaction = editorView.state.update({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: text
        }
      });

      editorView.dispatch(transaction);
    },
    [getEditorView]
  );

  const getValue = useCallback(() => {
    const editorView = getEditorView();
    return editorView?.state.doc.toString() || "";
  }, [getEditorView]);

  useEffect(() => {
    if (!textarea || getEditorView()) {
      return;
    }

    // Create event handlers
    const onBreakpointChange = createBreakpointChangeHandler(orchestrator);
    const onFoldChange = createFoldChangeHandler(orchestrator);
    const onEditorChange = createEditorChangeHandlers(orchestrator, shouldAutoRunCode);

    // Create extensions
    const extensions = createEditorExtensions({
      orchestrator,
      highlightedLine,
      readonly,
      onBreakpointChange,
      onFoldChange,
      onEditorChange
    });

    // Create editor view
    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions
      }),
      parent: textarea
    });

    orchestrator.setEditorView(view);

    // Handle editor mount
    try {
      orchestrator.handleEditorDidMount({
        setValue,
        getValue,
        focus: view.focus.bind(view)
      });
    } catch (e: unknown) {
      if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
        throw e;
      }

      orchestrator.setHasUnhandledError(true);
      orchestrator.setUnhandledErrorBase64(
        JSON.stringify({
          error: String(e),
          code: value,
          type: "Codemirror editor mounting"
        })
      );
    }

    // Cleanup: save immediately when component unmounts
    return () => {
      const editorView = orchestrator.getEditorView();
      if (editorView) {
        const code = editorView.state.doc.toString();
        const readonlyRanges = getCodeMirrorFieldValue(editorView, readOnlyRangesStateField);
        orchestrator.saveImmediately(code, readonlyRanges);
        orchestrator.setEditorView(null);
      }
    };
  }, [textarea, value, readonly, highlightedLine, shouldAutoRunCode, orchestrator, getEditorView, getValue, setValue]);

  return { setValue, getValue };
}
