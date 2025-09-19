import type Orchestrator from "../../../lib/Orchestrator";
import { testStyles } from "./styles";

interface ReadOnlyRangesTestProps {
  orchestrator: Orchestrator;
}

export default function ReadOnlyRangesTest({ orchestrator }: ReadOnlyRangesTestProps) {
  const handleSetReadOnly = (readonly: boolean) => {
    orchestrator.setReadonly(readonly);
  };

  const handleSetReadOnlyRanges = () => {
    // Apply readonly ranges to parts of the code
    const editorView = orchestrator.getEditorView();
    if (editorView) {
      const doc = editorView.state.doc;
      const ranges = [
        { from: 0, to: 20 }, // First 20 characters
        { from: doc.length - 20, to: doc.length } // Last 20 characters
      ];

      // Use the orchestrator's method to apply readonly ranges
      editorView.dispatch({
        effects: (editorView.state.field as any).updateReadOnlyRangesEffect?.of(ranges)
      });
    }
  };

  return (
    <div style={testStyles.container}>
      <h3 style={testStyles.title}>Read-Only Ranges</h3>

      <div style={testStyles.inputGroup}>
        <label style={testStyles.label}>
          <input type="checkbox" onChange={(e) => handleSetReadOnly(e.target.checked)} style={testStyles.checkbox} />
          Make entire editor read-only
        </label>
      </div>

      <div style={testStyles.buttonGroup}>
        <button onClick={handleSetReadOnlyRanges} style={testStyles.button}>
          Set ReadOnly Ranges
        </button>
        <button onClick={() => handleSetReadOnly(false)} style={testStyles.dangerButton}>
          Clear All ReadOnly
        </button>
      </div>

      <p style={testStyles.helpText}>ReadOnly ranges protect specific parts of code from editing.</p>
    </div>
  );
}
