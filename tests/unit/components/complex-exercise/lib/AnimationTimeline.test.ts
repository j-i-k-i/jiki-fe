import { AnimationTimeline } from "@/components/complex-exercise/lib/AnimationTimeline";
import { createTimeline } from "animejs";
import type { Timeline, DefaultsParams } from "animejs";
import type { Frame } from "@/components/complex-exercise/lib/stubs";

// Mock animejs
jest.mock("animejs", () => ({
  createTimeline: jest.fn()
}));

describe("AnimationTimeline", () => {
  let mockTimeline: Partial<Timeline>;
  let animationTimeline: AnimationTimeline;
  const mockFrames: Frame[] = [
    { line: 1, interpreterTime: 0, timelineTime: 0, status: "SUCCESS" },
    { line: 2, interpreterTime: 30, timelineTime: 30, status: "SUCCESS" },
    { line: 3, interpreterTime: 60, timelineTime: 60, status: "SUCCESS" },
    {
      line: 4,
      interpreterTime: 90,
      timelineTime: 90,
      status: "ERROR",
      // TypeScript fix: StaticError interface requires 'type' property
      // Added 'type: "runtime"' to satisfy the StaticError type definition
      error: { message: "Test error", type: "runtime" }
    }
  ];

  beforeEach(() => {
    // Reset the mock timeline
    mockTimeline = {
      duration: 100,
      currentTime: 0,
      paused: true,
      completed: false,
      play: jest.fn(),
      pause: jest.fn(),
      seek: jest.fn(),
      restart: jest.fn(),
      reverse: jest.fn(),
      add: jest.fn().mockReturnThis()
    };

    // Setup createTimeline mock to capture callbacks
    (createTimeline as jest.Mock).mockImplementation((params) => {
      // Store callbacks for later triggering
      if (params?.onUpdate) {
        mockTimeline.onUpdate = params.onUpdate;
      }
      if (params?.onBegin) {
        mockTimeline.onBegin = params.onBegin;
      }
      if (params?.onComplete) {
        mockTimeline.onComplete = params.onComplete;
      }
      if (params?.onPause) {
        mockTimeline.onPause = params.onPause;
      }
      return mockTimeline as Timeline;
    });

    animationTimeline = new AnimationTimeline({}, mockFrames);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create timeline with default options", () => {
      expect(createTimeline).toHaveBeenCalledWith({
        defaults: {
          ease: "linear"
        },
        autoplay: false,
        onUpdate: expect.any(Function),
        onBegin: expect.any(Function),
        onComplete: expect.any(Function),
        onPause: expect.any(Function)
      });
    });

    it("should merge initial options with defaults", () => {
      const customOptions: DefaultsParams = { duration: 500 };
      new AnimationTimeline(customOptions, mockFrames);

      expect(createTimeline).toHaveBeenCalledWith({
        defaults: {
          ease: "linear",
          duration: 500
        },
        autoplay: false,
        onUpdate: expect.any(Function),
        onBegin: expect.any(Function),
        onComplete: expect.any(Function),
        onPause: expect.any(Function)
      });
    });

    it("should initialize with provided frames", () => {
      expect(animationTimeline.getFrames()).toEqual(mockFrames);
    });

    it("should initialize state properties", () => {
      expect(animationTimeline.progress).toBe(0);
      expect(animationTimeline.hasPlayedOrScrubbed).toBe(false);
      expect(animationTimeline.showPlayButton).toBe(true);
      expect(animationTimeline.currentFrameIndex).toBe(0);
    });
  });

  describe("populateTimeline", () => {
    it("should add animations with transformations to timeline", () => {
      const animations = [
        {
          targets: ".element",
          offset: "+=100",
          transformations: { opacity: 1, translateX: 100 }
        }
      ];

      animationTimeline.populateTimeline(animations, false);

      expect(mockTimeline.add).toHaveBeenCalledWith(".element", { opacity: 1, translateX: 100 }, "+=100");
    });

    it("should handle animations without transformations", () => {
      const animations = [
        {
          targets: ".element",
          duration: 1000,
          opacity: 0.5
        }
      ];

      animationTimeline.populateTimeline(animations as never, false);

      expect(mockTimeline.add).toHaveBeenCalledWith(".element", { duration: 1000, opacity: 0.5 }, undefined);
    });

    it("should set showPlayButton based on placeholder parameter", () => {
      animationTimeline.populateTimeline([], true);
      expect(animationTimeline.showPlayButton).toBe(false);

      animationTimeline.populateTimeline([], false);
      expect(animationTimeline.showPlayButton).toBe(true);
    });

    it("should adjust duration to include last frame", () => {
      mockTimeline.duration = 50;
      animationTimeline.populateTimeline([], false);

      // Should set duration to the last frame's time (90ms)
      expect(mockTimeline.duration).toBe(90);
    });

    it("should handle empty frames array", () => {
      const emptyTimeline = new AnimationTimeline({}, []);
      mockTimeline.duration = 100;

      emptyTimeline.populateTimeline([], false);

      expect(mockTimeline.duration).toBe(100);
    });
  });

  describe("callback management", () => {
    describe("onUpdate", () => {
      it("should register update callbacks", () => {
        const callback = jest.fn();
        animationTimeline.onUpdate(callback);

        // Trigger update through mock
        mockTimeline.currentTime = 30;
        mockTimeline.onUpdate?.(mockTimeline as Timeline);

        expect(callback).toHaveBeenCalledWith(mockTimeline);
      });

      it("should call callback immediately when registering", () => {
        const callback = jest.fn();
        jest.useFakeTimers();

        animationTimeline.onUpdate(callback);

        expect(callback).toHaveBeenCalledWith(mockTimeline);

        jest.runAllTimers();
        jest.useRealTimers();
      });

      it("should handle multiple update callbacks", () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        animationTimeline.onUpdate(callback1);
        animationTimeline.onUpdate(callback2);

        mockTimeline.onUpdate?.(mockTimeline as Timeline);

        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
      });
    });

    describe("onPlay", () => {
      it("should register play callbacks", () => {
        const callback = jest.fn();
        animationTimeline.onPlay(callback);

        mockTimeline.onBegin?.(mockTimeline as Timeline);

        expect(callback).toHaveBeenCalledWith(mockTimeline);
      });
    });

    describe("onStop", () => {
      it("should register stop callbacks for complete event", () => {
        const callback = jest.fn();
        animationTimeline.onStop(callback);

        mockTimeline.onComplete?.(mockTimeline as Timeline);

        expect(callback).toHaveBeenCalledWith(mockTimeline);
      });

      it("should register stop callbacks for pause event", () => {
        const callback = jest.fn();
        animationTimeline.onStop(callback);

        mockTimeline.onPause?.(mockTimeline as Timeline);

        expect(callback).toHaveBeenCalledWith(mockTimeline);
      });
    });

    describe("removeUpdateCallback", () => {
      it("should remove specific update callback", () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        animationTimeline.onUpdate(callback1);
        animationTimeline.onUpdate(callback2);

        // Clear previous calls from onUpdate immediate invocation
        callback1.mockClear();
        callback2.mockClear();

        animationTimeline.removeUpdateCallback(callback1);

        mockTimeline.onUpdate?.(mockTimeline as Timeline);

        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).toHaveBeenCalledWith(mockTimeline);
      });
    });
  });

  describe("frame navigation", () => {
    beforeEach(() => {
      // Simulate timeline update at different positions
      mockTimeline.currentTime = 45;
      mockTimeline.onUpdate?.(mockTimeline as Timeline);
    });

    it("should update current frame based on progress", () => {
      expect(animationTimeline.getCurrentFrame()).toEqual(mockFrames[1]);
      expect(animationTimeline.currentFrameIndex).toBe(1);
    });

    it("should set previous and next frames correctly", () => {
      expect(animationTimeline.previousFrame).toEqual(mockFrames[0]);
      expect(animationTimeline.nextFrame).toEqual(mockFrames[2]);
    });

    it("should handle first frame (no previous)", () => {
      mockTimeline.currentTime = 0;
      mockTimeline.onUpdate?.(mockTimeline as Timeline);

      expect(animationTimeline.previousFrame).toBeNull();
      expect(animationTimeline.currentFrame).toEqual(mockFrames[0]);
      expect(animationTimeline.nextFrame).toEqual(mockFrames[1]);
    });

    it("should handle last frame (no next)", () => {
      mockTimeline.currentTime = 95;
      mockTimeline.onUpdate?.(mockTimeline as Timeline);

      expect(animationTimeline.previousFrame).toEqual(mockFrames[2]);
      expect(animationTimeline.currentFrame).toEqual(mockFrames[3]);
      expect(animationTimeline.nextFrame).toBeNull();
    });

    describe("frameAtTime", () => {
      it("should return correct frame for given time", () => {
        expect(animationTimeline.frameAtTime(0)).toEqual(mockFrames[0]);
        expect(animationTimeline.frameAtTime(45)).toEqual(mockFrames[1]);
        expect(animationTimeline.frameAtTime(75)).toEqual(mockFrames[2]);
        expect(animationTimeline.frameAtTime(100)).toEqual(mockFrames[3]);
      });

      it("should return closest previous frame for times between frames", () => {
        expect(animationTimeline.frameAtTime(25)).toEqual(mockFrames[0]);
        expect(animationTimeline.frameAtTime(55)).toEqual(mockFrames[1]);
      });
    });
  });

  describe("seek methods", () => {
    it("should seek to specific time", () => {
      animationTimeline.seek(50);
      expect(mockTimeline.seek).toHaveBeenCalledWith(50);
    });

    it("should seek to first frame", () => {
      animationTimeline.seekFirstFrame();
      expect(mockTimeline.seek).toHaveBeenCalledWith(0);
    });

    it("should seek to last frame", () => {
      animationTimeline.seekLastFrame();
      expect(mockTimeline.seek).toHaveBeenCalledWith(90);
    });

    it("should seek to end of timeline", () => {
      mockTimeline.duration = 120;
      animationTimeline.seekEndOfTimeline();
      expect(mockTimeline.seek).toHaveBeenCalledWith(120);
    });
  });

  describe("playback control", () => {
    describe("play", () => {
      it("should play the timeline", () => {
        animationTimeline.play();
        expect(mockTimeline.play).toHaveBeenCalled();
      });

      it("should restart from beginning if completed", () => {
        mockTimeline.completed = true;
        animationTimeline.play();

        expect(mockTimeline.seek).toHaveBeenCalledWith(0);
        expect(mockTimeline.play).toHaveBeenCalled();
      });

      it("should execute callback before playing", () => {
        const callback = jest.fn();
        animationTimeline.play(callback);

        expect(callback).toHaveBeenCalled();
        expect(mockTimeline.play).toHaveBeenCalled();
      });
    });

    describe("pause", () => {
      it("should pause the timeline", () => {
        animationTimeline.pause();
        expect(mockTimeline.pause).toHaveBeenCalled();
      });

      it("should execute callback after pausing", () => {
        const callback = jest.fn();
        const pauseFn = mockTimeline.pause as jest.Mock;

        animationTimeline.pause(callback);

        expect(pauseFn).toHaveBeenCalled();
        expect(callback).toHaveBeenCalled();
      });
    });

    describe("restart", () => {
      it("should restart the timeline", () => {
        animationTimeline.restart();
        expect(mockTimeline.restart).toHaveBeenCalled();
      });
    });

    describe("reverse", () => {
      it("should reverse the timeline", () => {
        animationTimeline.reverse();
        expect(mockTimeline.reverse).toHaveBeenCalled();
      });
    });
  });

  describe("property getters", () => {
    it("should return timeline instance", () => {
      expect(animationTimeline.timeline).toBe(mockTimeline);
    });

    it("should return duration", () => {
      mockTimeline.duration = 250;
      expect(animationTimeline.duration).toBe(250);
    });

    it("should return paused state", () => {
      mockTimeline.paused = true;
      expect(animationTimeline.paused).toBe(true);

      mockTimeline.paused = false;
      expect(animationTimeline.paused).toBe(false);
    });

    it("should return completed state", () => {
      mockTimeline.completed = false;
      expect(animationTimeline.completed).toBe(false);

      mockTimeline.completed = true;
      expect(animationTimeline.completed).toBe(true);
    });

    it("should return progress", () => {
      mockTimeline.currentTime = 45;
      mockTimeline.onUpdate?.(mockTimeline as Timeline);

      expect(animationTimeline.getProgress()).toBe(45);
      expect(animationTimeline.progress).toBe(45);
    });

    it("should return frames length", () => {
      expect(animationTimeline.framesLength).toBe(4);
    });
  });

  describe("destroy", () => {
    it("should pause timeline and set to null", () => {
      animationTimeline.destroy();

      expect(mockTimeline.pause).toHaveBeenCalled();
      // Can't directly test null assignment due to @ts-expect-error
    });
  });

  describe("edge cases", () => {
    it("should handle timeline with no frames", () => {
      const emptyTimeline = new AnimationTimeline({}, []);
      expect(emptyTimeline.framesLength).toBe(0);
      expect(emptyTimeline.getCurrentFrame()).toBeUndefined();
    });

    it("should handle seeking beyond timeline duration", () => {
      animationTimeline.seek(1000);
      expect(mockTimeline.seek).toHaveBeenCalledWith(1000);
    });

    it("should handle negative seek values", () => {
      animationTimeline.seek(-10);
      expect(mockTimeline.seek).toHaveBeenCalledWith(-10);
    });

    it("should handle updateScrubber with valid timeline", () => {
      // This should not throw when called with valid timeline
      expect(() => {
        mockTimeline.onUpdate?.(mockTimeline as Timeline);
      }).not.toThrow();
    });
  });

  describe("integration scenarios", () => {
    it("should track hasPlayedOrScrubbed state correctly", () => {
      expect(animationTimeline.hasPlayedOrScrubbed).toBe(false);
      // This would typically be set by external code
      animationTimeline.hasPlayedOrScrubbed = true;
      expect(animationTimeline.hasPlayedOrScrubbed).toBe(true);
    });

    it("should handle complex animation sequence", () => {
      const animations = [
        {
          targets: ".element1",
          offset: 0,
          transformations: { opacity: 1 }
        },
        {
          targets: ".element2",
          offset: "+=100",
          transformations: { translateX: 100 }
        },
        {
          targets: ".element3",
          transformations: { scale: 1.5 }
        }
      ];

      animationTimeline.populateTimeline(animations, false);

      expect(mockTimeline.add).toHaveBeenCalledTimes(3);
      expect(mockTimeline.add).toHaveBeenNthCalledWith(1, ".element1", { opacity: 1 }, 0);
      expect(mockTimeline.add).toHaveBeenNthCalledWith(2, ".element2", { translateX: 100 }, "+=100");
      expect(mockTimeline.add).toHaveBeenNthCalledWith(3, ".element3", { scale: 1.5 }, undefined);
    });

    it("should update all state when scrubbing through timeline", () => {
      const updateCallback = jest.fn();
      animationTimeline.onUpdate(updateCallback);

      // Simulate scrubbing to different positions
      const positions = [0, 15, 30, 45, 60, 75, 90];
      positions.forEach((pos) => {
        mockTimeline.currentTime = pos;
        mockTimeline.onUpdate?.(mockTimeline as Timeline);
      });

      expect(updateCallback).toHaveBeenCalledTimes(positions.length + 1); // +1 for initial call
      expect(animationTimeline.progress).toBe(90);
      expect(animationTimeline.currentFrameIndex).toBe(3);
    });
  });
});
