# Development Commands

## Core Commands

- `./bin/dev` or `pnpm run dev` - Start development server on port 3060
- `pnpm run build` - Build production bundle with Turbopack
- `pnpm run start` - Start production server
- `pnpm run lint` - Run ESLint for code quality checks

## Testing Commands

### Unit/Integration Tests

- `pnpm test` - Run unit tests once
- `pnpm test:watch` - Run unit tests in watch mode

### E2E Tests

- `pnpm test:e2e` - Run E2E tests in headless mode
- `pnpm test:e2e:watch` - Run E2E tests in watch mode
- `pnpm test:e2e:headful` - Run E2E tests with visible browser
- `pnpm test:all` - Run both unit and E2E tests

### E2E Setup

- `npx puppeteer browsers install chrome` - Install Chrome browser for Puppeteer (run once after clone)

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
