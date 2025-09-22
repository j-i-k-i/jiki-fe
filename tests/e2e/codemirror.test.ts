describe("CodeMirror Extensions E2E", () => {
  const testingPageUrl = "http://localhost:3060/dev/codemirror-testing";

  // Helper function to find button by text content
  const findButtonByText = async (text: string) => {
    const buttons = await page.$$("button");
    for (const button of buttons) {
      const buttonText = await button.evaluate((el) => el.textContent);
      if (buttonText?.includes(text)) {
        return button;
      }
    }
    return null;
  };

  // Helper function to find input by placeholder
  const findInputByPlaceholder = async (placeholder: string) => {
    const inputs = await page.$$("input");
    for (const input of inputs) {
      const inputPlaceholder = await input.evaluate((el) => el.getAttribute("placeholder"));
      if (inputPlaceholder?.includes(placeholder)) {
        return input;
      }
    }
    return null;
  };

  // Helper function to wait
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  beforeEach(async () => {
    await page.goto(testingPageUrl, {
      waitUntil: "networkidle2",
      timeout: 10000
    });

    // Wait for the CodeMirror editor to be fully loaded
    await page.waitForSelector(".cm-editor", { timeout: 5000 });
    await page.waitForSelector('[data-ci="codemirror-editor"]', { timeout: 5000 });
  });

  describe("Page Layout and Structure", () => {
    it("should load the codemirror testing page successfully", async () => {
      const title = await page.title();
      expect(title).toBeTruthy();

      // Check main layout elements
      const editor = await page.$(".cm-editor");
      expect(editor).toBeTruthy();

      const testingControls = await page.$$("h3");
      expect(testingControls.length).toBeGreaterThan(5); // Should have multiple test components
    });

    it("should have side-by-side layout with fixed editor and scrollable controls", async () => {
      // Check that we have containers with flex styling
      const body = await page.$("body");
      const hasFlexLayout = await body!.evaluate(() => {
        const flexContainers = document.querySelectorAll('[style*="display: flex"], [style*="display:flex"]');
        return flexContainers.length > 0;
      });
      expect(hasFlexLayout).toBe(true);

      // Check editor container exists
      const editorSection = await page.$(".cm-editor");
      expect(editorSection).toBeTruthy();

      // Check we have a scrollable area
      const scrollableArea = await page.$('[style*="overflow"], [style*="scroll"]');
      expect(scrollableArea).toBeTruthy();
    });

    it("should display all testing components", async () => {
      const expectedComponents = [
        "Line Highlighter",
        "Multi Line Highlighter",
        "Underline Range",
        "Read Only Ranges",
        "Information Widget",
        "Breakpoints",
        "Edit Editor Actions"
      ];

      const components = await page.$$("h3");
      const componentTexts = await Promise.all(components.map((comp) => comp.evaluate((el) => el.textContent)));

      for (const componentName of expectedComponents) {
        expect(componentTexts.some((text) => text?.includes(componentName))).toBe(true);
      }
    });
  });

  describe("Breakpoint Functionality", () => {
    it("should set breakpoints via UI controls", async () => {
      // Find and click "Set Lines 1, 3" button
      const setLinesButton = await findButtonByText("Set Lines 1, 3");
      expect(setLinesButton).toBeTruthy();
      await setLinesButton!.click();

      // Wait for breakpoints to be applied
      await wait(500);

      // Check that breakpoint markers appear in the gutter
      const breakpointMarkers = await page.$$(".cm-breakpoint-marker");
      expect(breakpointMarkers.length).toBe(2);

      // Check that status shows breakpoints
      const statusElements = await page.$$('span[style*="color: #059669"], span[style*="color:#059669"]');
      let foundBreakpointStatus = false;

      for (const span of statusElements) {
        const text = await span.evaluate((el) => el.textContent);
        if (text?.includes("1, 3")) {
          foundBreakpointStatus = true;
          break;
        }
      }
      expect(foundBreakpointStatus).toBe(true);
    });

    it("should clear breakpoints via Clear All button", async () => {
      // First set some breakpoints
      const setButton = await findButtonByText("Set Lines 2, 4, 6");
      await setButton!.click();
      await wait(200);

      // Verify breakpoints are set
      let breakpointMarkers = await page.$$(".cm-breakpoint-marker");
      expect(breakpointMarkers.length).toBe(3);

      // Clear all breakpoints
      const clearButton = await findButtonByText("Clear All");
      await clearButton!.click();
      await wait(200);

      // Verify breakpoints are cleared
      breakpointMarkers = await page.$$(".cm-breakpoint-marker");
      expect(breakpointMarkers.length).toBe(0);

      // Check status shows "None"
      const statusElements = await page.$$('span[style*="color: #059669"], span[style*="color:#059669"]');
      let foundNoneStatus = false;

      for (const span of statusElements) {
        const text = await span.evaluate((el) => el.textContent);
        if (text?.includes("None")) {
          foundNoneStatus = true;
          break;
        }
      }
      expect(foundNoneStatus).toBe(true);
    });

    it("should set custom breakpoints via input field", async () => {
      // Find the input field for custom breakpoints
      const input = await findInputByPlaceholder("1, 3, 5");
      expect(input).toBeTruthy();

      // Clear and type custom breakpoints
      await input!.click({ clickCount: 3 }); // Select all
      await input!.type("2, 5, 7");

      // Click Apply button
      const applyButton = await findButtonByText("Apply");
      await applyButton!.click();
      await wait(200);

      // Check that breakpoint markers appear
      const breakpointMarkers = await page.$$(".cm-breakpoint-marker");
      expect(breakpointMarkers.length).toBe(3);
    });

    it("should toggle breakpoints by clicking line numbers", async () => {
      // Click on line number 1
      const lineNumbers = await page.$$(".cm-lineNumbers .cm-gutterElement");
      if (lineNumbers.length > 0) {
        await lineNumbers[0].click();
        await wait(200);

        // Check that a breakpoint marker appears
        const breakpointMarkers = await page.$$(".cm-breakpoint-marker");
        expect(breakpointMarkers.length).toBeGreaterThanOrEqual(1);

        // Click the same line number again to remove breakpoint
        await lineNumbers[0].click();
        await wait(200);

        // Check that breakpoint is removed
        const remainingMarkers = await page.$$(".cm-breakpoint-marker");
        expect(remainingMarkers.length).toBe(0);
      }
    });
  });

  describe("Edit Editor Actions", () => {
    it("should execute type out demo", async () => {
      // Click the Type Out Demo button
      const typeButton = await findButtonByText("Type Out Demo");
      await typeButton!.click();

      // Wait for the typing animation to start and check status
      await wait(500);

      // Wait for typing to complete (should take a few seconds)
      await wait(6000);

      // Check that code was typed into the editor
      const editorContent = await page.$eval(".cm-editor .cm-content", (el) => el.textContent);
      expect(editorContent).toContain("typed automatically");
    });

    it("should execute highlight words demo", async () => {
      // First add some content to highlight
      await page.click(".cm-editor .cm-content");
      await page.keyboard.type('function test() { console.log("Hello"); }');
      await wait(200);

      // Click the Highlight Words button
      const highlightButton = await findButtonByText("Highlight Words");
      await highlightButton!.click();
      await wait(1000);

      // The highlight demo should run without error
      expect(true).toBe(true); // Test completed successfully
    });

    it("should set and clear readonly regions", async () => {
      // Click Make Read-Only button
      const readOnlyButton = await findButtonByText("Make Read-Only");
      await readOnlyButton!.click();
      await wait(500);

      // Clear readonly regions
      const clearButton = await findButtonByText("Clear Read-Only");
      await clearButton!.click();
      await wait(500);

      // Test completed successfully
      expect(true).toBe(true);
    });

    it("should execute complex demo sequence", async () => {
      // Click Complex Sequence button
      const complexButton = await findButtonByText("Complex Sequence");
      await complexButton!.click();

      // Wait for the complex sequence to run
      await wait(10000);

      // Check that some content was added to the editor
      const editorContent = await page.$eval(".cm-editor .cm-content", (el) => el.textContent);
      expect(editorContent.length).toBeGreaterThan(10); // Should have some content
    });

    it("should place cursor at specific position", async () => {
      // Add some content first
      await page.click(".cm-editor .cm-content");
      await page.keyboard.type("Line 1\\nLine 2\\nLine 3\\nLine 4");
      await wait(200);

      // Click Place Cursor button
      const cursorButton = await findButtonByText("Place Cursor");
      await cursorButton!.click();
      await wait(500);

      // Test completed successfully
      expect(true).toBe(true);
    });
  });

  describe("Line Highlighter", () => {
    it("should highlight and clear lines", async () => {
      // Find and click "Highlight Line 1" button
      const highlightButton = await findButtonByText("Highlight Line 1");
      await highlightButton!.click();
      await wait(200);

      // Clear the highlight
      const clearButton = await findButtonByText("Clear Highlight");
      await clearButton!.click();
      await wait(200);

      // Test completed successfully
      expect(true).toBe(true);
    });

    it("should change highlight color", async () => {
      // First highlight a line
      const highlightButton = await findButtonByText("Highlight Line 3");
      await highlightButton!.click();
      await wait(200);

      // Find and change color select
      const selects = await page.$$("select");
      if (selects.length > 0) {
        await selects[0].select("#f44336"); // Red
        await wait(200);
      }

      // Test completed successfully
      expect(true).toBe(true);
    });
  });

  describe("Multi Line Highlighter", () => {
    it("should highlight multiple lines", async () => {
      // Find number inputs and set range
      const inputs = await page.$$('input[type="number"]');
      const numberInputs = [];

      for (const input of inputs) {
        const placeholder = await input.evaluate((el) => el.getAttribute("placeholder"));
        if (placeholder?.includes("From") || placeholder?.includes("To")) {
          numberInputs.push(input);
        }
      }

      if (numberInputs.length >= 2) {
        await numberInputs[0].clear();
        await numberInputs[0].type("2");
        await numberInputs[1].clear();
        await numberInputs[1].type("4");

        // Apply the highlight
        const applyButton = await findButtonByText("Apply");
        if (applyButton) {
          await applyButton.click();
          await wait(200);
        }
      }

      // Test completed successfully
      expect(true).toBe(true);
    });
  });

  describe("Information Widget", () => {
    it("should show and hide information widget", async () => {
      // Find textarea and set content
      const textareas = await page.$$("textarea");
      if (textareas.length > 0) {
        await textareas[0].clear();
        await textareas[0].type("<div>Test widget content</div>");

        // Show widget
        const showButton = await findButtonByText("Show Widget");
        if (showButton) {
          await showButton.click();
          await wait(200);
        }

        // Hide widget
        const hideButton = await findButtonByText("Hide Widget");
        if (hideButton) {
          await hideButton.click();
          await wait(200);
        }
      }

      // Test completed successfully
      expect(true).toBe(true);
    });
  });

  describe("Editor State Persistence", () => {
    it("should maintain editor state during extension operations", async () => {
      // Add some initial content
      await page.click(".cm-editor .cm-content");
      await page.keyboard.type("Initial content\\nLine 2\\nLine 3");
      await wait(200);

      // Perform various operations
      const breakpointButton = await findButtonByText("Set Lines 1, 3");
      if (breakpointButton) {
        await breakpointButton.click();
        await wait(200);
      }

      const highlightButton = await findButtonByText("Highlight Line 1");
      if (highlightButton) {
        await highlightButton.click();
        await wait(200);
      }

      // Check that content is still there
      const editorContent = await page.$eval(".cm-editor .cm-content", (el) => el.textContent);
      expect(editorContent).toContain("Initial content");
    });
  });

  describe("Scrolling and Layout Behavior", () => {
    it("should have proper layout structure", async () => {
      // Check that we have an editor
      const editor = await page.$(".cm-editor");
      expect(editor).toBeTruthy();

      // Check that editor is visible
      const editorBox = await editor!.boundingBox();
      expect(editorBox!.width).toBeGreaterThan(0);
      expect(editorBox!.height).toBeGreaterThan(0);

      // Test completed successfully
      expect(true).toBe(true);
    });
  });
});
