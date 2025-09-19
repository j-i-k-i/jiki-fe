import type Orchestrator from "../../../lib/Orchestrator";
import { testStyles } from "./styles";

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
    <div style={testStyles.container}>
      <h3 style={testStyles.title}>Information Widget</h3>

      <div style={testStyles.inputGroup}>
        <label style={testStyles.label}>Line Number:</label>
        <input type="number" min="1" placeholder="Line number" id="widget-line" style={testStyles.input} />
        <label style={testStyles.label}>Status:</label>
        <select id="widget-status" style={testStyles.select}>
          <option value="SUCCESS">Success</option>
          <option value="ERROR">Error</option>
        </select>
      </div>

      <div style={testStyles.inputGroup}>
        <label style={testStyles.label}>Message:</label>
        <input
          type="text"
          placeholder="Widget message"
          id="widget-message"
          style={{ ...testStyles.input, width: "200px" }}
        />
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
          style={testStyles.button}
        >
          Show Widget
        </button>
      </div>

      <div style={testStyles.buttonGroup}>
        <button onClick={() => handleShowWidget(2, "SUCCESS", "✅ Success message")} style={testStyles.button}>
          Success on Line 2
        </button>
        <button onClick={() => handleShowWidget(4, "ERROR", "❌ Error message")} style={testStyles.button}>
          Error on Line 4
        </button>
        <button onClick={handleHideWidget} style={testStyles.secondaryButton}>
          Hide Widget
        </button>
      </div>
    </div>
  );
}
