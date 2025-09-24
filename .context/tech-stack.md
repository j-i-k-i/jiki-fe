# Tech Stack

## Core Technologies

- **Framework**: Next.js 15.5.2 with App Router
- **Language**: TypeScript 5
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS v4
- **Package Manager**: pnpm
- **Deployment Target**: Cloudflare Workers

## Development Tools

- **Linting**: ESLint 9 with Next.js config
- **Build Tool**: webpack (Turbopack disabled due to pnpm workspace incompatibility)
- **Type Checking**: TypeScript strict mode enabled

## Project Structure

- `/app` - Next.js App Router pages and layouts
- `/public` - Static assets
- `/bin` - Utility scripts (e.g., dev server launcher)

## Configuration

- TypeScript paths: `@/*` maps to project root
- Strict TypeScript mode enabled
- ES2022 compilation target
- Module resolution: bundler
