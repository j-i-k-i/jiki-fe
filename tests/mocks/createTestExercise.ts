import type { ExerciseDefinition } from "@/components/exercises/types";
import { TestExercise } from "./test-exercise/Exercise";
import { tasks, scenarios } from "./test-exercise/scenarios";

/**
 * Helper function to create a test exercise definition with custom overrides
 */
export function createTestExercise(overrides?: Partial<ExerciseDefinition>): ExerciseDefinition {
  return {
    slug: "test-exercise",
    title: "Test Exercise",
    instructions: "This is a test exercise",
    estimatedMinutes: 5,
    initialCode: "// Test code",
    ExerciseClass: TestExercise,
    tasks,
    scenarios,
    ...overrides
  };
}
