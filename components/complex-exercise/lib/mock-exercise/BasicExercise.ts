import { Exercise } from "./Exercise";
import type { Animation } from "../AnimationTimeline";

export class BasicExercise extends Exercise {
  position: number = 0;
  private view: HTMLElement | null = null;

  availableFunctions = [
    {
      name: "move",
      func: this.move.bind(this),
      description: "Move the character 20px forward"
    }
  ];

  move(executionCtx: any) {
    this.position += 20;

    // Get current time from execution context
    const currentTime = executionCtx.getCurrentTime ? executionCtx.getCurrentTime() : 0;

    this.animations.push({
      targets: ".character",
      translateX: this.position,
      duration: 100,
      offset: currentTime,
      transformations: {}
    } as Animation);

    // Fast forward time for the animation duration
    if (executionCtx.fastForward) {
      executionCtx.fastForward(100);
    }
  }

  setStartPosition(position: number) {
    this.position = position;
  }

  getState() {
    return {
      position: this.position
    };
  }

  getView(): HTMLElement {
    if (!this.view) {
      this.view = this.createView();
    }
    this.updateView();
    return this.view;
  }

  private createView(): HTMLElement {
    const container = document.createElement("div");
    container.className = "exercise-container";
    container.style.cssText = `
      width: 100%;
      height: 200px;
      position: relative;
      border: 1px solid #ccc;
      background: linear-gradient(to right, #f0f0f0 0%, #f0f0f0 49.5%, #ddd 49.5%, #ddd 50.5%, #f0f0f0 50.5%);
      background-size: 100px 100%;
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
      left: 20px;
      transform: translateY(-50%) translateX(${this.position}px);
      transition: transform 0.3s ease;
    `;

    const positionLabel = document.createElement("div");
    positionLabel.className = "position-label";
    positionLabel.style.cssText = `
      position: absolute;
      bottom: 10px;
      left: 10px;
      font-family: monospace;
      font-size: 12px;
      color: #666;
    `;
    positionLabel.textContent = `Position: ${this.position}px`;

    container.appendChild(character);
    container.appendChild(positionLabel);

    return container;
  }

  private updateView(): void {
    if (!this.view) {
      return;
    }

    const character = this.view.querySelector(".character") as HTMLElement;
    const positionLabel = this.view.querySelector(".position-label") as HTMLElement;

    if (character) {
      character.style.transform = `translateY(-50%) translateX(${this.position}px)`;
    }

    if (positionLabel) {
      positionLabel.textContent = `Position: ${this.position}px`;
    }
  }
}
