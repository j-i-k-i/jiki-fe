import { type default as Orchestrator, useOrchestratorStore } from "./orchestrator";

interface RunButtonProps {
  orchestrator: Orchestrator;
}

export default function RunButton({ orchestrator }: RunButtonProps) {
  const { status } = useOrchestratorStore(orchestrator);

  const handleRunCode = () => {
    void orchestrator.runCode();
  };

  return (
    <button
      onClick={handleRunCode}
      disabled={status === "running"}
      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {status === "running" ? "Running..." : "Run Code"}
    </button>
  );
}
