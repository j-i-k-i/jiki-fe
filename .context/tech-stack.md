# Tech Stack

## Core Technologies

- **Framework**: Next.js 15.5.2 with App Router
- **Language**: TypeScript 5
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS v4
- **Package Manager**: pnpm
- **Deployment Target**: Cloudflare Workers

## Key Dependencies

- **Code Editor**: CodeMirror 6 with custom extensions
- **Animations**: anime.js 4.1.3
- **State Management**: Zustand 5.0.8
- **Markdown**: marked 16.3.0
- **Interpreters**: Custom workspace package for code execution
- **Utilities**: lodash, diff
- **Syntax Highlighting**: highlight.js with custom JikiScript support

## Development Tools

- **Linting**: ESLint 9 with Next.js config
- **Formatting**: Prettier with consistent code style
- **Testing**: Jest (unit), Puppeteer (E2E)
- **Build Tool**: webpack (Turbopack disabled due to pnpm workspace incompatibility)
- **Type Checking**: TypeScript strict mode enabled
- **Git Hooks**: Husky for pre-commit checks

## Project Structure

- `/app` - Next.js App Router pages and layouts
- `/components` - React components organized by feature
- `/utils` - Shared utility functions
- `/tests` - Test files (unit, integration, e2e)
- `/public` - Static assets
- `/scripts` - Build and development scripts
- `/bin` - Utility scripts (e.g., dev server launcher)

## Configuration

- TypeScript paths: `@/*` maps to project root
- Strict TypeScript mode enabled
- ES2022 compilation target
- Module resolution: bundler
- pnpm workspaces for monorepo structure
