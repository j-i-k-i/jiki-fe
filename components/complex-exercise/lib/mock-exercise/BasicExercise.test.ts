import type { BasicExercise } from "./BasicExercise";

const basicExerciseTests = {
  title: "Basic Movement",
  exerciseType: "basic",

  tasks: [
    {
      name: "Move the character",
      scenarios: [
        {
          slug: "start-at-0",
          name: "Starting from position 0",
          description: "Move the character 5 times starting from position 0",

          setup(exercise: BasicExercise) {
            exercise.setStartPosition(0);
          },

          expectations(exercise: BasicExercise) {
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

          setup(exercise: BasicExercise) {
            exercise.setStartPosition(50);
          },

          expectations(exercise: BasicExercise) {
            return [
              {
                pass: exercise.position === 150,
                actual: exercise.position,
                expected: 150,
                errorHtml: `Expected position to be 150 but got ${exercise.position}. Did you call move() 5 times?`
              }
            ];
          }
        }
      ]
    },
    {
      name: "Bonus challenges",
      bonus: true,
      scenarios: [
        {
          slug: "bonus-double-movement",
          name: "Double movement",
          description: "Move the character 10 times",

          setup(exercise: BasicExercise) {
            exercise.setStartPosition(0);
          },

          expectations(exercise: BasicExercise) {
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
      ]
    }
  ]
};

export default basicExerciseTests;
