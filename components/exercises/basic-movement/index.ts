import ExerciseClass from './Exercise';
import { tasks, scenarios } from './scenarios';
import metadata from './metadata.json';
import type { ExerciseDefinition } from '../types';

const exerciseDefinition: ExerciseDefinition = {
  ...metadata,  // Spreads id, title, instructions, estimatedMinutes
  initialCode: `// Move the character 5 times
// Each move() call moves the character 20px forward
`,
  ExerciseClass,
  tasks,
  scenarios,
  hints: [
    "Remember to call move() 5 times",
    "Each move() call moves the character 20px forward",
    "The character starts at position 0 (or 50 in the second test)"
  ],
  solution: `move()
move()
move()
move()
move()`
};

export default exerciseDefinition;