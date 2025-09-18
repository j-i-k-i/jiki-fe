import type Orchestrator from "../../../lib/Orchestrator";

interface UnderlineRangeTestProps {
  orchestrator: Orchestrator;
}

export default function UnderlineRangeTest({ orchestrator }: UnderlineRangeTestProps) {
  const handleUnderlineRange = (from: number, to: number) => {
    orchestrator.setUnderlineRange({ from, to });
  };

  const handleClear = () => {
    orchestrator.setUnderlineRange(undefined);
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "4px" }}>
      <h3>Underline Range</h3>

      <div style={{ marginBottom: "10px" }}>
        <label>From Position: </label>
        <input type="number" min="0" placeholder="Start position" id="underline-from" />
        <label style={{ marginLeft: "10px" }}>To Position: </label>
        <input type="number" min="0" placeholder="End position" id="underline-to" />
        <button
          onClick={() => {
            const fromInput = document.getElementById("underline-from") as HTMLInputElement;
            const toInput = document.getElementById("underline-to") as HTMLInputElement;
            const from = parseInt(fromInput.value) || 0;
            const to = parseInt(toInput.value) || 10;
            handleUnderlineRange(from, to);
          }}
          style={{ marginLeft: "10px" }}
        >
          Apply
        </button>
      </div>

      <div>
        <button onClick={() => handleUnderlineRange(0, 10)}>Underline 0-10</button>
        <button onClick={() => handleUnderlineRange(20, 30)}>Underline 20-30</button>
        <button onClick={handleClear}>Clear Underline</button>
      </div>
    </div>
  );
}
