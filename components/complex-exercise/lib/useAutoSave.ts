import { useCallback, useMemo, useRef } from "react";
import { debounce } from "lodash";
import { saveCodeMirrorContent, type LocalStorageResult } from "./localStorage";

export interface AutoSaveConfig {
  exerciseId: string;
  debounceMs?: number;
  onSaveSuccess?: (result: LocalStorageResult<void>) => void;
  onSaveError?: (result: LocalStorageResult<void>) => void;
}

export interface AutoSaveHook {
  saveNow: (code: string, readonlyRanges?: { from: number; to: number }[]) => void;
  saveDebounced: (code: string, readonlyRanges?: { from: number; to: number }[]) => void;
  cancelPendingSave: () => void;
  isSaving: boolean;
}

/**
 * Custom hook for auto-saving CodeMirror content to localStorage
 * Provides both immediate and debounced save functionality
 */
export function useAutoSave({
  exerciseId,
  debounceMs = 500,
  onSaveSuccess,
  onSaveError
}: AutoSaveConfig): AutoSaveHook {
  const isSavingRef = useRef(false);

  // Immediate save function
  const saveNow = useCallback(
    (code: string, readonlyRanges?: { from: number; to: number }[]) => {
      if (isSavingRef.current) {
        return; // Prevent concurrent saves
      }

      isSavingRef.current = true;

      try {
        const result = saveCodeMirrorContent(exerciseId, code, readonlyRanges);

        if (result.success) {
          onSaveSuccess?.(result);
        } else {
          onSaveError?.(result);
          console.warn(`Failed to save exercise ${exerciseId}:`, result.error);
        }
      } catch (error) {
        const errorResult = {
          success: false as const,
          error: error instanceof Error ? error.message : "Unknown save error"
        };
        onSaveError?.(errorResult);
        console.error(`Error saving exercise ${exerciseId}:`, error);
      } finally {
        isSavingRef.current = false;
      }
    },
    [exerciseId, onSaveSuccess, onSaveError]
  );

  // Debounced save function
  const saveDebounced = useMemo(() => {
    return debounce((code: string, readonlyRanges?: { from: number; to: number }[]) => {
      saveNow(code, readonlyRanges);
    }, debounceMs);
  }, [saveNow, debounceMs]);

  // Cancel pending debounced saves
  const cancelPendingSave = useCallback(() => {
    saveDebounced.cancel();
  }, [saveDebounced]);

  return {
    saveNow,
    saveDebounced,
    cancelPendingSave,
    isSaving: isSavingRef.current
  };
}

/**
 * Utility hook that integrates auto-save with CodeMirror editor
 * Returns a callback that can be used in CodeMirror's onChange handler
 */
export function useCodeMirrorAutoSave({ exerciseId, debounceMs = 500, onSaveSuccess, onSaveError }: AutoSaveConfig) {
  const { saveDebounced, saveNow, cancelPendingSave, isSaving } = useAutoSave({
    exerciseId,
    debounceMs,
    onSaveSuccess,
    onSaveError
  });

  // Create a callback optimized for CodeMirror usage
  const autoSaveCallback = useCallback(
    (code: string, readonlyRanges?: { from: number; to: number }[]) => {
      // Use debounced save for regular typing
      saveDebounced(code, readonlyRanges);
    },
    [saveDebounced]
  );

  // Immediate save callback for critical moments (e.g., before navigation)
  const saveImmediately = useCallback(
    (code: string, readonlyRanges?: { from: number; to: number }[]) => {
      cancelPendingSave(); // Cancel any pending debounced saves
      saveNow(code, readonlyRanges);
    },
    [saveNow, cancelPendingSave]
  );

  return {
    autoSaveCallback,
    saveImmediately,
    cancelPendingSave,
    isSaving
  };
}
