# Testing

## Overview

The project uses Jest with React Testing Library for testing React components and application logic.

## Test Structure

- **Location**: `tests/integration/` for integration tests
- **Naming Convention**: `[feature].test.tsx` or `[feature].test.ts`
- **Example**: `tests/integration/home.test.tsx`

## Configuration

### Jest Configuration (`jest.config.mjs`)

- Uses Next.js Jest configuration as base
- Test environment: `jest-environment-jsdom` for DOM testing
- Module mapping: `@/*` resolves to project root
- Setup file: `jest.setup.js` for test environment configuration

### TypeScript Support

- Type definitions: `jest-dom.d.ts` provides types for jest-dom matchers
- Full TypeScript support in test files

## Running Tests

```bash
pnpm test        # Run all tests once
pnpm test:watch  # Run tests in watch mode
```

## Writing Tests

### Basic Test Structure

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

### Best Practices

1. **Test user behavior, not implementation details**
2. **Use semantic queries** (getByRole, getByLabelText) over test IDs
3. **Group related tests** using `describe` blocks
4. **Keep tests focused** - one assertion per test when possible
5. **Use descriptive test names** that explain what is being tested

## Dependencies

- `jest`: Test runner
- `@testing-library/react`: React component testing utilities
- `@testing-library/jest-dom`: Custom Jest matchers for DOM assertions
- `jest-environment-jsdom`: Browser-like environment for tests
