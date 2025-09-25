describe("Test Runner E2E", () => {
  beforeEach(async () => {
    await page.goto("http://localhost:3070/dev/complex-exercise");
    // Wait for specific element instead of network idle to avoid timeouts
    await page.waitForSelector(".cm-editor", { timeout: 2000 });
  });

  it("should run tests and display results when clicking Run Code", async () => {
    // Clear existing code and type new code
    await page.click(".cm-content");
    // Use Meta for Mac, Control for others
    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.down(modifier);
    await page.keyboard.press("a");
    await page.keyboard.up(modifier);

    // Type the test code - 5 move() calls
    await page.type(".cm-content", "move()\nmove()\nmove()\nmove()\nmove()");

    // Click the Run Code button
    await page.click('[data-testid="run-button"]');

    // Wait for test results to appear
    await page.waitForSelector('[data-ci="inspected-test-result-view"]', { timeout: 2000 });

    // Check that test suite results show
    const testButtons = await page.$$(".test-selector-buttons .test-button");
    expect(testButtons.length).toBe(2);

    // Check test status
    const testStatus = await page.evaluate(() => {
      const buttons = document.querySelectorAll(".test-selector-buttons .test-button");
      return Array.from(buttons).map((btn) => btn.classList.contains("pass"));
    });

    // Both tests should pass
    expect(testStatus).toEqual([true, true]);

    // Check that the view container is present
    const viewContainer = await page.$("#view-container");
    expect(viewContainer).toBeTruthy();

    // Check that the exercise visualization is displayed
    const exerciseContainer = await page.$(".exercise-container");
    expect(exerciseContainer).toBeTruthy();

    // Check that the character is at the correct position
    const characterPosition = await page.evaluate(() => {
      const character = document.querySelector(".character") as HTMLElement;
      const transform = character.style.transform;
      const match = transform.match(/translateX\((\d+)px\)/);
      return match ? parseInt(match[1]) : 0;
    });

    // First test starts at 0, so after 5 moves should be at 100
    expect(characterPosition).toBe(100);
  });

  it("should show failing tests with fewer moves", async () => {
    // Clear and type insufficient moves
    await page.click(".cm-content");
    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.down(modifier);
    await page.keyboard.press("a");
    await page.keyboard.up(modifier);

    // Type only 3 moves
    await page.type(".cm-content", "move()\nmove()\nmove()");

    // Click Run Code
    await page.click('[data-testid="run-button"]');

    // Wait for test results
    await page.waitForSelector('[data-ci="inspected-test-result-view"]', { timeout: 2000 });

    // Check that tests fail
    const testStatus = await page.$eval(".test-selector-buttons", (el) => {
      const buttons = el.querySelectorAll(".test-button");
      return Array.from(buttons).map((btn) => btn.classList.contains("fail"));
    });

    // Both tests should fail
    expect(testStatus).toEqual([true, true]);

    // Check for error message
    const errorMessage = await page.$(".scenario-lhs-content");
    expect(errorMessage).toBeTruthy();
  });

  it("should switch between test scenarios when clicking test buttons", async () => {
    // Setup: Run tests first
    await page.click(".cm-content");
    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.down(modifier);
    await page.keyboard.press("a");
    await page.keyboard.up(modifier);
    await page.type(".cm-content", "move()\nmove()\nmove()\nmove()\nmove()");

    await page.click('[data-testid="run-button"]');

    // Wait for test results and buttons
    await page.waitForSelector(".test-selector-buttons .test-button", { timeout: 2000 });

    // Click second test button
    const testButtons = await page.$$(".test-selector-buttons .test-button");
    expect(testButtons.length).toBe(2);
    await testButtons[1].click();

    // Wait for view update
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Check that the character position changed (second test starts at 50)
    const characterPosition = await page.$eval(".character", (el) => {
      const htmlEl = el as HTMLElement;
      const transform = htmlEl.style.transform;
      const match = transform.match(/translateX\((\d+)px\)/);
      return match ? parseInt(match[1]) : 0;
    });

    // Second test starts at 50, so after 5 moves should be at 150
    expect(characterPosition).toBe(150);

    // Check position label
    const positionLabel = await page.$eval(".position-label", (el) => el.textContent);
    expect(positionLabel).toBe("Position: 150px");
  });

  it("should generate frames for scrubber navigation", async () => {
    // Run the tests
    await page.click(".cm-content");
    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.down(modifier);
    await page.keyboard.press("a");
    await page.keyboard.up(modifier);
    await page.type(".cm-content", "move()\nmove()\nmove()\nmove()\nmove()");

    await page.click('[data-testid="run-button"]');

    // Wait for scrubber to appear
    await page.waitForSelector('[data-testid="scrubber"]', { timeout: 2000 });

    // Check that frames were generated via the scrubber range input
    const scrubberInput = await page.$('[data-testid="scrubber-range-input"]');
    expect(scrubberInput).toBeTruthy();

    // Get the max value (total frames)
    const maxFrames = await page.$eval('[data-testid="scrubber-range-input"]', (el) => {
      const inputEl = el as HTMLInputElement;
      return parseInt(inputEl.max);
    });

    // Should have at least 5 frames (one per move() call)
    expect(maxFrames).toBeGreaterThanOrEqual(5);
  });
});
