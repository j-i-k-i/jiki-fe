import type Orchestrator from "../../../lib/Orchestrator";

interface LineHighlighterTestProps {
  orchestrator: Orchestrator;
}

export default function LineHighlighterTest({ orchestrator }: LineHighlighterTestProps) {
  const handleHighlightLine = (lineNumber: number) => {
    orchestrator.setHighlightedLine(lineNumber);
  };

  const handleSetColor = (color: string) => {
    orchestrator.setHighlightedLineColor(color);
  };

  const handleClear = () => {
    orchestrator.setHighlightedLine(0);
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "4px" }}>
      <h3>Line Highlighter</h3>

      <div style={{ marginBottom: "10px" }}>
        <label>Line Number: </label>
        <input
          type="number"
          min="1"
          max="10"
          onChange={(e) => handleHighlightLine(parseInt(e.target.value) || 1)}
          placeholder="Enter line number"
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Color: </label>
        <select onChange={(e) => handleSetColor(e.target.value)}>
          <option value="#ffeb3b">Yellow</option>
          <option value="#f44336">Red</option>
          <option value="#4caf50">Green</option>
          <option value="#2196f3">Blue</option>
          <option value="#ff9800">Orange</option>
        </select>
      </div>

      <div>
        <button onClick={() => handleHighlightLine(1)}>Highlight Line 1</button>
        <button onClick={() => handleHighlightLine(3)}>Highlight Line 3</button>
        <button onClick={handleClear}>Clear Highlight</button>
      </div>
    </div>
  );
}
