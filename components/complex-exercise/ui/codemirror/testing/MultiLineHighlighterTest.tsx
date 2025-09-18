import type Orchestrator from "../../../lib/Orchestrator";

interface MultiLineHighlighterTestProps {
  orchestrator: Orchestrator;
}

export default function MultiLineHighlighterTest({ orchestrator }: MultiLineHighlighterTestProps) {
  const handleHighlightMultipleLines = (lines: number[]) => {
    // Apply highlighting to multiple lines
    lines.forEach((line) => {
      orchestrator.setHighlightedLine(line);
    });
  };

  const handleHighlightRange = (startLine: number, endLine: number) => {
    const lines = [];
    for (let i = startLine; i <= endLine; i++) {
      lines.push(i);
    }
    handleHighlightMultipleLines(lines);
  };

  const handleClear = () => {
    orchestrator.setHighlightedLine(0);
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "4px" }}>
      <h3>Multi-Line Highlighter</h3>

      <div style={{ marginBottom: "10px" }}>
        <label>Start Line: </label>
        <input type="number" min="1" placeholder="Start" id="multi-start" style={{ width: "60px" }} />
        <label style={{ marginLeft: "10px" }}>End Line: </label>
        <input type="number" min="1" placeholder="End" id="multi-end" style={{ width: "60px" }} />
        <button
          onClick={() => {
            const startInput = document.getElementById("multi-start") as HTMLInputElement;
            const endInput = document.getElementById("multi-end") as HTMLInputElement;
            const start = parseInt(startInput.value) || 1;
            const end = parseInt(endInput.value) || 3;
            handleHighlightRange(start, end);
          }}
          style={{ marginLeft: "10px" }}
        >
          Highlight Range
        </button>
      </div>

      <div>
        <button onClick={() => handleHighlightMultipleLines([1, 3, 5])}>Highlight Lines 1, 3, 5</button>
        <button onClick={() => handleHighlightRange(2, 4)}>Highlight Lines 2-4</button>
        <button onClick={handleClear}>Clear Highlights</button>
      </div>

      <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
        Note: This currently highlights one line at a time. Multi-line support depends on the extension implementation.
      </p>
    </div>
  );
}
