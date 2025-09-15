# Testing

## Overview

The project uses two testing approaches:

- **Unit/Integration Tests**: Jest with React Testing Library for component and logic testing
- **E2E Tests**: Puppeteer with Jest for full browser automation testing

## Test Structure

### Unit/Integration Tests

- **Location**: `tests/integration/`
- **Naming Convention**: `[feature].test.tsx` or `[feature].test.ts`
- **Example**: `tests/integration/home.test.tsx`

### E2E Tests

- **Location**: `tests/e2e/`
- **Naming Convention**: `[feature].test.ts`
- **Examples**: `tests/e2e/home.test.ts`, `tests/e2e/navigation.test.ts`

## Configuration

### Unit Test Configuration (`jest.config.mjs`)

- Uses Next.js Jest configuration as base
- Test environment: `jest-environment-jsdom` for DOM testing
- Module mapping: `@/*` resolves to project root
- Setup file: `jest.setup.js` for test environment configuration

### E2E Test Configuration

- **Jest Config**: `jest.e2e.config.mjs` - Separate Jest configuration for E2E tests
- **Puppeteer Config**: `jest-puppeteer.config.js` - Browser launch and server settings
- Test environment: `jest-environment-puppeteer`
- Automatically starts dev server on port 3060
- Headless mode by default (set `HEADLESS=false` for debugging)

### TypeScript Support

- Type definitions: `jest-dom.d.ts` provides types for jest-dom matchers
- Full TypeScript support in all test files

## Running Tests

### Unit/Integration Tests

```bash
pnpm test        # Run unit tests once
pnpm test:watch  # Run unit tests in watch mode
```

### E2E Tests

```bash
pnpm test:e2e          # Run E2E tests in headless mode
pnpm test:e2e:watch    # Run E2E tests in watch mode
pnpm test:e2e:headful  # Run E2E tests with visible browser (debugging)
```

### All Tests

```bash
pnpm test:all    # Run both unit and E2E tests
```

## Writing Tests

### Unit Test Structure

```typescript
import { render, screen } from '@testing-library/react'
import ComponentName from '@/path/to/component'

describe('Component Name', () => {
  it('renders without crashing', () => {
    render(<ComponentName />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
```

### E2E Test Structure

```typescript
describe("Feature E2E", () => {
  beforeAll(async () => {
    await page.goto("http://localhost:3060", {
      waitUntil: "networkidle2",
    });
  });

  it("performs user interaction", async () => {
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    const result = await page.$eval(".result", (el) => el.textContent);
    expect(result).toContain("Success");
  });
});
```

### Best Practices

1. **Test user behavior, not implementation details**
2. **Use semantic queries** (getByRole, getByLabelText) over test IDs
3. **Group related tests** using `describe` blocks
4. **Keep tests focused** - one assertion per test when possible
5. **Use descriptive test names** that explain what is being tested
6. **E2E tests should test critical user journeys**
7. **Keep E2E tests independent** - each test should be able to run in isolation

## CI/CD Integration

### GitHub Actions

Three separate workflows run in parallel for better performance and clarity:

- **Formatting** (`.github/workflows/formatting.yml`): Checks code style with Prettier
- **Unit Tests** (`.github/workflows/unit-tests.yml`): Runs linting and Jest unit tests with coverage
- **E2E Tests** (`.github/workflows/e2e-tests.yml`): Runs Puppeteer browser automation tests

#### Important CI Notes

- **Ubuntu Compatibility**: Workflows use `ubuntu-latest`. For Ubuntu 24.04+, use `libasound2t64` and `libgtk-3-0t64` instead of the older package names
- **Jest Command Syntax**: Use `pnpm run test --coverage --ci` (not `pnpm test -- --coverage --ci`) to avoid flags being interpreted as test patterns
- **Node Versions**: Unit tests run on Node 20.x and 22.x matrix, E2E tests run on Node 20.x only

### Git Hooks

- **Pre-commit**: Runs only unit tests (not E2E) to keep commits fast
- Configured in `.husky/pre-commit`

## Dependencies

### Unit Testing

- `jest`: Test runner
- `@testing-library/react`: React component testing utilities
- `@testing-library/jest-dom`: Custom Jest matchers for DOM assertions
- `jest-environment-jsdom`: Browser-like environment for tests

### E2E Testing

- `puppeteer`: Headless Chrome automation
- `jest-puppeteer`: Jest preset for Puppeteer integration
- `ts-jest`: TypeScript support for Jest
