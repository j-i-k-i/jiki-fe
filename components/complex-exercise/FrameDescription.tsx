import React from "react";
import type { Orchestrator } from "./orchestrator";
import { useOrchestratorStore } from "./orchestrator";

interface FrameDescriptionProps {
  orchestrator: Orchestrator;
}

export default function FrameDescription({ orchestrator }: FrameDescriptionProps) {
  const { currentTest } = useOrchestratorStore(orchestrator);

  // Get the current frame - this will automatically update when timelineValue changes
  const currentFrame = orchestrator.getNearestCurrentFrame();

  if (!currentTest || !currentFrame) {
    return (
      <div className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-500 rounded min-h-[2.5rem]">
        <span className="text-sm">No frame selected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded min-h-[2.5rem]">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Line {currentFrame.line}</span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded ${
              currentFrame.status === "SUCCESS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {currentFrame.status}
          </span>
        </div>
        <span className="text-sm text-gray-700">{currentFrame.description}</span>
      </div>
    </div>
  );
}
