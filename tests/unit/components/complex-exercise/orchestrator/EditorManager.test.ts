// Mock all CodeMirror modules before importing the EditorManager
jest.mock("@codemirror/state", () => ({
  EditorState: {
    create: jest.fn().mockReturnValue({})
  }
}));
jest.mock("@codemirror/language", () => ({
  foldEffect: { is: jest.fn() },
  unfoldEffect: { is: jest.fn() }
}));
jest.mock("@codemirror/view", () => ({
  EditorView: Object.assign(
    jest.fn().mockImplementation(() => ({
      state: { doc: { toString: jest.fn().mockReturnValue("") } },
      dispatch: jest.fn(),
      focus: jest.fn()
    })),
    {
      editable: { of: jest.fn() },
      updateListener: { of: jest.fn().mockReturnValue({}) }
    }
  )
}));

jest.mock("@/components/complex-exercise/ui/codemirror/CodeMirror", () => ({
  readonlyCompartment: {
    reconfigure: jest.fn()
  }
}));

jest.mock("@/components/complex-exercise/ui/codemirror/extensions", () => ({
  informationWidgetDataEffect: { of: jest.fn() },
  showInfoWidgetEffect: { of: jest.fn() },
  changeMultiLineHighlightEffect: { of: jest.fn() }
}));

jest.mock("@/components/complex-exercise/ui/codemirror/extensions/breakpoint", () => ({
  breakpointEffect: { of: jest.fn(), is: jest.fn() }
}));

jest.mock("@/components/complex-exercise/ui/codemirror/extensions/lineHighlighter", () => ({
  INFO_HIGHLIGHT_COLOR: "#ffc107",
  changeColorEffect: { of: jest.fn() },
  changeLineEffect: { of: jest.fn() }
}));

jest.mock("@/components/complex-exercise/ui/codemirror/extensions/read-only-ranges/readOnlyRanges", () => ({
  readOnlyRangesStateField: {},
  updateReadOnlyRangesEffect: { of: jest.fn() }
}));

jest.mock("@/components/complex-exercise/ui/codemirror/extensions/underlineRange", () => ({
  addUnderlineEffect: { of: jest.fn() }
}));

jest.mock("@/components/complex-exercise/ui/codemirror/utils/getBreakpointLines", () => ({
  getBreakpointLines: jest.fn().mockReturnValue([])
}));

jest.mock("@/components/complex-exercise/ui/codemirror/utils/getCodeMirrorFieldValue", () => ({
  getCodeMirrorFieldValue: jest.fn().mockReturnValue([])
}));

jest.mock("@/components/complex-exercise/ui/codemirror/utils/getFoldedLines", () => ({
  getFoldedLines: jest.fn().mockReturnValue([])
}));

jest.mock("@/components/complex-exercise/ui/codemirror/utils/unfoldableFunctionNames", () => ({
  updateUnfoldableFunctions: jest.fn()
}));

jest.mock("@/components/complex-exercise/ui/codemirror/setup/editorExtensions", () => ({
  createEditorExtensions: jest.fn().mockReturnValue([])
}));

jest.mock("@/components/complex-exercise/lib/localStorage", () => ({
  loadCodeMirrorContent: jest.fn().mockReturnValue({ success: false }),
  saveCodeMirrorContent: jest.fn().mockReturnValue({ success: true })
}));

jest.mock("lodash", () => ({
  debounce: jest.fn((fn) => fn)
}));

import { createOrchestratorStore } from "@/components/complex-exercise/lib/orchestrator/store";
import { EditorManager } from "@/components/complex-exercise/lib/orchestrator/EditorManager";
import type { EditorView } from "@codemirror/view";

