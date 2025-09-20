import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import CodeEditor from "@/components/complex-exercise/ui/CodeEditor";
import type { Orchestrator } from "@/components/complex-exercise/lib/Orchestrator";
import { useOrchestratorStore } from "@/components/complex-exercise/lib/Orchestrator";

// Mock the CodeMirror component
jest.mock("@/components/complex-exercise/ui/codemirror/CodeMirror", () => ({
  CodeMirror: jest.fn(({ orchestrator }) => (
    <div data-testid="codemirror-editor" data-orchestrator-id={orchestrator.exerciseUuid}>
      Mocked CodeMirror Editor
    </div>
  ))
}));

// Mock the orchestrator store hook
jest.mock("@/components/complex-exercise/lib/Orchestrator", () => ({
  useOrchestratorStore: jest.fn(),
  default: jest.fn()
}));

const mockUseOrchestratorStore = useOrchestratorStore as jest.MockedFunction<typeof useOrchestratorStore>;

// Helper to create mock orchestrator
function createMockOrchestrator(exerciseUuid = "test-uuid"): Orchestrator {
  return {
    exerciseUuid,
    getStore: jest.fn(),
    setCode: jest.fn(),
    runCode: jest.fn(),
    getEditorView: jest.fn(),
    setHandleRunCodeCallback: jest.fn(),
    handleRunCode: jest.fn(),
    callOnEditorChangeCallback: jest.fn(),
    setupEditor: jest.fn(() => jest.fn())
  } as unknown as Orchestrator;
}

describe("CodeEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    mockUseOrchestratorStore.mockReturnValue({
      exerciseUuid: "test-uuid",
      code: "const x = 1;",
      output: "",
      status: "idle",
      error: null,
      currentTest: null,
      hasCodeBeenEdited: false,
      isSpotlightActive: false,
      foldedLines: [],
      defaultCode: "const x = 1;",
      readonly: false,
      shouldShowInformationWidget: false,
      underlineRange: undefined,
      highlightedLineColor: "",
      highlightedLine: 0,
      informationWidgetData: { html: "", line: 0, status: "SUCCESS" },
      breakpoints: [],
      shouldAutoRunCode: false,
      hasUnhandledError: false,
      unhandledErrorBase64: "",
      latestValueSnapshot: undefined
    });
  });

  describe("component rendering", () => {
    it("renders without crashing", () => {
      const orchestrator = createMockOrchestrator();

      render(<CodeEditor orchestrator={orchestrator} />);

      expect(screen.getByTestId("codemirror-editor")).toBeInTheDocument();
    });

    it("passes the orchestrator to CodeMirror component", () => {
      const orchestrator = createMockOrchestrator("unique-exercise-uuid");

      render(<CodeEditor orchestrator={orchestrator} />);

      const editorElement = screen.getByTestId("codemirror-editor");
      expect(editorElement).toHaveAttribute("data-orchestrator-id", "unique-exercise-uuid");
    });
  });

  describe("integration with orchestrator", () => {
    it("renders CodeMirror with the provided orchestrator instance", () => {
      const orchestrator = createMockOrchestrator();

      render(<CodeEditor orchestrator={orchestrator} />);

      // Verify CodeMirror is rendered with correct props
      expect(screen.getByTestId("codemirror-editor")).toBeInTheDocument();
      expect(screen.getByText("Mocked CodeMirror Editor")).toBeInTheDocument();
    });

    it("correctly integrates different orchestrator instances", () => {
      const orchestrator1 = createMockOrchestrator("exercise-1");
      const orchestrator2 = createMockOrchestrator("exercise-2");

      const { rerender } = render(<CodeEditor orchestrator={orchestrator1} />);
      expect(screen.getByTestId("codemirror-editor")).toHaveAttribute("data-orchestrator-id", "exercise-1");

      rerender(<CodeEditor orchestrator={orchestrator2} />);
      expect(screen.getByTestId("codemirror-editor")).toHaveAttribute("data-orchestrator-id", "exercise-2");
    });
  });
});
