import { showModal } from "../modal";
import type { KeyboardHandler, RegisteredShortcut, ShortcutOptions } from "./types";
import { formatShortcutForDisplay, getKeyComboFromEvent, parseShortcut } from "./utils";

class KeyboardManager {
  private readonly listeners = new Map<string, Map<symbol, RegisteredShortcut>>();
  private readonly scopes = new Set<string>(["global"]);
  private isEnabled = true;
  private sequenceBuffer: string[] = [];
  private sequenceTimer: NodeJS.Timeout | null = null;
  private readonly SEQUENCE_TIMEOUT = 1000; // 1 second for chord sequences

  constructor() {
    if (typeof window !== "undefined") {
      // Use capture phase to intercept before other handlers
      window.addEventListener("keydown", this.handleKeyDown, true);
    }
  }

  /**
   * Register a keyboard shortcut
   * @param keys - Shortcut keys (e.g., "cmd+k", "ctrl+shift+p", "g g" for chords)
   * @param handler - Function to call when shortcut is triggered
   * @param options - Additional options for the shortcut
   * @returns Unsubscribe function
   */
  on(keys: string, handler: KeyboardHandler, options: ShortcutOptions = {}): () => void {
    const id = Symbol("shortcut");
    const scope = options.scope || "global";
    const normalizedKeys = this.normalizeKeys(keys);

    if (!this.listeners.has(normalizedKeys)) {
      this.listeners.set(normalizedKeys, new Map());
    }

    this.listeners.get(normalizedKeys)!.set(id, {
      keys,
      handler,
      options: { ...options, scope }
    });

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.debug(`[Keyboard] Registered: ${keys}${options.description ? ` - ${options.description}` : ""}`);
    }

