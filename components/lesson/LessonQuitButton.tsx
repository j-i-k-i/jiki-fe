"use client";

import { showConfirmation } from "@/lib/modal";
import { X } from "lucide-react";

interface LessonQuitButtonProps {
  onQuit?: () => void;
  className?: string;
}

export function LessonQuitButton({ onQuit, className = "" }: LessonQuitButtonProps) {
  const handleQuit = () => {
    showConfirmation({
      title: "Quit Lesson",
      message: "Are you sure you want to quit this lesson? Your progress won't be saved.",
      confirmText: "Quit",
      cancelText: "Continue Learning",
      variant: "danger",
      onConfirm: () => {
        if (onQuit) {
          onQuit();
        } else {
          window.history.back();
        }
      }
    });
  };

  return (
    <button
      onClick={handleQuit}
      className={`absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900 transition-all shadow-sm hover:shadow-md ${className}`}
      aria-label="Quit lesson"
    >
      <X className="w-[32px] h-[32px]" />
    </button>
  );
}
