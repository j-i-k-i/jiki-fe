import { TestEnvironment } from "jest-environment-jsdom";
import { Miniflare } from "miniflare";

export default class MiniflareTestEnvironment extends TestEnvironment {
  constructor(config, context) {
    super(config, context);
    this.testPath = context.testPath;
    this.docblockPragmas = context.docblockPragmas;
  }

  async setup() {
    await super.setup();

    // Create Miniflare instance with Cloudflare Workers-like environment
    this.miniflare = new Miniflare({
      script: `
        addEventListener("fetch", (event) => {
          event.respondWith(new Response("Hello from Miniflare!", {
            headers: { "content-type": "text/plain" },
          }));
        });
      `,
      modules: true,
      compatibilityDate: "2024-09-23",
      compatibilityFlags: ["nodejs_compat"],
    });

    // Make Miniflare available in tests
    this.global.miniflare = this.miniflare;

    // Add fetch that uses Miniflare
    this.global.testFetch = async (input, init) => {
      return this.miniflare.dispatchFetch(input, init);
    };
  }

  async teardown() {
    await this.miniflare?.dispose();
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}
