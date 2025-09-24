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
  // Frames already have time (microseconds) and timeInMs (milliseconds) from interpreter
  console.log("Raw frames from interpreter:", result.frames);
  const frames = result.frames as Frame[];

  console.log("Processed frames:", frames.length, frames);
  if (frames.length > 0) {
    console.log("First frame time (microseconds):", frames[0].time);
    console.log("Last frame time (microseconds):", frames[frames.length - 1].time);
    console.log("First frame timeInMs (milliseconds):", frames[0].timeInMs);
    console.log("Last frame timeInMs (milliseconds):", frames[frames.length - 1].timeInMs);
  }
  console.log("Animations from exercise:", exercise.animations.length, exercise.animations);

  // Create animation timeline if we have animations or frames
  const animationTimeline: AnimationTimeline | null =
    exercise.animations.length > 0 || frames.length > 0
      ? (new AnimationTimelineClass({}, frames).populateTimeline(
          exercise.animations,
          false
        ) as unknown as AnimationTimeline)
      : null;

  console.log("AnimationTimeline created:", animationTimeline);
  if (animationTimeline) {
    console.log("AnimationTimeline duration:", animationTimeline.duration);
  }

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
    view: exercise.getView(),
    animationTimeline,
    time: 0
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