    // Return unsubscribe function
    return () => this.off(normalizedKeys, id);
  }

  /**
   * Unregister a specific shortcut handler
   */
  private off(normalizedKeys: string, id: symbol): void {
    const handlers = this.listeners.get(normalizedKeys);
    if (handlers) {
      handlers.delete(id);
      if (handlers.size === 0) {
        this.listeners.delete(normalizedKeys);
      }
    }
  }

  /**
   * Push a new scope onto the stack
   * @param scope - Scope name to activate
   * @returns Function to remove the scope
   */
  pushScope(scope: string): () => void {
    this.scopes.add(scope);
    return () => this.popScope(scope);
  }

  /**
   * Remove a scope from the stack
   */
  private popScope(scope: string): void {
    this.scopes.delete(scope);
  }

  /**
   * Check if a scope is currently active
   */
  isScopeActive(scope: string): boolean {
    return this.scopes.has(scope);
  }

  /**
   * Enable or disable all keyboard shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get all registered shortcuts (for help display)
   */
  getShortcuts(): RegisteredShortcut[] {
    const shortcuts: RegisteredShortcut[] = [];

    this.listeners.forEach((handlers) => {
      handlers.forEach((shortcut) => {
        if (this.scopes.has(shortcut.options.scope || "global")) {
          shortcuts.push(shortcut);
        }
      });
    });

    return shortcuts;
  }

  /**
   * Show keyboard shortcuts help modal
   */
  showHelp(): void {
    const shortcuts = this.getShortcuts()
      .filter((s) => s.options.description)
      .sort((a, b) => {
        // Sort by scope first, then by key
        const scopeA = a.options.scope || "global";
        const scopeB = b.options.scope || "global";
        if (scopeA !== scopeB) {
          return scopeA.localeCompare(scopeB);
        }
        return a.keys.localeCompare(b.keys);
      });

    const grouped = shortcuts.reduce(
      (acc, shortcut) => {
        const scope = shortcut.options.scope || "global";
        // ESLint doesn't realize acc[scope] can be defined from previous iterations
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!acc[scope]) {
          acc[scope] = [];
        }
        acc[scope].push(shortcut);
        return acc;
      },
      {} as Record<string, RegisteredShortcut[]>
    );

    // Format as HTML for modal
    const content = Object.entries(grouped)
      .map(
        ([scope, items]) => `
        <div class="mb-4">
          <h3 class="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-2">
            ${scope === "global" ? "Global" : scope}
          </h3>
          <div class="space-y-1">
            ${items
              .map(
                (item) => `
              <div class="flex justify-between items-center py-1">
                <span class="text-sm">${item.options.description}</span>
                <kbd class="ml-4 px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded">
                  ${formatShortcutForDisplay(item.keys)}
                </kbd>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `
      )
      .join("");

    showModal("info-modal", {
      title: "Keyboard Shortcuts",
      content,
      buttonText: "Got it"
    });
  }

  /**
   * Normalize shortcut keys for consistent lookup
   */
  private normalizeKeys(keys: string): string {
    // Check if this is a chord sequence (e.g., "g g" or "ctrl+k ctrl+c")
    if (keys.includes(" ") && !keys.includes("+")) {
      // Simple chord like "g g"
      return keys.toLowerCase();
    }

    // For modifier-based shortcuts, normalize
    const combo = parseShortcut(keys);
    const parts: string[] = [];

    if (combo.ctrlKey) {
      parts.push("ctrl");
    }
    if (combo.metaKey) {
      parts.push("cmd");
    }
    if (combo.altKey) {
      parts.push("alt");
    }
    if (combo.shiftKey) {
      parts.push("shift");
    }
    if (combo.key) {
      parts.push(combo.key.toLowerCase());
    }

    return parts.join("+");
  }

  /**
   * Handle keyboard events
   */
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.isEnabled) {
      return;
    }

    // Skip if user is typing in an input/textarea (unless it's a global shortcut)
    const target = event.target as HTMLElement;
    const isTyping = target.matches("input, textarea, [contenteditable=true]");

    // Build the key combo from the event
    const keyCombo = getKeyComboFromEvent(event);

    // Check for chord sequences
    this.updateSequenceBuffer(keyCombo);

    // Try to find handlers for current key combo
    let handlers = this.listeners.get(keyCombo);

    // Also check the sequence buffer for chord matches
    if (!handlers && this.sequenceBuffer.length > 0) {
      const sequence = this.sequenceBuffer.join(" ");
      handlers = this.listeners.get(sequence);

      if (handlers) {
        // Clear buffer after successful chord match
        this.clearSequenceBuffer();
      }
    }

    if (!handlers) {
      return;
    }

    // Execute all matching handlers
    handlers.forEach((shortcut) => {
      // Check if scope is active
      if (!this.scopes.has(shortcut.options.scope || "global")) {
        return;
      }

      // Skip if typing and not explicitly enabled for inputs
      if (isTyping && !shortcut.options.enabled) {
        return;
      }

      // Check if shortcut is enabled
      if (shortcut.options.enabled === false) {
        return;
      }

      // Prevent default if requested
      if (shortcut.options.preventDefault !== false) {
        event.preventDefault();
      }

      if (shortcut.options.stopPropagation) {
        event.stopPropagation();
      }

      // Call the handler
      try {
        shortcut.handler(event);
      } catch (error) {
        console.error(`[Keyboard] Error in handler for ${shortcut.keys}:`, error);
      }
    });
  };

  /**
   * Update the sequence buffer for chord detection
   */
  private updateSequenceBuffer(keyCombo: string): void {
    // Clear existing timer
    if (this.sequenceTimer) {
      clearTimeout(this.sequenceTimer);
    }

    // Add to buffer only if it's a simple key (no modifiers except shift)
    const hasComplexModifiers = keyCombo.includes("ctrl") || keyCombo.includes("cmd") || keyCombo.includes("alt");

    if (!hasComplexModifiers) {
      this.sequenceBuffer.push(keyCombo);

      // Keep only last few keys
      if (this.sequenceBuffer.length > 4) {
        this.sequenceBuffer.shift();
      }

      // Set timer to clear buffer
      this.sequenceTimer = setTimeout(() => {
        this.clearSequenceBuffer();
      }, this.SEQUENCE_TIMEOUT);
    } else {
      // Complex modifier pressed, clear the buffer
      this.clearSequenceBuffer();
    }
  }

  /**
   * Clear the sequence buffer
   */
  private clearSequenceBuffer(): void {
    this.sequenceBuffer = [];
    if (this.sequenceTimer) {
      clearTimeout(this.sequenceTimer);
      this.sequenceTimer = null;
    }
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.handleKeyDown, true);
    }
    this.listeners.clear();
    this.scopes.clear();
    this.clearSequenceBuffer();
  }
}

// Create singleton instance
export const keyboard = new KeyboardManager();

// Convenience exports
export const on = keyboard.on.bind(keyboard);
export const pushScope = keyboard.pushScope.bind(keyboard);
export const setEnabled = keyboard.setEnabled.bind(keyboard);
export const showKeyboardHelp = keyboard.showHelp.bind(keyboard);

// Export types
export type { KeyboardHandler, RegisteredShortcut, ShortcutOptions } from "./types";
