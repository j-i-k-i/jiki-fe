import type { Task, Scenario } from "../types";
import type BasicMovementExercise from "./Exercise";

export const tasks: Task[] = [
  {
    id: "move-character",
    name: "Move the character",
    bonus: false
  },
  {
    id: "bonus-challenges",
    name: "Bonus challenges",
    bonus: true
  }
];

export const scenarios: Scenario[] = [
  {
    slug: "start-at-0",
    name: "Starting from position 0",
    description: "Move the character 5 times starting from position 0",
    taskId: "move-character",

    setup(exercise: BasicMovementExercise) {
      exercise.setStartPosition(0);
    },

    expectations(exercise: BasicMovementExercise) {
      return [
        {
          pass: exercise.position === 100,
          actual: exercise.position,
          expected: 100,
          errorHtml: `Expected position to be 100 but got ${exercise.position}. Did you call move() 5 times?`
        }
      ];
    }
  },

  {
    slug: "start-at-50",
    name: "Starting from position 50",
    description: "Move the character 5 times starting from position 50",
    taskId: "move-character",

    setup(exercise: BasicMovementExercise) {
      exercise.setStartPosition(50);
    },

    expectations(exercise: BasicMovementExercise) {
      return [
        {
          pass: exercise.position === 150,
          actual: exercise.position,
          expected: 150,
          errorHtml: `Expected position to be 150 but got ${exercise.position}. Did you call move() 5 times?`
        }
      ];
    }
  },

  {
    slug: "bonus-double-movement",
    name: "Double movement",
    description: "Move the character 10 times",
    taskId: "bonus-challenges",

    setup(exercise: BasicMovementExercise) {
      exercise.setStartPosition(0);
    },

    expectations(exercise: BasicMovementExercise) {
      return [
        {
          pass: exercise.position === 200,
          actual: exercise.position,
          expected: 200,
          errorHtml: `Expected position to be 200 but got ${exercise.position}. Did you call move() 10 times?`
        }
      ];
    }
  }
];
