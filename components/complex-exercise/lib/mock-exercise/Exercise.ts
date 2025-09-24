import type { Animation } from "../AnimationTimeline";

export abstract class Exercise {
  animations: Animation[] = [];

  abstract availableFunctions: Array<{
    name: string;
    func: (...args: any[]) => any;
    description?: string;
  }>;

  abstract getState(): Record<string, any>;

  getView(): HTMLElement | null {
    return null;
  }
}
