// Miniflare-specific test setup
// This file extends the regular jest.setup.js for Miniflare tests

// Add any Miniflare-specific global test utilities here
global.getMiniflare = () => global.miniflare;

// Helper to test Workers-style fetch handlers
global.testWorkerFetch = async (url, options = {}) => {
  return global.testFetch(url, options);
};
