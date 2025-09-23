import type { ComponentType } from "react";
import type { StoreApi } from "zustand/vanilla";
import type { OrchestratorStore } from "../types";

/**
 * Manages modal state and operations
 */
export class ModalManager {
  private availableModals: Record<string, ComponentType<any>> = {};

  constructor(private readonly store: StoreApi<OrchestratorStore>) {}

  /**
   * Register available modals
   */
  registerModals(modals: Record<string, ComponentType<any>>): void {
    this.availableModals = modals;
  }

  /**
   * Get a specific modal component by name
   */
  getModal(name: string): ComponentType<any> | undefined {
    return this.availableModals[name];
  }

  /**
   * Get all registered modals
   */
  getAvailableModals(): Record<string, ComponentType<any>> {
    return this.availableModals;
  }

  /**
   * Show a modal by name with optional props
   */
  showModal(name: string, props: Record<string, any> = {}): void {
    this.store.getState().showModal(name, props);
  }

  /**
   * Hide the currently open modal
   */
  hideModal(): void {
    this.store.getState().hideModal();
  }

  /**
   * Check if a modal is currently open
   */
  isModalOpen(): boolean {
    return this.store.getState().modalIsOpen;
  }

  /**
   * Get the current modal name
   */
  getCurrentModalName(): string | null {
    return this.store.getState().modalName;
  }

  /**
   * Get the current modal props
   */
  getCurrentModalProps(): Record<string, any> {
    return this.store.getState().modalProps;
  }
}
