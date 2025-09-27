import { type ExecutionContext } from "interpreters";
import type { Animation } from "@/components/complex-exercise/lib/AnimationTimeline";
import { Exercise } from "@/components/complex-exercise/lib/mock-exercise/Exercise";

export class TestExercise extends Exercise {
  position: number = 0;
  counter: number = 0;

  availableFunctions = [
    {
      name: "move",
      func: this.move.bind(this),
      description: "Move the character 20px forward"
    },
    {
      name: "increment",
      func: this.increment.bind(this),
      description: "Increment the counter"
    }
  ];

  move(executionCtx: ExecutionContext) {
    this.position += 20;

    this.animations.push({
      targets: `#${this.view.id} .character`,
      left: this.position,
      duration: 100,
      offset: executionCtx.getCurrentTimeInMs(),
      transformations: {}
    } as Animation);

    executionCtx.fastForward(100);
  }

  increment(executionCtx: ExecutionContext) {
    this.counter += 1;
    executionCtx.fastForward(10);
  }

  setStartPosition(position: number) {
    this.position = position;
  }

  setCounter(counter: number) {
    this.counter = counter;
  }

  getState() {
    return {
      position: this.position,
      counter: this.counter
    };
  }

  protected populateView() {
    const container = document.createElement("div");
    this.view.appendChild(container);
    container.className = "test-exercise-container";
    container.style.cssText = `
      width: 100%;
      height: 200px;
      position: relative;
      border: 1px solid #ccc;
      background: #f5f5f5;
    `;

    const character = document.createElement("div");
    character.className = "character";
    character.style.cssText = `
      width: 20px;
      height: 20px;
      background: #4A90E2;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: ${this.position}px;
      transform: translateY(-50%);
    `;
    container.appendChild(character);

    const counterDiv = document.createElement("div");
    counterDiv.className = "counter";
    counterDiv.textContent = `Counter: ${this.counter}`;
    counterDiv.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      font-family: monospace;
    `;
    container.appendChild(counterDiv);
  }
}
