import type Orchestrator from "../../../lib/Orchestrator";

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
    <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "4px" }}>
      <h3>Read-Only Ranges</h3>

      <div style={{ marginBottom: "10px" }}>
        <label>
          <input type="checkbox" onChange={(e) => handleSetReadOnly(e.target.checked)} />
          Make entire editor read-only
        </label>
      </div>

      <div>
        <button onClick={handleSetReadOnlyRanges}>Set ReadOnly Ranges</button>
        <button onClick={() => handleSetReadOnly(false)}>Clear All ReadOnly</button>
      </div>

      <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
        ReadOnly ranges protect specific parts of code from editing.
      </p>
    </div>
  );
}
