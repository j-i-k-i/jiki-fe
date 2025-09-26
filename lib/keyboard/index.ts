import React from "react";
import { showModal } from "../modal";
import type { KeyboardHandler, ShortcutOptions } from "./types";
import { parseShortcut, getKeyComboFromEvent } from "./utils";
import { ScopeManager } from "./ScopeManager";
import { SequenceBuffer } from "./SequenceBuffer";
import { ShortcutRegistry } from "./ShortcutRegistry";
import { KeyboardHelpModal } from "./KeyboardHelpModal";

class KeyboardManager {
  private readonly registry = new ShortcutRegistry();
  private readonly scopes = new ScopeManager();
  private readonly sequence = new SequenceBuffer();
  private isEnabled = true;

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
    const scope = options.scope || "global";
    const normalizedKeys = this.normalizeKeys(keys);

    const id = this.registry.register(normalizedKeys, keys, handler, { ...options, scope });

    // Return unsubscribe function
    return () => this.registry.unregister(normalizedKeys, id);
  }

  /**
   * Push a new scope onto the stack
   * @param scope - Scope name to activate
   * @returns Function to remove the scope
   */
  pushScope(scope: string): () => void {
    return this.scopes.push(scope);
  }

  /**
   * Check if a scope is currently active
   */
  isScopeActive(scope: string): boolean {
    return this.scopes.isActive(scope);
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
  getShortcuts() {
    return this.registry.getAllShortcuts(this.scopes.getActiveScopes());
  }

  /**
   * Show keyboard shortcuts help modal
   */
  showHelp(): void {
    const shortcuts = this.getShortcuts();

    showModal("info-modal", {
      title: "Keyboard Shortcuts",
      content: React.createElement(KeyboardHelpModal, { shortcuts }),
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

    // Update sequence buffer and check for chord sequences
    this.sequence.add(keyCombo);

    // Try to find handlers for current key combo
    let handlers = this.registry.getHandlers(keyCombo);

    // Also check the sequence buffer for chord matches
    if (!handlers && this.sequence.hasSequence()) {
      const sequence = this.sequence.getSequence();
      if (sequence) {
        handlers = this.registry.getHandlers(sequence);

        if (handlers) {
          // Clear buffer after successful chord match
          this.sequence.clear();
        }
      }
    }

    if (!handlers) {
      return;
    }

    // Execute all matching handlers
    handlers.forEach((shortcut) => {
      // Check if scope is active
      if (!this.scopes.isActive(shortcut.options.scope || "global")) {
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
   * Clean up event listeners
   */
  destroy(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.handleKeyDown, true);
    }
    this.registry.clear();
    this.scopes.clear();
    this.sequence.destroy();
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
