"use client";
import { useState } from "react";
import type Orchestrator from "../../../lib/Orchestrator";
import { useOrchestratorStore } from "../../../lib/Orchestrator";

interface BreakpointTestProps {
  orchestrator: Orchestrator;
}

export default function BreakpointTest({ orchestrator }: BreakpointTestProps) {
  const { breakpoints } = useOrchestratorStore(orchestrator);
  const [customBreakpoints, setCustomBreakpoints] = useState<string>("");

  const handleSetBreakpoints = () => {
    const lines = customBreakpoints
      .split(",")
      .map((line) => parseInt(line.trim()))
      .filter((line) => !isNaN(line));

    orchestrator.setBreakpoints(lines);
  };

  const handleClearBreakpoints = () => {
    orchestrator.setBreakpoints([]);
    setCustomBreakpoints("");
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "4px" }}>
      <h3>Breakpoints</h3>

      <div style={{ marginBottom: "10px" }}>
        <label>Current breakpoints: </label>
        <span style={{ fontWeight: "bold" }}>{breakpoints.length > 0 ? breakpoints.join(", ") : "None"}</span>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Set breakpoints (comma-separated): </label>
        <input
          type="text"
          value={customBreakpoints}
          onChange={(e) => setCustomBreakpoints(e.target.value)}
          placeholder="1, 3, 5"
          style={{ width: "100px" }}
        />
        <button onClick={handleSetBreakpoints} style={{ marginLeft: "10px" }}>
          Apply
        </button>
      </div>

      <div>
        <button onClick={() => orchestrator.setBreakpoints([1, 3])}>Set Lines 1, 3</button>
        <button onClick={() => orchestrator.setBreakpoints([2, 4, 6])}>Set Lines 2, 4, 6</button>
        <button onClick={handleClearBreakpoints}>Clear All</button>
      </div>

      <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
        Click on line numbers in the editor to toggle breakpoints.
      </p>
    </div>
  );
}
