import type { Frame, AnimationTimeline } from "../stubs";
import type { TestState } from "../types";

// Temporary mock test data for testing the scrubber
export const mockFrames: Frame[] = [
  { interpreterTime: 0, timelineTime: 0, line: 1, status: "SUCCESS", description: "Start" } as Frame,
  { interpreterTime: 1, timelineTime: 100, line: 2, status: "SUCCESS", description: "Line 2" } as Frame,
  { interpreterTime: 2, timelineTime: 200, line: 3, status: "SUCCESS", description: "Line 3" } as Frame,
  { interpreterTime: 3, timelineTime: 300, line: 4, status: "SUCCESS", description: "Line 4" } as Frame,
  { interpreterTime: 4, timelineTime: 400, line: 5, status: "SUCCESS", description: "End" } as Frame
];

export const mockTest: TestState = {
  frames: mockFrames,
  animationTimeline: {
    duration: 5,
    paused: true,
    seek: (_time: number) => {},
    play: () => {},
    pause: () => {},
    progress: 0,
    currentTime: 0,
    completed: false,
    hasPlayedOrScrubbed: false,
    seekEndOfTimeline: () => {},
    onUpdate: () => {},
    timeline: {
      duration: 5,
      currentTime: 0
    }
  } as AnimationTimeline,
  timelineTime: 0,
  currentFrame: mockFrames[0] // Initialize with first frame
};
