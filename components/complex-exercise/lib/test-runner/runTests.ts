import { jikiscript } from "interpreters";
import { AnimationTimeline as AnimationTimelineClass } from "../AnimationTimeline";
import { BasicExercise } from "../mock-exercise/BasicExercise";
import basicTests from "../mock-exercise/BasicExercise.test";
import type { TestResult, TestSuiteResult } from "../test-results-types";

interface Scenario {
  slug: string;
  name: string;
  description: string;
  setup: (exercise: any) => void;
  expectations: (exercise: any) => any[];
}

// Task interface for future use when we implement task grouping
// interface Task {
//   name: string;
//   scenarios: Scenario[];
//   bonus?: boolean;
// }

function runScenario(scenario: Scenario, studentCode: string): TestResult {
  // Create fresh exercise instance
  const exercise = new BasicExercise();

  // Run setup
  scenario.setup(exercise);

  // Execute student code with Jikiscript
  const result = jikiscript.interpret(studentCode, {
    externalFunctions: exercise.availableFunctions.map((func) => ({
      name: func.name,
      func: func.func
    })) as any,
    languageFeatures: {
      timePerFrame: 1,
      maxTotalLoopIterations: 1000
    }
  });

  // Run expectations
  const expects = scenario.expectations(exercise);

  // Build animation timeline
  // Frames already have time (microseconds) and timeInMs (milliseconds) from interpreter
  const frames = result.frames;

  // Always create animation timeline (required for scrubber)
  const animationTimeline = new AnimationTimelineClass({}).populateTimeline(exercise.animations, frames);

  // Animation timeline is ready for scrubber

  // Determine status
  const status = expects.every((e) => e.pass) ? "pass" : "fail";

  return {
    slug: scenario.slug,
    name: scenario.name,
    status,
    expects,
    frames,
    codeRun: studentCode,
    view: exercise.getView(),
    animationTimeline
  };
}

export function runTests(studentCode: string): TestSuiteResult {
  const tests: TestResult[] = [];

  // Run all scenarios from all tasks
  for (const task of basicTests.tasks) {
    for (const scenario of task.scenarios) {
      const result = runScenario(scenario, studentCode);
      tests.push(result);
    }
  }

  // Determine overall status
  const status = tests.every((t) => t.status === "pass") ? "pass" : "fail";

  const result: TestSuiteResult = {
    tests,
    status
  };

  return result;
}
