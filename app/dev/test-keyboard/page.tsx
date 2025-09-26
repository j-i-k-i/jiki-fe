"use client";

import { keyboard } from "@/lib/keyboard";
import { showModal } from "@/lib/modal";
import { useRef, useState } from "react";

// Register some global shortcuts at module level
// These persist for the entire app lifetime
keyboard.on("cmd+h", () => keyboard.showHelp(), {
  description: "Show keyboard shortcuts help"
});

keyboard.on(
  "cmd+k",
  () => {
    showModal("info-modal", {
      title: "Command Palette",
      content: "This would open a command palette!"
    });
  },
  { description: "Open command palette" }
);

export default function TestKeyboardPage() {
  const [log, setLog] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [scopedActive, setScopedActive] = useState(false);
  const cleanupRef = useRef<(() => void)[]>([]);
  const scopeCleanupRef = useRef<(() => void) | null>(null);

  const addLog = (message: string) => {
    setLog((prev) => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev].slice(0, 10));
  };

  // Register component-level shortcuts when recording starts
  const startRecording = () => {
    if (isRecording) {
      return;
    }

    setIsRecording(true);
    addLog("Started recording keyboard shortcuts");

    // Register shortcuts that only work while recording
    cleanupRef.current = [
      keyboard.on(
        "escape",
        () => {
          addLog("Escape pressed!");
          stopRecording();
        },
        { description: "Stop recording" }
      ),

      keyboard.on(
        "space",
        (e) => {
          e.preventDefault();
          addLog("Space pressed!");
        },
        { description: "Log space press" }
      ),

      keyboard.on(
        "cmd+s",
        (e) => {
          e.preventDefault();
          addLog("Save shortcut triggered!");
        },
        { description: "Save (prevented default)" }
      ),

      keyboard.on("up", () => addLog("Up arrow pressed"), { description: "Navigate up" }),
      keyboard.on("down", () => addLog("Down arrow pressed"), { description: "Navigate down" }),
      keyboard.on("left", () => addLog("Left arrow pressed"), { description: "Navigate left" }),
      keyboard.on("right", () => addLog("Right arrow pressed"), { description: "Navigate right" }),

      // Test chord sequences
      keyboard.on(
        "g g",
        () => {
          addLog("Double G pressed! (Vim-style)");
        },
        { description: "Go to top (Vim-style)" }
      ),

      keyboard.on(
        "shift+g shift+g",
        () => {
          addLog("Double Shift+G pressed!");
        },
        { description: "Go to bottom (Vim-style)" }
      )
    ];
  };

  const stopRecording = () => {
    if (!isRecording) {
      return;
    }

    setIsRecording(false);
    addLog("Stopped recording keyboard shortcuts");

    // Clean up all registered shortcuts
    cleanupRef.current.forEach((cleanup) => cleanup());
    cleanupRef.current = [];
  };

  const toggleScope = () => {
    if (scopedActive) {
      // Remove scope and its shortcuts
      scopeCleanupRef.current?.();
      scopeCleanupRef.current = null;
      setScopedActive(false);
      addLog("Deactivated modal scope");
    } else {
      // Add scope with its shortcuts
      const removeScope = keyboard.pushScope("modal");

      // Register modal-specific shortcuts
      const cleanup1 = keyboard.on(
        "escape",
        () => {
          addLog("Modal: Escape pressed (would close modal)");
          toggleScope();
        },
        {
          scope: "modal",
          description: "Close modal"
        }
      );

      const cleanup2 = keyboard.on(
        "enter",
        () => {
          addLog("Modal: Enter pressed (would confirm)");
        },
        {
          scope: "modal",
          description: "Confirm modal action"
        }
      );

      const cleanup3 = keyboard.on(
        "tab",
        (e) => {
          e.preventDefault();
          addLog("Modal: Tab pressed (focus trap)");
        },
        {
          scope: "modal",
          description: "Navigate modal elements"
        }
      );

      scopeCleanupRef.current = () => {
        removeScope();
        cleanup1();
        cleanup2();
        cleanup3();
      };

      setScopedActive(true);
      addLog("Activated modal scope");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Keyboard Shortcuts Test</h1>

      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Global Shortcuts (Always Active)</h2>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>
            <kbd className="px-2 py-1 bg-white rounded shadow-sm">?</kbd> - Show keyboard help
          </li>
          <li>
            <kbd className="px-2 py-1 bg-white rounded shadow-sm">⌘K</kbd> - Open command palette
          </li>
        </ul>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isRecording ? "bg-red-500 hover:bg-red-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {isRecording ? "Stop Recording" : "Start Recording Shortcuts"}
          </button>

          <button
            onClick={toggleScope}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              scopedActive ? "bg-purple-500 hover:bg-purple-600 text-white" : "bg-gray-500 hover:bg-gray-600 text-white"
            }`}
          >
            {scopedActive ? "Deactivate Modal Scope" : "Activate Modal Scope"}
          </button>

          <button
            onClick={() => setLog([])}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
          >
            Clear Log
          </button>
        </div>

        {isRecording && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Recording Active!</h3>
            <p className="text-sm text-green-700 mb-2">Try these shortcuts:</p>
            <ul className="text-sm text-green-700 space-y-1">
              <li>
                • <kbd>Escape</kbd> - Stop recording
              </li>
              <li>
                • <kbd>Space</kbd> - Log space press
              </li>
              <li>
                • <kbd>⌘S</kbd> - Save (prevented)
              </li>
              <li>
                • <kbd>Arrow Keys</kbd> - Navigation
              </li>
              <li>
                • <kbd>G G</kbd> - Vim-style chord (press G twice quickly)
              </li>
              <li>
                • <kbd>Shift+G Shift+G</kbd> - Another chord
              </li>
            </ul>
          </div>
        )}

        {scopedActive && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">Modal Scope Active!</h3>
            <p className="text-sm text-purple-700 mb-2">Modal-specific shortcuts:</p>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>
                • <kbd>Escape</kbd> - Close modal (deactivates scope)
              </li>
              <li>
                • <kbd>Enter</kbd> - Confirm action
              </li>
              <li>
                • <kbd>Tab</kbd> - Navigate (trapped)
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test in Input Field</h2>
        <input
          type="text"
          placeholder="Type here - shortcuts are disabled while typing"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-600 mt-2">Most shortcuts are automatically disabled when typing in inputs</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-white mb-3">Event Log</h2>
        {log.length === 0 ? (
          <p className="text-gray-400 text-sm">No events yet. Try the shortcuts above!</p>
        ) : (
          <div className="space-y-1">
            {log.map((entry, i) => (
              <div key={i} className="text-green-400 text-sm font-mono">
                {entry}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
