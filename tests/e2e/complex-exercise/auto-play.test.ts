describe("Auto-Play Timeline E2E", () => {
  beforeEach(async () => {
    await page.goto("http://localhost:3070/test/complex-exercise/test-runner");
    await page.waitForSelector(".cm-editor", { timeout: 5000 });
  }, 20000);

  it("should auto-play timeline after running tests successfully", async () => {
    // Clear and enter valid code
    await page.click(".cm-content");
    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.down(modifier);
    await page.keyboard.press("a");
    await page.keyboard.up(modifier);
    await page.type(".cm-content", "move()\nmove()\nmove()\nmove()\nmove()");

    // Click Run Code
    await page.click('[data-testid="run-button"]');

    // Wait for test results
    await page.waitForSelector('[data-ci="inspected-test-result-view"]', { timeout: 5000 });

    // Wait a bit for auto-play to start
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check that animation is playing (isPlaying should be true)
    const isPlaying = await page.evaluate(() => {
      const orchestrator = (window as any).testOrchestrator;
      return orchestrator.getStore().getState().isPlaying;
    });

    expect(isPlaying).toBe(true);
  });

  it("should NOT auto-play after user manually pauses", async () => {
    // Run tests first
    await page.click(".cm-content");
    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.down(modifier);
    await page.keyboard.press("a");
    await page.keyboard.up(modifier);
    await page.type(".cm-content", "move()\nmove()\nmove()\nmove()\nmove()");

    await page.click('[data-testid="run-button"]');
    await page.waitForSelector('[data-ci="inspected-test-result-view"]', { timeout: 5000 });

    // Wait for auto-play to start
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Click pause button
    await page.click('[data-ci="pause-button"]');

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Verify userHasPaused is true
    const userHasPaused = await page.evaluate(() => {
      const orchestrator = (window as any).testOrchestrator;
      return orchestrator.getStore().getState().userHasPaused;
    });
    expect(userHasPaused).toBe(true);

    // Run tests again (modify code slightly to trigger re-run)
    await page.click(".cm-content");
    await page.keyboard.down(modifier);
    await page.keyboard.press("a");
    await page.keyboard.up(modifier);
    await page.type(".cm-content", "move()\nmove()\nmove()\nmove()\nmove()\n");

    await page.click('[data-testid="run-button"]');
    await page.waitForSelector('[data-ci="inspected-test-result-view"]', { timeout: 5000 });

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Should NOT be playing (user had paused, so auto-play is disabled)
    // Wait, actually after running code, userHasPaused is reset!
    // So it SHOULD auto-play again
    const isPlayingAfterRerun = await page.evaluate(() => {
      const orchestrator = (window as any).testOrchestrator;
      return orchestrator.getStore().getState().isPlaying;
    });

    // After re-running tests, userHasPaused is reset, so should auto-play
    expect(isPlayingAfterRerun).toBe(true);
  });

  it("should reset userHasPaused flag when running tests again", async () => {
    // Run tests first
    await page.click(".cm-content");
    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.down(modifier);
    await page.keyboard.press("a");
    await page.keyboard.up(modifier);
    await page.type(".cm-content", "move()\nmove()\nmove()\nmove()\nmove()");

    await page.click('[data-testid="run-button"]');
    await page.waitForSelector('[data-ci="inspected-test-result-view"]', { timeout: 5000 });

    // Wait for auto-play
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Pause
    await page.click('[data-ci="pause-button"]');

    // Verify userHasPaused is true
    let userHasPaused = await page.evaluate(() => {
      const orchestrator = (window as any).testOrchestrator;
      return orchestrator.getStore().getState().userHasPaused;
    });
    expect(userHasPaused).toBe(true);

    // Run tests again
    await page.click('[data-testid="run-button"]');
    await page.waitForSelector('[data-ci="inspected-test-result-view"]', { timeout: 5000 });

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 300));

    // userHasPaused should be reset to false
    userHasPaused = await page.evaluate(() => {
      const orchestrator = (window as any).testOrchestrator;
      return orchestrator.getStore().getState().userHasPaused;
    });
    expect(userHasPaused).toBe(false);

    // And should be playing
    const isPlaying = await page.evaluate(() => {
      const orchestrator = (window as any).testOrchestrator;
      return orchestrator.getStore().getState().isPlaying;
    });
    expect(isPlaying).toBe(true);
  });

  it("should NOT auto-play when syntax error occurs", async () => {
    // Enter invalid code (syntax error)
    await page.click(".cm-content");
    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.down(modifier);
    await page.keyboard.press("a");
    await page.keyboard.up(modifier);
    await page.type(".cm-content", "invalid syntax here!!!");

    // Click Run Code
    await page.click('[data-testid="run-button"]');

    // Wait for error to be shown
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check that hasSyntaxError is true
    const hasSyntaxError = await page.evaluate(() => {
      const orchestrator = (window as any).testOrchestrator;
      return orchestrator.getStore().getState().hasSyntaxError;
    });
    expect(hasSyntaxError).toBe(true);

    // Check that animation is NOT playing
    const isPlaying = await page.evaluate(() => {
      const orchestrator = (window as any).testOrchestrator;
      return orchestrator.getStore().getState().isPlaying;
    });
    expect(isPlaying).toBe(false);

    // Verify no play button exists (timeline shouldn't be shown for syntax errors)
    const playButton = await page.$('[data-ci="play-button"]');
    expect(playButton).toBeNull();
  });

  it("should play timeline when user manually clicks play button after pause", async () => {
    // Run tests
    await page.click(".cm-content");
    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.down(modifier);
    await page.keyboard.press("a");
    await page.keyboard.up(modifier);
    await page.type(".cm-content", "move()\nmove()\nmove()\nmove()\nmove()");

    await page.click('[data-testid="run-button"]');
    await page.waitForSelector('[data-ci="inspected-test-result-view"]', { timeout: 5000 });

    // Wait for auto-play
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Pause
    await page.click('[data-ci="pause-button"]');

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Verify paused
    let isPlaying = await page.evaluate(() => {
      const orchestrator = (window as any).testOrchestrator;
      return orchestrator.getStore().getState().isPlaying;
    });
    expect(isPlaying).toBe(false);

    // Verify userHasPaused is true
    let userHasPaused = await page.evaluate(() => {
      const orchestrator = (window as any).testOrchestrator;
      return orchestrator.getStore().getState().userHasPaused;
    });
    expect(userHasPaused).toBe(true);

    // Now manually click play
    await page.click('[data-ci="play-button"]');

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Should start playing (manual play click resets userHasPaused)
    isPlaying = await page.evaluate(() => {
      const orchestrator = (window as any).testOrchestrator;
      return orchestrator.getStore().getState().isPlaying;
    });
    expect(isPlaying).toBe(true);

    // And userHasPaused should be reset
    userHasPaused = await page.evaluate(() => {
      const orchestrator = (window as any).testOrchestrator;
      return orchestrator.getStore().getState().userHasPaused;
    });
    expect(userHasPaused).toBe(false);
  });
});
