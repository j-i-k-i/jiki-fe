/* eslint-disable no-console */
import type { EditorView, ViewUpdate } from "@codemirror/view";
import { EditorView as EditorViewClass } from "@codemirror/view";
import { foldEffect, unfoldEffect } from "@codemirror/language";
import type { StateEffectType, Extension } from "@codemirror/state";
import { debounce } from "lodash";
import type { StoreApi } from "zustand/vanilla";
import { readonlyCompartment } from "../../ui/codemirror/CodeMirror";
import {
  informationWidgetDataEffect,
  showInfoWidgetEffect,
  changeMultiLineHighlightEffect
} from "../../ui/codemirror/extensions";
import { breakpointEffect } from "../../ui/codemirror/extensions/breakpoint";
import {
  INFO_HIGHLIGHT_COLOR,
  changeColorEffect,
  changeLineEffect
} from "../../ui/codemirror/extensions/lineHighlighter";
import {
  readOnlyRangesStateField,
  updateReadOnlyRangesEffect
} from "../../ui/codemirror/extensions/read-only-ranges/readOnlyRanges";
import { addUnderlineEffect } from "../../ui/codemirror/extensions/underlineRange";
import { getBreakpointLines } from "../../ui/codemirror/utils/getBreakpointLines";
import { getCodeMirrorFieldValue } from "../../ui/codemirror/utils/getCodeMirrorFieldValue";
import { getFoldedLines as getCodeMirrorFoldedLines } from "../../ui/codemirror/utils/getFoldedLines";
import { updateUnfoldableFunctions } from "../../ui/codemirror/utils/unfoldableFunctionNames";
import { loadCodeMirrorContent, saveCodeMirrorContent } from "../localStorage";
import type { UnderlineRange, InformationWidgetData, OrchestratorStore } from "../types";

export class EditorManager {
  private editorView: EditorView | null = null;
  private editorHandler: any = null;
  private onEditorChangeCallback?: (view: EditorView) => void;
  private isSaving = false;
  private saveDebounced: ReturnType<typeof debounce> | null = null;

  constructor(
    private readonly store: StoreApi<OrchestratorStore>,
    private readonly exerciseUuid: string
  ) {
    this.initializeAutoSave();
    this.initializeSubscriptions();
  }

  private initializeSubscriptions() {
    let previousInformationWidgetData = this.store.getState().informationWidgetData;
    let previousShouldShowInformationWidget = this.store.getState().shouldShowInformationWidget;
    let previousReadonly = this.store.getState().readonly;
    let previousHighlightedLine = this.store.getState().highlightedLine;
    let previousHighlightedLineColor = this.store.getState().highlightedLineColor;
    let previousUnderlineRange = this.store.getState().underlineRange;

    this.store.subscribe((state) => {
      if (state.informationWidgetData !== previousInformationWidgetData) {
        this.applyInformationWidgetData(state.informationWidgetData);
        previousInformationWidgetData = state.informationWidgetData;
      }

      if (state.shouldShowInformationWidget !== previousShouldShowInformationWidget) {
        this.applyShouldShowInformationWidget(state.shouldShowInformationWidget);
        previousShouldShowInformationWidget = state.shouldShowInformationWidget;
      }

      if (state.readonly !== previousReadonly) {
        this.applyReadonlyCompartment(state.readonly);
        previousReadonly = state.readonly;
      }

      if (state.highlightedLine !== previousHighlightedLine) {
        this.applyHighlightLine(state.highlightedLine);
        previousHighlightedLine = state.highlightedLine;
      }

      if (state.highlightedLineColor !== previousHighlightedLineColor) {
        this.applyHighlightLineColor(state.highlightedLineColor);
        previousHighlightedLineColor = state.highlightedLineColor;
      }

      if (state.underlineRange !== previousUnderlineRange) {
        this.applyUnderlineRange(state.underlineRange);
        previousUnderlineRange = state.underlineRange;
      }
    });
  }

  private initializeAutoSave() {
    const saveNow = (code: string, readonlyRanges?: { from: number; to: number }[]) => {
      if (this.isSaving) {
        return;
      }

      this.isSaving = true;

      try {
        const result = saveCodeMirrorContent(this.exerciseUuid, code, readonlyRanges);

        if (result.success) {
          console.log("CodeMirror content saved successfully", result);
        } else {
          console.error("Failed to save CodeMirror content:", result.error);
        }
      } catch (error) {
        console.error(`Error saving exercise ${this.exerciseUuid}:`, error);
      } finally {
        this.isSaving = false;
      }
    };

    this.saveDebounced = debounce((code: string, readonlyRanges?: { from: number; to: number }[]) => {
      saveNow(code, readonlyRanges);
    }, 500);
  }

  setEditorView(view: EditorView | null) {
    this.editorView = view;
  }

  getEditorView(): EditorView | null {
    return this.editorView;
  }

  handleEditorDidMount(handler: any) {
    this.editorHandler = handler;
  }

  getEditorHandler() {
    return this.editorHandler;
  }

