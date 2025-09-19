import type Orchestrator from "../../../lib/Orchestrator";
import { testStyles } from "./styles";

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
    <div style={testStyles.container}>
      <h3 style={testStyles.title}>Multi-Line Highlighter</h3>

      <div style={testStyles.inputGroup}>
        <label style={testStyles.label}>Start Line:</label>
        <input
          type="number"
          min="1"
          placeholder="Start"
          id="multi-start"
          style={{ ...testStyles.input, width: "80px" }}
        />
        <label style={testStyles.label}>End Line:</label>
        <input type="number" min="1" placeholder="End" id="multi-end" style={{ ...testStyles.input, width: "80px" }} />
        <button
          onClick={() => {
            const startInput = document.getElementById("multi-start") as HTMLInputElement;
            const endInput = document.getElementById("multi-end") as HTMLInputElement;
            const start = parseInt(startInput.value) || 1;
            const end = parseInt(endInput.value) || 3;
            handleHighlightRange(start, end);
          }}
          style={testStyles.button}
        >
          Highlight Range
        </button>
      </div>

      <div style={testStyles.buttonGroup}>
        <button onClick={() => handleHighlightMultipleLines([1, 3, 5])} style={testStyles.button}>
          Highlight Lines 1, 3, 5
        </button>
        <button onClick={() => handleHighlightRange(2, 4)} style={testStyles.button}>
          Highlight Lines 2-4
        </button>
        <button onClick={handleClear} style={testStyles.dangerButton}>
          Clear Highlights
        </button>
      </div>

      <p style={testStyles.helpText}>
        Note: This currently highlights one line at a time. Multi-line support depends on the extension implementation.
      </p>
    </div>
  );
}
