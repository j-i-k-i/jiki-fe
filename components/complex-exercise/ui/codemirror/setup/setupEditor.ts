import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import type { Orchestrator } from "../../../lib/Orchestrator";
import { readOnlyRangesStateField } from "../extensions/read-only-ranges/readOnlyRanges";
import { getCodeMirrorFieldValue } from "../utils/getCodeMirrorFieldValue";
import { createEditorExtensions } from "./editorExtensions";

/**
 * Creates an editor ref callback that sets up CodeMirror when mounted
 * and cleans up when unmounted.
 *
 * @returns A ref callback function to be used with a div element
 */
export function setupEditor(
  orchestrator: Orchestrator,
  value: string,
  readonly: boolean,
  highlightedLine: number,
  shouldAutoRunCode: boolean
) {
  // Return the ref callback
  return (element: HTMLDivElement | null) => {
    if (!element) {
      // Cleanup when element is removed
      const editorView = orchestrator.getEditorView();
      if (editorView) {
        const code = editorView.state.doc.toString();
        const readonlyRanges = getCodeMirrorFieldValue(editorView, readOnlyRangesStateField);
        orchestrator.saveImmediately(code, readonlyRanges);
        orchestrator.setEditorView(null);
      }
      return;
    }

    // Don't initialize if editor already exists
    if (orchestrator.getEditorView()) {
      return;
    }

    // Create event handlers using orchestrator methods
    const onBreakpointChange = orchestrator.createBreakpointChangeHandler();
    const onFoldChange = orchestrator.createFoldChangeHandler();
    const onEditorChange = orchestrator.createEditorChangeHandlers(shouldAutoRunCode);

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
      parent: element
    });

    orchestrator.setEditorView(view);

    // Create and store editor API
    const setValue = (text: string) => {
      const editorView = orchestrator.getEditorView();
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
    };

    const getValue = () => {
      const editorView = orchestrator.getEditorView();
      return editorView?.state.doc.toString() || "";
    };

    try {
      orchestrator.setEditorAPI({
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
        Buffer.from(JSON.stringify({ error: String(e) })).toString("base64")
      );
    }
  };
}