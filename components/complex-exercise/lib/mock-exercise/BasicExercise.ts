import { Exercise } from "./Exercise";
import type { Animation } from "../AnimationTimeline";

export class BasicExercise extends Exercise {
  position: number = 0;

  availableFunctions = [
    {
      name: "move",
      func: this.move.bind(this),
      description: "Move the character 20px forward"
    }
  ];

  move(executionCtx: { time: number }) {
    this.position += 20;

    this.animations.push({
      targets: ".character",
      translateX: this.position,
      duration: 100,
      offset: executionCtx.time,
      transformations: {}
    } as Animation);
  }

  setStartPosition(position: number) {
    this.position = position;
  }

  getState() {
    return {
      position: this.position
    };
  }
}