  setOnEditorChangeCallback(callback?: (view: EditorView) => void) {
    this.onEditorChangeCallback = callback;
  }

  callOnEditorChangeCallback(view: EditorView) {
    if (this.onEditorChangeCallback) {
      this.onEditorChangeCallback(view);
    }
  }

  getCurrentEditorValue(): string | undefined {
    if (this.editorHandler?.getValue) {
      const value = this.editorHandler.getValue();
      this.store.getState().setLatestValueSnapshot(value);
      return value;
    }
    return undefined;
  }

  autoSaveContent(code: string, readonlyRanges?: { from: number; to: number }[]) {
    if (this.saveDebounced) {
      this.saveDebounced(code, readonlyRanges);
    }
  }

  saveImmediately(code: string, readonlyRanges?: { from: number; to: number }[]) {
    if (this.saveDebounced) {
      this.saveDebounced.cancel();
    }

    if (this.isSaving) {
      return;
    }

    this.isSaving = true;

    try {
      const result = saveCodeMirrorContent(this.exerciseUuid, code, readonlyRanges);

      if (result.success) {
        console.log("CodeMirror content saved successfully", result);
      } else {
        console.error("Failed to save CodeMirror content:", result.error);
      }
    } catch (error) {
      console.error(`Error saving exercise ${this.exerciseUuid}:`, error);
    } finally {
      this.isSaving = false;
    }
  }

  setMultiLineHighlight(fromLine: number, toLine: number) {
    if (!this.editorView) {
      return;
    }

    if (fromLine === 0 && toLine === 0) {
      this.editorView.dispatch({
        effects: changeMultiLineHighlightEffect.of([])
      });
    } else {
      const lines = [];
      for (let i = fromLine; i <= toLine; i++) {
        lines.push(i);
      }
      this.editorView.dispatch({
        effects: changeMultiLineHighlightEffect.of(lines)
      });
    }
  }

  setMultipleLineHighlights(lines: number[]) {
    if (!this.editorView) {
      return;
    }

    this.editorView.dispatch({
      effects: changeMultiLineHighlightEffect.of(lines)
    });
  }

  applyBreakpoints(breakpoints: number[]) {
    if (!this.editorView) {
      return;
    }

    const currentBreakpoints = getBreakpointLines(this.editorView);
    const effects = [];

    for (const line of currentBreakpoints) {
      if (!breakpoints.includes(line)) {
        try {
          const pos = this.editorView.state.doc.line(line).from;
          effects.push(breakpointEffect.of({ pos, on: false }));
        } catch (error) {
          console.warn(`Failed to remove breakpoint at line ${line}:`, error);
        }
      }
    }

    for (const line of breakpoints) {
      if (!currentBreakpoints.includes(line) && line >= 1 && line <= this.editorView.state.doc.lines) {
        try {
          const pos = this.editorView.state.doc.line(line).from;
          effects.push(breakpointEffect.of({ pos, on: true }));
        } catch (error) {
          console.warn(`Failed to add breakpoint at line ${line}:`, error);
        }
      }
    }

    if (effects.length > 0) {
      this.editorView.dispatch({ effects });
    }
  }

  // UNUSED: This function is currently not called.
  applyInformationWidgetData(data: InformationWidgetData) {
    if (!this.editorView) {
      return;
    }

    this.editorView.dispatch({
      effects: informationWidgetDataEffect.of(data)
    });
  }

  // UNUSED: This function is currently not called.
  applyShouldShowInformationWidget(show: boolean) {
    if (!this.editorView) {
      return;
    }

    this.editorView.dispatch({
      effects: showInfoWidgetEffect.of(show)
    });
  }

  // UNUSED: This function is currently not called.
  applyReadonlyCompartment(readonly: boolean) {
    if (!this.editorView) {
      return;
    }

    this.editorView.dispatch({
      effects: readonlyCompartment.reconfigure([EditorViewClass.editable.of(!readonly)])
    });
  }

  // UNUSED: This function is currently not called.
  applyHighlightLine(highlightedLine: number) {
    if (!this.editorView) {
      return;
    }

    this.editorView.dispatch({
      effects: changeLineEffect.of(highlightedLine)
    });
  }

  // UNUSED: This function is currently not called.
  applyHighlightLineColor(highlightedLineColor: string) {
    if (!this.editorView) {
      return;
    }

    if (highlightedLineColor) {
      this.editorView.dispatch({
        effects: changeColorEffect.of(highlightedLineColor)
      });
    }
  }

