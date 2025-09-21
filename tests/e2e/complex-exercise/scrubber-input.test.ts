describe("ScrubberInput E2E", () => {
  beforeEach(async () => {
    await page.goto("http://localhost:3070/test/complex-exercise/scrubber-input");
    await page.waitForSelector('[data-testid="scrubber-input-container"]', { timeout: 5000 });
  });

  describe("Initial State", () => {
    it("should render with correct initial state", async () => {
      // Check initial timeline time is 0
      const timelineTime = await page.$eval('[data-testid="timeline-time"]', (el) => el.textContent);
      expect(timelineTime).toContain("Timeline Time: 0");

      // Check initial frame
      const currentFrame = await page.$eval('[data-testid="current-frame"]', (el) => el.textContent);
      expect(currentFrame).toContain("Frame 1");

      // Check scrubber input exists and has correct initial value
      const scrubberValue = await page.$eval(
        '[data-testid="scrubber-range-input"]',
        (el: HTMLInputElement) => el.value
      );
      expect(scrubberValue).toBe("0");

      // Check scrubber is enabled
      const isDisabled = await page.$eval(
        '[data-testid="scrubber-range-input"]',
        (el: HTMLInputElement) => el.disabled
      );
      expect(isDisabled).toBe(false);
    });
  });

  describe("Frame Snapping on MouseUp", () => {
    it("should snap to nearest frame when releasing mouse", async () => {
      // Set the timeline to 110 (just 10 past frame 2 at 100, far from frame 3 at 250)
      await page.evaluate(() => {
        const orchestrator = (window as any).testOrchestrator;
        orchestrator.setCurrentTestTimelineTime(110);
      });

      // Verify initial position
      let timelineTime = await page.$eval('[data-testid="timeline-time"]', (el) => el.textContent);
      expect(timelineTime).toContain("110");

      // Now get the scrubber and trigger mouseup to snap
      const scrubberInput = await page.$('[data-testid="scrubber-range-input"]');
      await scrubberInput?.evaluate((el) => {
        const event = new MouseEvent("mouseup", { bubbles: true });
        el.dispatchEvent(event);
      });

      // Should snap to frame 2 (time 100) since 110 is much closer to 100 than 250
      timelineTime = await page.$eval('[data-testid="timeline-time"]', (el) => el.textContent);
      expect(timelineTime).toContain("100");

      const currentFrame = await page.$eval('[data-testid="current-frame"]', (el) => el.textContent);
      expect(currentFrame).toContain("Frame 2");
    });

    it("should snap to the nearest frame when closer to next frame", async () => {
      const scrubberInput = await page.$('[data-testid="scrubber-range-input"]');

      // Simulate dragging to position 240 (just before frame 3 at 250)
      await scrubberInput?.evaluate((el: HTMLInputElement) => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        nativeInputValueSetter?.call(el, "240");
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });

      // Simulate mouseup
      await scrubberInput?.evaluate((el) => {
        el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      });

      // Should snap to frame 3 (time 250) since 240 is very close to 250
      const timelineTime = await page.$eval('[data-testid="timeline-time"]', (el) => el.textContent);
      expect(timelineTime).toContain("250");

      const currentFrame = await page.$eval('[data-testid="current-frame"]', (el) => el.textContent);
      expect(currentFrame).toContain("Frame 3");
    });

    it("should handle snapping at boundaries", async () => {
      const scrubberInput = await page.$('[data-testid="scrubber-range-input"]');

      // Test snapping just past frame 7 (910 is just past frame 7 at 900)
      await scrubberInput?.evaluate((el: HTMLInputElement) => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        nativeInputValueSetter?.call(el, "910");
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });

      await scrubberInput?.evaluate((el) => {
        el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      });

      // Should snap to frame 7 (time 900) since 910 is very close to 900
      const timelineTime = await page.$eval('[data-testid="timeline-time"]', (el) => el.textContent);
      expect(timelineTime).toContain("900");

      const currentFrame = await page.$eval('[data-testid="current-frame"]', (el) => el.textContent);
      expect(currentFrame).toContain("Frame 7");
    });
  });

  describe("Scrubbing Behavior", () => {
    it("should update timeline time without snapping during drag", async () => {
      const scrubberInput = await page.$('[data-testid="scrubber-range-input"]');

      // Simulate dragging to various positions without releasing
      const testPositions = [110, 260, 410, 610, 760, 910];

      for (const position of testPositions) {
        // Set value and trigger input/change events (simulating drag)
        await scrubberInput?.evaluate((el: HTMLInputElement, pos: number) => {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          )?.set;
          nativeInputValueSetter?.call(el, String(pos));
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }, position);

        // Verify the timeline time updates to exact value (no snapping)
        const timelineTime = await page.$eval('[data-testid="timeline-time"]', (el) => el.textContent);
        expect(timelineTime).toContain(String(position));
      }
    });

    it("should update current frame when landing exactly on frame positions", async () => {
      // Start at frame 1 (time 0)
      await page.evaluate(() => {
        const orchestrator = (window as any).testOrchestrator;
        orchestrator.setCurrentTestTimelineTime(0);
      });

      let currentFrame = await page.$eval('[data-testid="current-frame"]', (el) => el.textContent);
      expect(currentFrame).toContain("Frame 1");

      // Move to exactly frame 2 position (100)
      await page.evaluate(() => {
        const orchestrator = (window as any).testOrchestrator;
        orchestrator.setCurrentTestTimelineTime(100);
      });

      currentFrame = await page.$eval('[data-testid="current-frame"]', (el) => el.textContent);
      expect(currentFrame).toContain("Frame 2");

      // Move to exactly frame 4 position (400)
      await page.evaluate(() => {
        const orchestrator = (window as any).testOrchestrator;
        orchestrator.setCurrentTestTimelineTime(400);
      });

      currentFrame = await page.$eval('[data-testid="current-frame"]', (el) => el.textContent);
      expect(currentFrame).toContain("Frame 4");
    });

    it("should maintain position between frames during scrub", async () => {
      // Set to position 110 (just past frame 2 at 100)
      await page.evaluate(() => {
        const orchestrator = (window as any).testOrchestrator;
        orchestrator.setCurrentTestTimelineTime(110);
      });

      // Check timeline time is exactly what we set (not snapped)
      const timelineTime = await page.$eval('[data-testid="timeline-time"]', (el) => el.textContent);
      expect(timelineTime).toContain("110");

      // Current frame stays at Frame 1 since we haven't landed on a new frame
      // (setCurrentTestTimelineTime only updates currentFrame when landing exactly on a frame)
      const currentFrame = await page.$eval('[data-testid="current-frame"]', (el) => el.textContent);
      expect(currentFrame).toContain("Frame 1");

      // Nearest frame should be frame 2 (110 is very close to 100)
      const nearestFrame = await page.$eval('[data-testid="nearest-frame"]', (el) => el.textContent);
      expect(nearestFrame).toContain("Frame 2");
      expect(nearestFrame).toContain("Time: 100");
    });
  });

  describe("Scrubber Range", () => {
    it("should have correct min and max values", async () => {
      const scrubberInput = await page.$('[data-testid="scrubber-range-input"]');

      const min = await scrubberInput?.evaluate((el: HTMLInputElement) => el.min);
      expect(min).toBe("0");

      const max = await scrubberInput?.evaluate((el: HTMLInputElement) => el.max);
      expect(max).toBe("1000"); // duration (10) * 100
    });

    it("should accept values across entire range", async () => {
      const scrubberInput = await page.$('[data-testid="scrubber-range-input"]');

      // Test minimum value
      await scrubberInput?.evaluate((el: HTMLInputElement) => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        nativeInputValueSetter?.call(el, "0");
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });

      let timelineTime = await page.$eval('[data-testid="timeline-time"]', (el) => el.textContent);
      expect(timelineTime).toContain("0");

      // Test maximum value
      await scrubberInput?.evaluate((el: HTMLInputElement) => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        nativeInputValueSetter?.call(el, "1000");
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });

      timelineTime = await page.$eval('[data-testid="timeline-time"]', (el) => el.textContent);
      expect(timelineTime).toContain("1000");
    });
  });

  describe("Integration with Manual Controls", () => {
    it("should update scrubber value when timeline time changes programmatically", async () => {
      // Click button to set time to 175
      await page.click('[data-testid="set-time-175"]');

      // Check scrubber value updated
      const scrubberValue = await page.$eval(
        '[data-testid="scrubber-range-input"]',
        (el: HTMLInputElement) => el.value
      );
      expect(scrubberValue).toBe("175");

      // Check timeline time
      const timelineTime = await page.$eval('[data-testid="timeline-time"]', (el) => el.textContent);
      expect(timelineTime).toContain("175");
    });

    it("should update to exact frame positions when using frame buttons", async () => {
      // Click to go to frame 5
      await page.click('[data-testid="goto-frame-5"]');

      const scrubberValue = await page.$eval(
        '[data-testid="scrubber-range-input"]',
        (el: HTMLInputElement) => el.value
      );
      expect(scrubberValue).toBe("600"); // Frame 5's timeline time

      const currentFrame = await page.$eval('[data-testid="current-frame"]', (el) => el.textContent);
      expect(currentFrame).toContain("Frame 5");
    });
  });

  describe("Complex Interaction Scenarios", () => {
    it("should handle rapid scrubbing with proper frame updates", async () => {
      const scrubberInput = await page.$('[data-testid="scrubber-range-input"]');

      // Simulate rapid scrubbing across multiple positions
      const positions = [50, 110, 260, 410, 610, 760, 910, 610, 410, 110];

      for (const position of positions) {
        await scrubberInput?.evaluate((el: HTMLInputElement, pos: number) => {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          )?.set;
          nativeInputValueSetter?.call(el, String(pos));
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }, position);
      }

      // Final position should be 110
      const timelineTime = await page.$eval('[data-testid="timeline-time"]', (el) => el.textContent);
      expect(timelineTime).toContain("110");

      // Trigger mouseup to snap
      await scrubberInput?.evaluate((el) => {
        el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      });

      // Should snap to 100 (frame 2) since 110 is very close to 100
      const finalTime = await page.$eval('[data-testid="timeline-time"]', (el) => el.textContent);
      expect(finalTime).toContain("100");
    });

    it("should handle scrub-release-scrub sequence correctly", async () => {
      const scrubberInput = await page.$('[data-testid="scrubber-range-input"]');

      // First scrub to 110 (just past frame 2 at 100)
      await scrubberInput?.evaluate((el: HTMLInputElement) => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        nativeInputValueSetter?.call(el, "110");
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });

      // Release (should snap)
      await scrubberInput?.evaluate((el) => {
        el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      });

      let timelineTime = await page.$eval('[data-testid="timeline-time"]', (el) => el.textContent);
      expect(timelineTime).toContain("100"); // Snapped to frame 2

      // Scrub again to 610 (just past frame 5 at 600)
      await scrubberInput?.evaluate((el: HTMLInputElement) => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        nativeInputValueSetter?.call(el, "610");
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });

      timelineTime = await page.$eval('[data-testid="timeline-time"]', (el) => el.textContent);
      expect(timelineTime).toContain("610");

      // Release again (should snap)
      await scrubberInput?.evaluate((el) => {
        el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      });

      timelineTime = await page.$eval('[data-testid="timeline-time"]', (el) => el.textContent);
      expect(timelineTime).toContain("600"); // Snapped to frame 5 (610 is very close to 600)
    });
  });
});
