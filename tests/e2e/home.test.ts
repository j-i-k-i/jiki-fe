describe("Home Page E2E", () => {
  beforeAll(async () => {
    await page.goto("http://localhost:3060", {
      waitUntil: "networkidle2",
    });
  });

  it("should load the homepage", async () => {
    const title = await page.title();
    expect(title).toBeTruthy();

    const mainElement = await page.$("main");
    expect(mainElement).toBeTruthy();
  });

  it("should display welcome text", async () => {
    const welcomeText = await page.$eval("main", (el) => el.textContent);
    expect(welcomeText).toContain("Get started by editing");
  });

  it("should have interactive elements", async () => {
    const links = await page.$$("a");
    expect(links.length).toBeGreaterThan(0);
  });

  it("should be responsive", async () => {
    const viewport = page.viewport();
    expect(viewport).toBeTruthy();

    await page.setViewport({ width: 375, height: 667 });
    const mobileMain = await page.$("main");
    expect(mobileMain).toBeTruthy();

    await page.setViewport({ width: 1920, height: 1080 });
    const desktopMain = await page.$("main");
    expect(desktopMain).toBeTruthy();
  });
});
