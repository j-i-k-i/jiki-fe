import { defaultKeymap, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, foldKeymap, indentOnInput, unfoldEffect } from "@codemirror/language";
import { lintKeymap } from "@codemirror/lint";
import { searchKeymap } from "@codemirror/search";
import type { StateEffectType } from "@codemirror/state";
import { Compartment, EditorState } from "@codemirror/state";
import {
  crosshairCursor,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  rectangularSelection,
  type ViewUpdate
} from "@codemirror/view";
import { minimalSetup } from "codemirror";
import React, { useCallback, useEffect, useState } from "react";

import { javascript } from "@codemirror/lang-javascript";
import { foldEffect } from "@codemirror/language";
import type { Orchestrator } from "../../lib/Orchestrator";
import { useOrchestratorStore } from "../../lib/Orchestrator";
import * as Ext from "./extensions";
import { breakpointEffect } from "./extensions/breakpoint";
import { INFO_HIGHLIGHT_COLOR } from "./extensions/lineHighlighter";
import { moveCursorByPasteLength } from "./extensions/move-cursor-by-paste-length";
import { readOnlyRangesStateField } from "./extensions/read-only-ranges/readOnlyRanges";
import { getBreakpointLines } from "./getBreakpointLines";
import { getCodeMirrorFieldValue } from "./getCodeMirrorFieldValue";
import { getFoldedLines } from "./getFoldedLines";
import { unfoldableFunctionsField } from "./unfoldableFunctionNames";

export const readonlyCompartment = new Compartment();

export interface Handler {
  setValue: (value: string) => void;
  getValue: () => string;
  focus: () => void;
}

export type ViewRef = React.MutableRefObject<EditorView | null>;

function onEditorChange(...cb: Array<(update: ViewUpdate) => void>) {
  return EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      cb.forEach((fn) => fn(update));
    }
  });
}

function onBreakpointChange(...cb: Array<(update: ViewUpdate) => void>) {
  return onViewChange([breakpointEffect], ...cb);
}
function onFoldChange(...cb: Array<(update: ViewUpdate) => void>) {
  return onViewChange([foldEffect, unfoldEffect], ...cb);
}

function onViewChange(effectTypes: StateEffectType<any>[], ...cb: Array<(update: ViewUpdate) => void>) {
  return EditorView.updateListener.of((update) => {
    const changed = update.transactions.some((transaction) =>
      transaction.effects.some((effect) => effectTypes.some((effectType) => effect.is(effectType)))
    );
    if (changed) {
      cb.forEach((fn) => fn(update));
    }
  });
}

export function CodeMirror({ orchestrator }: { orchestrator: Orchestrator }) {
  const { readonly, defaultCode, highlightedLine, shouldAutoRunCode } = useOrchestratorStore(orchestrator);

  const [textarea, setTextarea] = useState<HTMLDivElement | null>(null);

  // Use defaultCode as initial value
  const value = defaultCode;

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

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          Ext.breakpointGutter,
          Ext.foldGutter,
          Ext.underlineExtension(),
          Ext.readOnlyRangeDecoration(),
          javascript(),
          Ext.jsTheme,
          minimalSetup,
          unfoldableFunctionsField,
          highlightActiveLineGutter(),
          dropCursor(),
          moveCursorByPasteLength,
          EditorState.allowMultipleSelections.of(true),
          indentOnInput(),
          bracketMatching(),
          rectangularSelection(),
          crosshairCursor(),
          highlightActiveLine(),
          keymap.of([...defaultKeymap, ...searchKeymap, ...historyKeymap, ...foldKeymap, ...lintKeymap, indentWithTab]),
          Ext.highlightLine(highlightedLine),
          Ext.showInfoWidgetField,
          Ext.informationWidgetDataField,
          Ext.lineInformationExtension({
            onClose: () => orchestrator.setShouldShowInformationWidget(false)
          }),
          Ext.multiHighlightLine({ from: 0, to: 0 }),
          readonlyCompartment.of([EditorView.editable.of(!readonly)]),
          onBreakpointChange(() => orchestrator.setBreakpoints(getBreakpointLines(view))),
          onFoldChange(() => orchestrator.setFoldedLines(getFoldedLines(view))),
          onEditorChange(
            () =>
              orchestrator.setInformationWidgetData({
                html: "",
                line: 0,
                status: "SUCCESS"
              }),
            () => orchestrator.setHighlightedLine(0),
            (e) => {
              // Auto-save the document content with readonly ranges
              const code = e.state.doc.toString();
              const readonlyRanges = getCodeMirrorFieldValue(e.view, readOnlyRangesStateField);
              orchestrator.autoSaveContent(code, readonlyRanges);
            },
            () => orchestrator.setHighlightedLineColor(INFO_HIGHLIGHT_COLOR),
            () => orchestrator.setShouldShowInformationWidget(false),
            () => orchestrator.setHasCodeBeenEdited(true),
            () => orchestrator.setUnderlineRange(undefined),
            () => orchestrator.setBreakpoints(getBreakpointLines(view)),
            () => orchestrator.setFoldedLines(getFoldedLines(view)),
            () => {
              if (shouldAutoRunCode) {
                orchestrator.handleRunCode();
              }
            },
            () => orchestrator.callOnEditorChangeCallback(view)
          ),
          Ext.cursorTooltip(),
          Ext.highlightedCodeBlock(),
          Ext.initReadOnlyRangesExtension()
        ]
      }),
      parent: textarea
    });

    orchestrator.setEditorView(view);

    try {
      orchestrator.handleEditorDidMount({ setValue, getValue, focus: view.focus.bind(view) });
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

  return (
    <div className="editor-wrapper">
      <div id="bootcamp-cm-editor" data-ci="codemirror-editor" className="editor" ref={setTextarea} />
    </div>
  );
}
