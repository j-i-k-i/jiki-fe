import type Orchestrator from "../../../lib/Orchestrator";

interface InformationWidgetTestProps {
  orchestrator: Orchestrator;
}

export default function InformationWidgetTest({ orchestrator }: InformationWidgetTestProps) {
  const handleShowWidget = (line: number, status: "SUCCESS" | "ERROR", html: string) => {
    orchestrator.setInformationWidgetData({ line, status, html });
    orchestrator.setShouldShowInformationWidget(true);
  };

  const handleHideWidget = () => {
    orchestrator.setShouldShowInformationWidget(false);
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "4px" }}>
      <h3>Information Widget</h3>

      <div style={{ marginBottom: "10px" }}>
        <label>Line Number: </label>
        <input type="number" min="1" placeholder="Line number" id="widget-line" />
        <label style={{ marginLeft: "10px" }}>Status: </label>
        <select id="widget-status">
          <option value="SUCCESS">Success</option>
          <option value="ERROR">Error</option>
        </select>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Message: </label>
        <input type="text" placeholder="Widget message" id="widget-message" style={{ width: "200px" }} />
        <button
          onClick={() => {
            const lineInput = document.getElementById("widget-line") as HTMLInputElement;
            const statusSelect = document.getElementById("widget-status") as HTMLSelectElement;
            const messageInput = document.getElementById("widget-message") as HTMLInputElement;

            const line = parseInt(lineInput.value) || 1;
            const status = statusSelect.value as "SUCCESS" | "ERROR";
            const html = messageInput.value || "Test message";

            handleShowWidget(line, status, html);
          }}
          style={{ marginLeft: "10px" }}
        >
          Show Widget
        </button>
      </div>

      <div>
        <button onClick={() => handleShowWidget(2, "SUCCESS", "✅ Success message")}>Success on Line 2</button>
        <button onClick={() => handleShowWidget(4, "ERROR", "❌ Error message")}>Error on Line 4</button>
        <button onClick={handleHideWidget}>Hide Widget</button>
      </div>
    </div>
  );
}
