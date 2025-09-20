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
  EditorView: jest.fn().mockImplementation(() => ({
    state: { doc: { toString: jest.fn().mockReturnValue("") } },
    dispatch: jest.fn(),
    focus: jest.fn()
  }))
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

  describe("setEditorView and getEditorView", () => {
    it("should set and get the editor view", () => {
      const mockView = {} as EditorView;

      expect(editorManager.getEditorView()).toBeNull();

      editorManager.setEditorView(mockView);
      expect(editorManager.getEditorView()).toBe(mockView);

      editorManager.setEditorView(null);
      expect(editorManager.getEditorView()).toBeNull();
    });
  });

  describe("setEditorAPI", () => {
    it("should store the editor API", () => {
      const mockAPI = { getValue: jest.fn(), setValue: jest.fn() };

      // Just verify it doesn't throw - the API is private now
      expect(() => editorManager.setEditorAPI(mockAPI)).not.toThrow();
    });
  });

  describe("getCurrentEditorValue", () => {
    it("should return undefined when no handler is set", () => {
      expect(editorManager.getCurrentEditorValue()).toBeUndefined();
    });

    it("should get value from handler and update snapshot", () => {
      const mockHandler = { getValue: jest.fn().mockReturnValue("new code") };
      editorManager.setEditorAPI(mockHandler);

      const value = editorManager.getCurrentEditorValue();

      expect(value).toBe("new code");
      expect(mockHandler.getValue).toHaveBeenCalled();
      expect(store.getState().latestValueSnapshot).toBe("new code");
    });
  });

  describe("setOnEditorChangeCallback and callOnEditorChangeCallback", () => {
    it("should set and call the editor change callback", () => {
      const mockCallback = jest.fn();
      const mockView = {} as EditorView;

      editorManager.setOnEditorChangeCallback(mockCallback);
      editorManager.callOnEditorChangeCallback(mockView);

      expect(mockCallback).toHaveBeenCalledWith(mockView);
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
      const mockDispatch = jest.fn();
      const mockView = { dispatch: mockDispatch } as any;
      editorManager.setEditorView(mockView);

      editorManager.setMultiLineHighlight(0, 0);

      expect(mockDispatch).toHaveBeenCalled();
    });

    it("should dispatch effect with line array for valid range", () => {
      const mockDispatch = jest.fn();
      const mockView = { dispatch: mockDispatch } as any;
      editorManager.setEditorView(mockView);

      editorManager.setMultiLineHighlight(2, 4);

      expect(mockDispatch).toHaveBeenCalled();
    });

    it("should not dispatch when no editor view is set", () => {
      editorManager.setMultiLineHighlight(1, 3);
      // Should not throw
    });
  });

  describe("setMultipleLineHighlights", () => {
    it("should dispatch effect with lines array", () => {
      const mockDispatch = jest.fn();
      const mockView = { dispatch: mockDispatch } as any;
      editorManager.setEditorView(mockView);

      editorManager.setMultipleLineHighlights([1, 3, 5]);

      expect(mockDispatch).toHaveBeenCalled();
    });

    it("should not dispatch when no editor view is set", () => {
      editorManager.setMultipleLineHighlights([1, 2, 3]);
      // Should not throw
    });
  });

  describe("applyBreakpoints", () => {
    it("should not dispatch when no editor view is set", () => {
      editorManager.applyBreakpoints([1, 2, 3]);
      // Should not throw
    });
  });
});