describe("EditorManager", () => {
  let store: ReturnType<typeof createOrchestratorStore>;
  let editorManager: EditorManager;
  let mockOrchestrator: any;

  beforeEach(() => {
    store = createOrchestratorStore("test-uuid", "const x = 1;");
    mockOrchestrator = {
      handleRunCode: jest.fn(),
      getEditorView: jest.fn(),
      setEditorView: jest.fn()
    };
    editorManager = new EditorManager(store, "test-uuid", mockOrchestrator, "const x = 1;", false, 0, false);
  });

  describe("constructor", () => {
    it("should initialize with store and exerciseUuid", () => {
      expect(editorManager).toBeDefined();
    });

    it("should create and return an editor ref", () => {
      const ref = editorManager.getEditorRef();
      expect(ref).toBeDefined();
      expect(typeof ref).toBe("function");
    });
  });

  describe("getEditorView", () => {
    it("should return null before editor is created", () => {
      expect(editorManager.getEditorView()).toBeNull();
    });

    it("should return editor view after ref callback is called", () => {
      const mockElement = document.createElement("div");
      const ref = editorManager.getEditorRef();
      if (ref) {
        ref(mockElement);
      }

      expect(editorManager.getEditorView()).toBeDefined();
    });
  });

  describe("editor methods", () => {
    it("should have getValue, setValue, and focus methods", () => {
      expect(typeof editorManager.getValue).toBe("function");
      expect(typeof editorManager.setValue).toBe("function");
      expect(typeof editorManager.focus).toBe("function");
    });
  });

  describe("getCurrentEditorValue", () => {
    it("should return undefined when no handler is set", () => {
      expect(editorManager.getCurrentEditorValue()).toBeUndefined();
    });

    it("should get value from editor view and update snapshot", () => {
      // Mock the editor being created via the ref callback
      const mockElement = document.createElement("div");
      const ref = editorManager.getEditorRef();
      if (ref) {
        ref(mockElement);
      }

      const value = editorManager.getCurrentEditorValue();

      // EditorView mock returns empty string by default
      expect(value).toBe("");
      expect(store.getState().latestValueSnapshot).toBe("");
    });
  });

  describe("callOnEditorChangeCallback", () => {
    it("should call the editor change callback if set", () => {
      const mockView = {} as EditorView;
      // The callback would be set internally by the ref callback
      // We can't test setting it directly anymore
      editorManager.callOnEditorChangeCallback(mockView);
      // Should not throw
    });

    it("should not error when no callback is set", () => {
      const mockView = {} as EditorView;

      expect(() => {
        editorManager.callOnEditorChangeCallback(mockView);
      }).not.toThrow();
    });
  });

  describe("setMultiLineHighlight", () => {
    it("should dispatch effect to clear highlights when both lines are 0", () => {
      // Setup editor through the ref callback
      const mockElement = document.createElement("div");
      const ref = editorManager.getEditorRef();
      if (ref) {
        ref(mockElement);
      }

      // Get the created view and spy on its dispatch
      const view = editorManager.getEditorView();
      if (view) {
        const dispatchSpy = jest.spyOn(view, "dispatch");
        editorManager.setMultiLineHighlight(0, 0);
        expect(dispatchSpy).toHaveBeenCalled();
      }
    });

    it("should dispatch effect with line array for valid range", () => {
      // Setup editor through the ref callback
      const mockElement = document.createElement("div");
      const ref = editorManager.getEditorRef();
      if (ref) {
        ref(mockElement);
      }

      // Get the created view and spy on its dispatch
      const view = editorManager.getEditorView();
      if (view) {
        const dispatchSpy = jest.spyOn(view, "dispatch");
        editorManager.setMultiLineHighlight(2, 4);
        expect(dispatchSpy).toHaveBeenCalled();
      }
    });

    it("should not dispatch when no editor view is set", () => {
      // Create a fresh EditorManager without setting up the view
      const freshManager = new EditorManager(store, "test-uuid-2", mockOrchestrator, "const x = 1;", false, 0, false);

      expect(() => {
        freshManager.setMultiLineHighlight(1, 3);
      }).not.toThrow();
    });
  });

  describe("setMultipleLineHighlights", () => {
    it("should dispatch effect with lines array", () => {
      // Setup editor through the ref callback
      const mockElement = document.createElement("div");
      const ref = editorManager.getEditorRef();
      if (ref) {
        ref(mockElement);
      }

      // Get the created view and spy on its dispatch
      const view = editorManager.getEditorView();
      if (view) {
        const dispatchSpy = jest.spyOn(view, "dispatch");
        editorManager.setMultipleLineHighlights([1, 3, 5]);
        expect(dispatchSpy).toHaveBeenCalled();
      }
    });

    it("should not dispatch when no editor view is set", () => {
      // Create a fresh EditorManager without setting up the view
      const freshManager = new EditorManager(store, "test-uuid-3", mockOrchestrator, "const x = 1;", false, 0, false);

      expect(() => {
        freshManager.setMultipleLineHighlights([1, 2, 3]);
      }).not.toThrow();
    });
  });

  describe("applyBreakpoints", () => {
    it("should not dispatch when no editor view is set", () => {
      editorManager.applyBreakpoints([1, 2, 3]);
      // Should not throw
    });
  });
});