  // UNUSED: This function is currently not called.
  applyUnderlineRange(range: UnderlineRange | undefined) {
    if (!this.editorView) {
      return;
    }

    const effectRange = range || { from: 0, to: 0 };
    this.editorView.dispatch({
      effects: addUnderlineEffect.of(effectRange)
    });

    if (range) {
      const line = document.querySelector(".cm-underline");
      if (line) {
        line.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    }
  }

  initializeEditor(code: any, exercise: any, unfoldableFunctionNames: string[]) {
    const localStorageResult = loadCodeMirrorContent(this.exerciseUuid);

    if (
      localStorageResult.success &&
      localStorageResult.data &&
      code.storedAt &&
      new Date(localStorageResult.data.storedAt).getTime() < new Date(code.storedAt).getTime() - 60000
    ) {
      this.store.getState().setDefaultCode(code.code);
      this.setupEditor(unfoldableFunctionNames, {
        code: code.code,
        readonlyRanges: code.readonlyRanges
      });

      saveCodeMirrorContent(this.exerciseUuid, code.code, code.readonlyRanges);
    } else if (localStorageResult.success && localStorageResult.data) {
      this.store.getState().setDefaultCode(localStorageResult.data.code);
      this.setupEditor(unfoldableFunctionNames, {
        code: localStorageResult.data.code,
        readonlyRanges: localStorageResult.data.readonlyRanges ?? []
      });
    } else {
      this.store.getState().setDefaultCode(code.code || "");
      this.setupEditor(unfoldableFunctionNames, {
        code: code.code || "",
        readonlyRanges: code.readonlyRanges || []
      });
    }
  }

  resetEditorToStub(
    stubCode: string,
    defaultReadonlyRanges: { from: number; to: number }[],
    unfoldableFunctionNames: string[]
  ) {
    if (!this.editorHandler) {
      return;
    }

    saveCodeMirrorContent(this.exerciseUuid, stubCode, defaultReadonlyRanges);

    this.setupEditor(unfoldableFunctionNames, {
      code: "",
      readonlyRanges: []
    });

    this.setupEditor(unfoldableFunctionNames, {
      code: stubCode,
      readonlyRanges: defaultReadonlyRanges
    });
  }

  private setupEditor(
    unfoldableFunctionNames: string[],
    { readonlyRanges, code }: { readonlyRanges?: { from: number; to: number }[]; code: string }
  ) {
    if (!this.editorView) {
      return;
    }

    updateUnfoldableFunctions(this.editorView, unfoldableFunctionNames);

    if (code) {
      this.editorView.dispatch({
        changes: {
          from: 0,
          to: this.editorView.state.doc.length,
          insert: code
        }
      });
    }
    if (readonlyRanges) {
      this.editorView.dispatch({
        effects: updateReadOnlyRangesEffect.of(readonlyRanges)
      });
    }
  }

  // Event handler methods
  private onEditorChange(...cb: Array<(update: ViewUpdate) => void>): Extension {
    return EditorViewClass.updateListener.of((update) => {
      if (update.docChanged) {
        cb.forEach((fn) => fn(update));
      }
    });
  }

  private onBreakpointChange(...cb: Array<(update: ViewUpdate) => void>): Extension {
    return this.onViewChange([breakpointEffect], ...cb);
  }

  private onFoldChange(...cb: Array<(update: ViewUpdate) => void>): Extension {
    return this.onViewChange([foldEffect, unfoldEffect], ...cb);
  }

  private onViewChange(effectTypes: StateEffectType<any>[], ...cb: Array<(update: ViewUpdate) => void>): Extension {
    return EditorViewClass.updateListener.of((update) => {
      const changed = update.transactions.some((transaction) =>
        transaction.effects.some((effect) => effectTypes.some((effectType) => effect.is(effectType)))
      );
      if (changed) {
        cb.forEach((fn) => fn(update));
      }
    });
  }

  createEditorChangeHandlers(shouldAutoRunCode: boolean, handleRunCode: () => void): Extension {
    return this.onEditorChange(
      () =>
        this.store.getState().setInformationWidgetData({
          html: "",
          line: 0,
          status: "SUCCESS"
        }),

      () => this.store.getState().setHighlightedLine(0),

      (e) => {
        const code = e.state.doc.toString();
        const readonlyRanges = getCodeMirrorFieldValue(e.view, readOnlyRangesStateField);
        this.autoSaveContent(code, readonlyRanges);
      },

      () => this.store.getState().setHighlightedLineColor(INFO_HIGHLIGHT_COLOR),

      () => this.store.getState().setShouldShowInformationWidget(false),

      () => this.store.getState().setHasCodeBeenEdited(true),

      () => this.store.getState().setUnderlineRange(undefined),

      () => {
        if (this.editorView) {
          this.store.getState().setBreakpoints(getBreakpointLines(this.editorView));
        }
      },

      () => {
        if (this.editorView) {
          this.store.getState().setFoldedLines(getCodeMirrorFoldedLines(this.editorView));
        }
      },

      () => {
        if (shouldAutoRunCode) {
          handleRunCode();
        }
      },

      () => {
        if (this.editorView) {
          this.callOnEditorChangeCallback(this.editorView);
        }
      }
    );
  }

  createBreakpointChangeHandler(): Extension {
    return this.onBreakpointChange(() => {
      if (this.editorView) {
        this.store.getState().setBreakpoints(getBreakpointLines(this.editorView));
      }
    });
  }

  createFoldChangeHandler(): Extension {
    return this.onFoldChange(() => {
      if (this.editorView) {
        this.store.getState().setFoldedLines(getCodeMirrorFoldedLines(this.editorView));
      }
    });
  }
}
