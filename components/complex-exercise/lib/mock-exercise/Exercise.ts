import type { Animation } from "../AnimationTimeline";

export abstract class Exercise {
  animations: Animation[] = [];
  view: HTMLElement;

  abstract availableFunctions: Array<{
    name: string;
    func: (...args: any[]) => any;
    description?: string;
  }>;

  abstract getState(): Record<string, any>;
  protected populateView() {};

  constructor() {
    this.view = document.createElement("div")
    this.view.id = `exercise-${Math.random().toString(36).substr(2, 9)}`
    this.view.style.display = 'none'
    document.body.appendChild(this.view)

    this.populateView()
  }

  getView(): HTMLElement {
    return this.view;
  }
}
