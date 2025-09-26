"use client";

import { keyboard, pushScope } from "@/lib/keyboard";
import { showModal } from "@/lib/modal";
import { playSound } from "@/lib/sound";
import { useSyncExternalStore } from "react";

interface PageState {
  log: string[];
  count: number;
}

let state: PageState = {
  log: [],
  count: 0
};

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function updateState(updates: Partial<PageState>) {
  state = { ...state, ...updates };
  listeners.forEach((listener) => listener());
}

function addLog(msg: string, sound?: "success" | "error") {
  updateState({
    log: [`${new Date().toLocaleTimeString()}: ${msg}`, ...state.log].slice(0, 10)
  });
  if (sound) {
    playSound(sound);
  }
}

keyboard.on(
  "cmd+k",
  () =>
    showModal("info-modal", {
      title: "🎯 Command Palette",
      content: "Command palette opened!"
    }),
  { description: "Open command palette" }
);

keyboard.on("cmd+/", () => keyboard.showHelp(), { description: "Show keyboard shortcuts" });

keyboard.on(
  "cmd+s",
  (e) => {
    e.preventDefault();
    addLog(`💾 Saved! Count is ${state.count}`, "success");
  },
  { description: "Save" }
);

keyboard.on(
  "cmd+z",
  (e) => {
    e.preventDefault();
    addLog("↩️ Undo");
  },
  { description: "Undo" }
);

keyboard.on("cmd+[", () => addLog("⬅️ Navigate back"), { description: "Go back" });
keyboard.on("cmd+]", () => addLog("➡️ Navigate forward"), { description: "Go forward" });
keyboard.on("cmd+1", () => addLog("1️⃣ Tab 1"), { description: "Tab 1" });
keyboard.on("cmd+2", () => addLog("2️⃣ Tab 2"), { description: "Tab 2" });

function openModal() {
  const removeScope = pushScope("modal");

  const unsubscribe = keyboard.on(
    "escape",
    () => {
      addLog("✅ Modal closed", "success");
      removeScope();
      unsubscribe();
    },
    { scope: "modal", description: "Close modal" }
  );

  addLog("📦 Modal opened - Press ESC to close");
}

export default function KeyboardSimplePage() {
  const { log, count } = useSyncExternalStore(subscribe, getSnapshot);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Keyboard Shortcuts - Dead Simple</h1>

      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <p className="font-semibold mb-2">✨ Just call keyboard.on() anywhere!</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            🎯 <kbd className="px-2 py-1 bg-white rounded shadow-sm">⌘K</kbd> - Command palette
          </div>
          <div>
            ❓ <kbd className="px-2 py-1 bg-white rounded shadow-sm">⌘/</kbd> - Show all shortcuts
          </div>
          <div>
            💾 <kbd className="px-2 py-1 bg-white rounded shadow-sm">⌘S</kbd> - Save
          </div>
          <div>
            ↩️ <kbd className="px-2 py-1 bg-white rounded shadow-sm">⌘Z</kbd> - Undo
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => updateState({ count: count + 1 })}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Count: {count}
        </button>

        <button onClick={openModal} className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
          Open Modal (ESC to close)
        </button>
      </div>

      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm">
          <strong>Note:</strong> Press ⌘S after incrementing count to see it captures the current value!
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h2 className="text-white font-semibold mb-3">Event Log</h2>
        {log.length === 0 ? (
          <p className="text-gray-400">Try the shortcuts above!</p>
        ) : (
          log.map((entry, i) => (
            <div key={i} className="text-green-400 font-mono text-sm">
              {entry}
            </div>
          ))
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Code Example:</h3>
        <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">{`// Just call it anywhere in your component!
keyboard.on("cmd+s", (e) => {
  e.preventDefault();
  save();
});

// That's it. No hooks, no refs, no cleanup.`}</pre>
      </div>
    </div>
  );
}
