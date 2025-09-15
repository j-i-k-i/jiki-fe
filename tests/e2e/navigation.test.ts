describe("Navigation E2E", () => {
  beforeEach(async () => {
    await page.goto("http://localhost:3060", {
      waitUntil: "networkidle2",
    });
  });

  it("should navigate between pages", async () => {
    const links = await page.$$eval('a[href^="/"]', (links) =>
      links.map((link) => ({
        href: link.getAttribute("href"),
        text: link.textContent,
      }))
    );

    for (const link of links.slice(0, 3)) {
      if (link.href && !link.href.includes("http")) {
        await page.goto(`http://localhost:3060${link.href}`, {
          waitUntil: "networkidle2",
        });

        const url = page.url();
        expect(url).toContain(link.href);

        await page.goBack();
      }
    }
  });

  it("should handle 404 pages gracefully", async () => {
    await page.goto("http://localhost:3060/non-existent-page", {
      waitUntil: "networkidle2",
    });

    const body = await page.$("body");
    expect(body).toBeTruthy();
  });

  it("should measure page load performance", async () => {
    const startTime = Date.now();
    await page.goto("http://localhost:3060", {
      waitUntil: "load",
    });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
  });
});
