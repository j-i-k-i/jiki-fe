"use client";

import { type ReactNode } from "react";
import OrchestratorContext from "./OrchestratorContext";
import type Orchestrator from "./Orchestrator";

interface OrchestratorProviderProps {
  orchestrator: Orchestrator;
  children: ReactNode;
}

export default function OrchestratorProvider({ orchestrator, children }: OrchestratorProviderProps) {
  return <OrchestratorContext.Provider value={orchestrator}>{children}</OrchestratorContext.Provider>;
}
