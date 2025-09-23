"use client";

import type { ComponentType } from "react";
import { useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { useOrchestratorStore } from "../../lib/orchestrator/store";
import type Orchestrator from "../../lib/Orchestrator";

interface ModalProviderProps {
  orchestrator: Orchestrator;
  modals: Record<string, ComponentType<any>>;
}

export function ModalProvider({ orchestrator, modals }: ModalProviderProps) {
  const { modalIsOpen, modalName, modalProps } = useOrchestratorStore(orchestrator);

  // Register modals with orchestrator on mount
  useEffect(() => {
    orchestrator.registerModals(modals);
  }, [orchestrator, modals]);

  // Get the current modal component
  const ModalComponent = modalName ? modals[modalName] : null;

  if (!modalIsOpen || !ModalComponent) {
    return null;
  }

  // Pass orchestrator and modal props to the modal component
  return (
    <BaseModal isOpen={modalIsOpen} onRequestClose={() => orchestrator.hideModal()}>
      <ModalComponent {...modalProps} orchestrator={orchestrator} />
    </BaseModal>
  );
}
