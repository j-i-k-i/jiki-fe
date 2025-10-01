import { useCallback } from "react";
import type { Exercise } from "./mockData";

export function usePreloadExercise() {
  const preloadExercise = useCallback((exercise: Exercise) => {
    switch (exercise.type) {
      case "coding":
        void import("@/components/complex-exercise/ComplexExercise");
        break;
      case "video":
        void import("@/app/dev/video-exercise/page");
        break;
      case "quiz":
        break;
      default:
        break;
    }
  }, []);

  return { preloadExercise };
}
