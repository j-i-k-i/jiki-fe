# Development Commands

## Core Commands

- `./bin/dev` or `pnpm run dev` - Start development server on port 3060
- `npx tsc --noEmit` - Check TypeScript types (preferred for type checking)
- `pnpm run lint` - Run ESLint for code quality checks
- `pnpm run build` - Build production bundle with Turbopack (AVOID during dev - can break dev server)
- `pnpm run start` - Start production server

## Testing Commands

### Unit/Integration Tests

- `pnpm test` - Run unit tests once
- `pnpm test:watch` - Run unit tests in watch mode
- `npx tsc --noEmit` - Run after tests to check for TypeScript errors

### E2E Tests

- `pnpm test:e2e` - Run E2E tests in headless mode
- `pnpm test:e2e:watch` - Run E2E tests in watch mode
- `pnpm test:e2e:headful` - Run E2E tests with visible browser
- `pnpm test:all` - Run both unit and E2E tests

### Setup

- `npx puppeteer browsers install chrome` - Install Chrome browser for Puppeteer E2E tests (required after fresh clone)

## Code Quality Commands

### Dead Code Detection

- `npx knip` - Run knip to detect unused code, dependencies, and exports across the codebase
- `npx tsx scripts/analyze-exports.ts [file]` - Analyze specific file for unused exports and class members
- `/cleanup [target]` - Claude Code slash command for automated dead code cleanup (requires approval before changes)

## Package Management

This project uses pnpm for package management:

- `pnpm install` - Install dependencies
- `pnpm add [package]` - Add new dependency
- `pnpm remove [package]` - Remove dependency

## Development Server

The dev server runs on port 3060 by default:

- URL: http://localhost:3060
- Uses Next.js Turbopack for fast refresh
- Hot module replacement enabled

### Troubleshooting Dev Server

**ENOENT buildManifest.js.tmp errors**: If you encounter these errors after running `pnpm run build`, the dev server's Turbopack cache is corrupted. Fix by:

1. Stop the dev server (Ctrl+C)
2. Restart with `pnpm run dev` (manual restart fixes the cache)
3. Avoid running `pnpm run build` while developing - use `npx tsc --noEmit` for type checking instead
