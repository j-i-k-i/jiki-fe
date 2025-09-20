describe("Orchestrator-CodeMirror E2E", () => {
  beforeEach(async () => {
    await page.goto("http://localhost:3060/test/complex-exercise/orchestrator-codemirror");
  });

  it("should render the CodeMirror editor with initial code", async () => {
    // Wait for the editor container to be visible
    await page.waitForSelector("#editor-container");

    // Wait for CodeMirror to render (it has a cm-editor class)
    await page.waitForSelector(".cm-editor");

    // Check that the initial code is displayed
    const codeContent = await page.evaluate(() => {
      const cmContent = document.querySelector(".cm-content");
      return cmContent?.textContent;
    });

    expect(codeContent).toContain("// Initial code");
    expect(codeContent).toContain("const x = 42");
  });

  it("should toggle breakpoint when clicking on line numbers", async () => {
    // Wait for CodeMirror to be ready
    await page.waitForSelector(".cm-editor");
    await page.waitForSelector(".cm-lineNumbers");

    // Wait for breakpoint gutter to be ready
    await page.waitForSelector(".cm-breakpoint-gutter");

    // Count initial breakpoint markers
    const getBreakpointCount = async () => {
      return await page.evaluate(() => {
        return document.querySelectorAll(".cm-breakpoint-marker").length;
      });
    };

    const initialCount = await getBreakpointCount();

    // Click on line number 2 to add a breakpoint
    await page.click(".cm-lineNumbers .cm-gutterElement:nth-child(2)");

    // Wait for breakpoint count to increase
    await page.waitForFunction(
      (expected) => document.querySelectorAll(".cm-breakpoint-marker").length === expected,
      { timeout: 2000 },
      initialCount + 1
    );

    // Verify breakpoint was added
    let currentCount = await getBreakpointCount();
    expect(currentCount).toBe(initialCount + 1);

    // Click again to remove the breakpoint
    await page.click(".cm-lineNumbers .cm-gutterElement:nth-child(2)");

    // Wait for breakpoint count to decrease
    await page.waitForFunction(
      (expected) => document.querySelectorAll(".cm-breakpoint-marker").length === expected,
      { timeout: 2000 },
      initialCount
    );

    // Verify breakpoint was removed
    currentCount = await getBreakpointCount();
    expect(currentCount).toBe(initialCount);
  });
});
