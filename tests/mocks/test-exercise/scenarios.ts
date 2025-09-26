import type { Task, Scenario } from "@/components/exercises/types";
import type { TestExercise } from "./Exercise";

export const tasks: Task[] = [
  {
    id: "test-task-1",
    name: "Basic Test Task",
    bonus: false
  }
];

export const scenarios: Scenario[] = [
  {
    slug: "test-scenario-1",
    name: "Test Scenario 1",
    description: "Move to position 100",
    taskId: "test-task-1",
    setup: (exercise: TestExercise) => {
      exercise.setStartPosition(0);
      exercise.setCounter(0);
    },
    expectations: (exercise: TestExercise) => {
      const state = exercise.getState();
      return [
        {
          pass: state.position === 100,
          actual: state.position,
          expected: 100,
          errorHtml: `Expected position to be 100, but got ${state.position}`
        }
      ];
    }
  },
  {
    slug: "test-scenario-2",
    name: "Test Scenario 2",
    description: "Increment counter to 5",
    taskId: "test-task-1",
    setup: (exercise: TestExercise) => {
      exercise.setStartPosition(0);
      exercise.setCounter(0);
    },
    expectations: (exercise: TestExercise) => {
      const state = exercise.getState();
      return [
        {
          pass: state.counter === 5,
          actual: state.counter,
          expected: 5,
          errorHtml: `Expected counter to be 5, but got ${state.counter}`
        }
      ];
    }
  }
];
