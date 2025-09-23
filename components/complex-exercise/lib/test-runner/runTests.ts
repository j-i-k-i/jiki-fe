import { jikiscript } from "interpreters";
import type { TestSuiteResult, NewTestResult } from "../test-results-types";
import type { AnimationTimeline, Frame } from "../stubs";
import { BasicExercise } from "../mock-exercise/BasicExercise";
import basicTests from "../mock-exercise/BasicExercise.test";
import { AnimationTimeline as AnimationTimelineClass } from "../AnimationTimeline";

interface Scenario {
  slug: string;
  name: string;
  description: string;
  setup: (exercise: any) => void;
  expectations: (exercise: any) => any[];
}

interface Task {
  name: string;
  scenarios: Scenario[];
  bonus?: boolean;
}

async function runScenario(scenario: Scenario, studentCode: string): Promise<NewTestResult> {
  // Create fresh exercise instance
  const exercise = new BasicExercise();

  // Run setup
  scenario.setup(exercise);

  // Execute student code with Jikiscript
  const result = await jikiscript.interpret(studentCode, {
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
  // Ensure frames have timelineTime set (interpreterTime is what comes from jikiscript)
  const frames = result.frames.map((f: any, index: number) => ({
    ...f,
    timelineTime: f.timelineTime || f.interpreterTime || index,
    interpreterTime: f.interpreterTime || index
  })) as unknown as Frame[];

  // Create animation timeline if we have animations or frames
  const animationTimeline: AnimationTimeline | null =
    exercise.animations.length > 0 || frames.length > 0
      ? (new AnimationTimelineClass({}, frames).populateTimeline(
          exercise.animations,
          false
        ) as unknown as AnimationTimeline)
      : null;

  // Determine status
  const status = expects.every((e) => e.pass) ? "pass" : "fail";

  return {
    slug: scenario.slug,
    name: scenario.name,
    status,
    type: "state",
    expects,
    frames,
    codeRun: "move()",
    animationTimeline,
    timelineTime: 0
  };
}

export async function runTests(studentCode: string): Promise<TestSuiteResult> {
  const tests: NewTestResult[] = [];

  // Run all scenarios from all tasks
  for (const task of basicTests.tasks) {
    for (const scenario of task.scenarios) {
      const result = await runScenario(scenario, studentCode);
      tests.push(result);
    }
  }

  // Determine overall status
  const status = tests.every((t) => t.status === "pass") ? "pass" : "fail";

  return {
    tests,
    status
  };
}
