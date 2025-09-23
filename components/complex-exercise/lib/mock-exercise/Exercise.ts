import type { Animation } from "../AnimationTimeline";

export abstract class Exercise {
  animations: Animation[] = [];

  abstract availableFunctions: Array<{
    name: string;
    func: Function;
    description?: string;
  }>;

  abstract getState(): Record<string, any>;

  getView(): HTMLElement | null {
    return null;
  }
}
