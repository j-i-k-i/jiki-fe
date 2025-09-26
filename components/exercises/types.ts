import type { Exercise } from "../complex-exercise/lib/mock-exercise/Exercise";

export interface ExerciseDefinition {
  // From metadata.json
  slug: string;
  title: string;
  instructions: string;
  estimatedMinutes: number;

  // Core components
  initialCode: string;
  ExerciseClass: new () => Exercise;
  tasks: Task[];
  scenarios: Scenario[];

  // Optional
  hints?: string[];
  solution?: string;
}

export interface Task {
  id: string;
  name: string;
  bonus?: boolean;
}

export interface Scenario {
  slug: string;
  name: string;
  description: string;
  taskId: string;  // References the task this scenario belongs to
  setup: (exercise: any) => void;
  expectations: (exercise: any) => TestExpect[];
}

export interface TestExpect {
  pass: boolean;
  actual: any;
  expected: any;
  errorHtml: string;
}