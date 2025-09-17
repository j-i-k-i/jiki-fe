/* eslint-disable no-console */
import { defaultKeymap, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, foldKeymap, indentOnInput, unfoldEffect } from "@codemirror/language";
import { lintKeymap } from "@codemirror/lint";
import { searchKeymap } from "@codemirror/search";
import type { Extension, StateEffectType } from "@codemirror/state";
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
import { loadCodeMirrorContent } from "../../lib/localStorage";
import type { Orchestrator } from "../../lib/Orchestrator";
import { useOrchestratorStore } from "../../lib/Orchestrator";
import { useCodeMirrorAutoSave } from "../../lib/useAutoSave";
import * as Ext from "./extensions";
import { breakpointEffect } from "./extensions/breakpoint";
import { INFO_HIGHLIGHT_COLOR } from "./extensions/lineHighlighter";
import { moveCursorByPasteLength } from "./extensions/move-cursor-by-paste-length";
import { readOnlyRangesStateField } from "./extensions/read-only-ranges/readOnlyRanges";
import { getBreakpointLines } from "./getBreakpointLines";
import { getCodeMirrorFieldValue } from "./getCodeMirrorFieldValue";
import { getFoldedLines } from "./getFoldedLines";
import * as Hook from "./hooks";
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

export function CodeMirror({
  orchestrator,
  editorDidMount,
  handleRunCode,
  style,
  onEditorChangeCallback,
  extensions = []
}: {
  orchestrator: Orchestrator;
  editorDidMount: (handler: Handler) => void;
  handleRunCode: () => void;
  style?: React.CSSProperties;
  onEditorChangeCallback?: (view: EditorView) => void;
  extensions?: Extension[];
}) {
  const {
    readonly,
    defaultCode,
    shouldShowInformationWidget,
    underlineRange,
    highlightedLineColor,
    highlightedLine,
    informationWidgetData,
    shouldAutoRunCode
  } = useOrchestratorStore(orchestrator);

  const [textarea, setTextarea] = useState<HTMLDivElement | null>(null);

  // Use dummy UUID for now - will be replaced with actual exercise ID
  const DUMMY_EXERCISE_ID = "exercise-uuid-12345";

  const { autoSaveCallback, saveImmediately } = useCodeMirrorAutoSave({
    exerciseId: DUMMY_EXERCISE_ID,
    debounceMs: 500,
    onSaveSuccess: (result) => {
      console.log("CodeMirror content saved successfully", result);
    },
    onSaveError: (result) => {
      console.error("Failed to save CodeMirror content:", result.error);
    }
  });

  // Try to load saved content, fallback to defaultCode
  let value = defaultCode;
  const loadResult = loadCodeMirrorContent(DUMMY_EXERCISE_ID);
  if (loadResult.success && loadResult.data) {
    value = loadResult.data.code;
    console.log("Loaded saved CodeMirror content from localStorage");
  } else if (loadResult.error !== "No data found for this exercise") {
    console.warn("Failed to load saved content:", loadResult.error);
  }

  const getEditorView = useCallback((): EditorView | null => {
    return orchestrator.getEditorView();
  }, [orchestrator]);

  const setValue = (text: string) => {
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
  };

  const getValue = () => {
    const editorView = getEditorView();
    return (value = editorView?.state.doc.toString() || "");
  };

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
              autoSaveCallback(code, readonlyRanges);
            },
            () => orchestrator.setHighlightedLineColor(INFO_HIGHLIGHT_COLOR),
            () => orchestrator.setShouldShowInformationWidget(false),
            () => orchestrator.setHasCodeBeenEdited(true),
            () => orchestrator.setUnderlineRange(undefined),
            () => orchestrator.setBreakpoints(getBreakpointLines(view)),
            () => orchestrator.setFoldedLines(getFoldedLines(view)),
            () => {
              if (shouldAutoRunCode) {
                handleRunCode();
              }
            },
            () => {
              if (onEditorChangeCallback) {
                onEditorChangeCallback(view);
              }
            }
          ),
          Ext.cursorTooltip(),
          Ext.highlightedCodeBlock(),
          Ext.initReadOnlyRangesExtension(),
          ...extensions
        ]
      }),
      parent: textarea
    });

    orchestrator.setEditorView(view);

    try {
      editorDidMount({ setValue, getValue, focus: view.focus.bind(view) });
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
        saveImmediately(code, readonlyRanges);
        orchestrator.setEditorView(null);
      }
    };
  });

  Hook.useReadonlyCompartment(getEditorView(), readonly);

  Hook.useHighlightLine(getEditorView(), highlightedLine);
  Hook.useHighlightLineColor(getEditorView(), highlightedLineColor);
  Hook.useUnderlineRange(getEditorView(), underlineRange);
  // Hook.useReadonlyRanges(getEditorView(), readonlyRanges);

  useEffect(() => {
    const editorView = getEditorView();
    if (!editorView || !shouldShowInformationWidget) {
      return;
    }
    editorView.dispatch({
      effects: Ext.showInfoWidgetEffect.of(shouldShowInformationWidget)
    });
  }, [getEditorView, shouldShowInformationWidget]);

  useEffect(() => {
    const editorView = getEditorView();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!editorView || !informationWidgetData) {
      return;
    }

    editorView.dispatch({
      effects: Ext.informationWidgetDataEffect.of(informationWidgetData)
    });
  }, [getEditorView, informationWidgetData, informationWidgetData.html, informationWidgetData.line]);

  return (
    <div className="editor-wrapper" style={style}>
      <div id="bootcamp-cm-editor" data-ci="codemirror-editor" className="editor" ref={setTextarea} />
    </div>
  );
}
