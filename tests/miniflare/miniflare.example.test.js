/**
 * Example test demonstrating Miniflare environment
 * This test runs in a simulated Cloudflare Workers runtime
 */

describe("Miniflare Environment", () => {
  it("should have access to Miniflare instance", () => {
    expect(global.miniflare).toBeDefined();
  });

  it("should be able to make fetch requests in Workers environment", async () => {
    const response = await global.testFetch("http://test.example.com");
    expect(response).toBeDefined();
    expect(response.status).toBe(200);

    const text = await response.text();
    expect(text).toBe("Hello from Miniflare!");
  });

  it("should have Workers-compatible globals", () => {
    // Miniflare provides Workers-compatible environment
    expect(global.testWorkerFetch).toBeDefined();
  });

  it("should support compatibility flags", () => {
    // The environment is configured with nodejs_compat flag
    // This allows using some Node.js APIs in Workers environment
    const miniflare = global.getMiniflare();
    expect(miniflare).toBeDefined();
  });
});
