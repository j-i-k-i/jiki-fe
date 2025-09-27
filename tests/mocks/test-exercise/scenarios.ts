import type { Task, Scenario, Exercise } from "@jiki/curriculum";
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
    setup: (exercise: Exercise) => {
      const testExercise = exercise as TestExercise;
      testExercise.setStartPosition(0);
      testExercise.setCounter(0);
    },
    expectations: (exercise: Exercise) => {
      const testExercise = exercise as TestExercise;
      const state = testExercise.getState();
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
    setup: (exercise: Exercise) => {
      const testExercise = exercise as TestExercise;
      testExercise.setStartPosition(0);
      testExercise.setCounter(0);
    },
    expectations: (exercise: Exercise) => {
      const testExercise = exercise as TestExercise;
      const state = testExercise.getState();
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
