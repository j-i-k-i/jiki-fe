import React from "react";
import { useOrchestratorStore } from "@/components/complex-exercise/lib/Orchestrator";
import type Orchestrator from "@/components/complex-exercise/lib/Orchestrator";

interface FrameInfoProps {
  orchestrator: Orchestrator;
}

export function FrameInfo({ orchestrator }: FrameInfoProps) {
  const { currentTest, foldedLines } = useOrchestratorStore(orchestrator);

  return (
    <div className="mt-4 p-4 border rounded">
      <h2 className="font-bold mb-2">Current Frame Info:</h2>
      <p data-testid="current-frame">
        Frame: {currentTest?.currentFrame ? currentTest.currentFrame.description : "None"}
      </p>
      <p data-testid="frame-line">Line: {currentTest?.currentFrame?.line || 0}</p>
      <p data-testid="frame-time">Timeline Time: {currentTest?.timelineTime || 0}</p>
      <p data-testid="folded-lines">Folded Lines: {foldedLines.join(", ") || "None"}</p>
    </div>
  );
}
