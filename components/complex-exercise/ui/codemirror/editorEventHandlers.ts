import { foldEffect, unfoldEffect } from "@codemirror/language";
import type { StateEffectType } from "@codemirror/state";
import { EditorView, type ViewUpdate } from "@codemirror/view";

import type { Orchestrator } from "../../lib/Orchestrator";
import { breakpointEffect } from "./extensions/breakpoint";
import { INFO_HIGHLIGHT_COLOR } from "./extensions/lineHighlighter";
import { readOnlyRangesStateField } from "./extensions/read-only-ranges/readOnlyRanges";
import { getBreakpointLines } from "./getBreakpointLines";
import { getCodeMirrorFieldValue } from "./getCodeMirrorFieldValue";
import { getFoldedLines } from "./getFoldedLines";

export function onEditorChange(...cb: Array<(update: ViewUpdate) => void>) {
  return EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      cb.forEach((fn) => fn(update));
    }
  });
}

export function onBreakpointChange(...cb: Array<(update: ViewUpdate) => void>) {
  return onViewChange([breakpointEffect], ...cb);
}

export function onFoldChange(...cb: Array<(update: ViewUpdate) => void>) {
  return onViewChange([foldEffect, unfoldEffect], ...cb);
}

export function onViewChange(effectTypes: StateEffectType<any>[], ...cb: Array<(update: ViewUpdate) => void>) {
  return EditorView.updateListener.of((update) => {
    const changed = update.transactions.some((transaction) =>
      transaction.effects.some((effect) => effectTypes.some((effectType) => effect.is(effectType)))
    );
    if (changed) {
      cb.forEach((fn) => fn(update));
    }
  });
}

export function createEditorChangeHandlers(orchestrator: Orchestrator, shouldAutoRunCode: boolean) {
  return onEditorChange(
    // Reset information widget
    () =>
      orchestrator.setInformationWidgetData({
        html: "",
        line: 0,
        status: "SUCCESS"
      }),

    // Reset highlighted line
    () => orchestrator.setHighlightedLine(0),

    // Auto-save content with readonly ranges
    (e) => {
      const code = e.state.doc.toString();
      const readonlyRanges = getCodeMirrorFieldValue(e.view, readOnlyRangesStateField);
      orchestrator.autoSaveContent(code, readonlyRanges);
    },

    // Set highlight color
    () => orchestrator.setHighlightedLineColor(INFO_HIGHLIGHT_COLOR),

    // Hide information widget
    () => orchestrator.setShouldShowInformationWidget(false),

    // Mark code as edited
    () => orchestrator.setHasCodeBeenEdited(true),

    // Clear underline range
    () => orchestrator.setUnderlineRange(undefined),

    // Update breakpoints
    () => {
      const view = orchestrator.getEditorView();
      if (view) {
        orchestrator.setBreakpoints(getBreakpointLines(view));
      }
    },

    // Update folded lines
    () => {
      const view = orchestrator.getEditorView();
      if (view) {
        orchestrator.setFoldedLines(getFoldedLines(view));
      }
    },

    // Auto-run code if enabled
    () => {
      if (shouldAutoRunCode) {
        orchestrator.handleRunCode();
      }
    },

    // Trigger custom callback
    () => {
      const view = orchestrator.getEditorView();
      if (view) {
        orchestrator.callOnEditorChangeCallback(view);
      }
    }
  );
}

export function createBreakpointChangeHandler(orchestrator: Orchestrator) {
  return onBreakpointChange(() => {
    const view = orchestrator.getEditorView();
    if (view) {
      orchestrator.setBreakpoints(getBreakpointLines(view));
    }
  });
}

export function createFoldChangeHandler(orchestrator: Orchestrator) {
  return onFoldChange(() => {
    const view = orchestrator.getEditorView();
    if (view) {
      orchestrator.setFoldedLines(getFoldedLines(view));
    }
  });
}
