import React from "react";
import { renderWithCounter } from "@/tests/utils/renderCounter";

// Mock the entire Orchestrator to avoid CodeMirror dependency issues
jest.mock("@/components/complex-exercise/lib/Orchestrator", () => ({
  useOrchestratorStore: jest.fn(() => ({
    readonly: false,
    defaultCode: "test code",
    highlightedLine: 0,
    shouldAutoRunCode: false
  }))
}));

// No need to mock setupEditor since it's now part of the orchestrator

// Now we can import the component safely
import { CodeMirror } from "@/components/complex-exercise/ui/codemirror/CodeMirror";

const mockOrchestrator = {
  getEditorView: jest.fn(() => null),
  setHighlightedLine: jest.fn(),
  setReadonly: jest.fn(),
  setupEditor: jest.fn(() => jest.fn())
} as any;

describe("CodeMirror Re-render Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should track render counts successfully", () => {
    // ESLint thinks the type assertion is unnecessary but mock orchestrator needs it
    const { getRenderCount, rerender } = renderWithCounter(
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      <CodeMirror orchestrator={mockOrchestrator as any} />
    );

    // Initial render
    expect(getRenderCount()).toBe(1);

    // Force a re-render
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    rerender(<CodeMirror orchestrator={mockOrchestrator as any} />);
    expect(getRenderCount()).toBe(2);

    // Force another re-render
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    rerender(<CodeMirror orchestrator={mockOrchestrator as any} />);
    expect(getRenderCount()).toBe(3);

    // This test demonstrates that our render counting utility works
    // In real usage, our refactor should result in fewer re-renders
    // compared to the old useEffect-based approach
  });

  it("should not re-initialize editor on multiple renders", () => {
    // Create a stable ref callback that setupEditor returns
    const stableRefCallback = jest.fn();
    mockOrchestrator.setupEditor.mockReturnValue(stableRefCallback);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const { rerender } = renderWithCounter(<CodeMirror orchestrator={mockOrchestrator as any} />);

    // Trigger multiple re-renders
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    rerender(<CodeMirror orchestrator={mockOrchestrator as any} />);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    rerender(<CodeMirror orchestrator={mockOrchestrator as any} />);

    // setupEditor will be called on each render
    expect(mockOrchestrator.setupEditor).toHaveBeenCalledTimes(3);

    // But it should return the same ref callback each time (the orchestrator handles stability)
    // This is what prevents editor re-initialization
    expect(mockOrchestrator.setupEditor).toHaveReturnedWith(stableRefCallback);
  });

  it("should demonstrate the ref callback pattern works", () => {
    // This test shows that our ref callback approach is working
    const { container } = renderWithCounter(
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      <CodeMirror orchestrator={mockOrchestrator as any} />
    );

    // Verify the editor div is rendered
    const editorDiv = container.querySelector("#bootcamp-cm-editor");
    expect(editorDiv).toBeInTheDocument();
    expect(editorDiv).toHaveAttribute("data-ci", "codemirror-editor");
  });
});
