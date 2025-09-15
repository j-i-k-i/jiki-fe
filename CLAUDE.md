# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context Files

Load the relevant context files from `.context/` directory based on your task:

- `.context/about-jiki.md` - Overview of Jiki platform and business model
- `.context/commands.md` - Development commands and scripts
- `.context/tech-stack.md` - Technologies, frameworks, and dependencies
- `.context/architecture.md` - Frontend architecture and design decisions
- `.context/deployment.md` - Deployment process and configuration

## Quick Start

### Development

```bash
./bin/dev
```

Starts the development server on http://localhost:3060

### Build & Lint

```bash
pnpm run build   # Production build with Turbopack
pnpm run lint    # Run ESLint
```

## Project Structure

This is the frontend for Jiki, a learn-to-code platform. Key aspects:

- **Framework**: Next.js 15 with App Router, TypeScript, React 19
- **Styling**: Tailwind CSS v4
- **Deployment**: Cloudflare Workers (Edge Runtime)
- **Package Manager**: pnpm

## Architecture Highlights

- **Exercise System**: Exercises are compiled and deployed with the app, executed locally using custom interpreters
- **Content**: Markdown content is statically built at deployment time
- **State Management**: User progress synced with Rails API backend
- **i18n**: Full internationalization support with PPP pricing
- **Performance**: Edge deployment for global low-latency access

## Development Guidelines

- Use TypeScript strict mode
- Follow existing code patterns in `/app` directory
- Path alias `@/*` maps to project root
- Mobile-first responsive design
- No commits unless explicitly requested

## Important Rules

1. **Documentation is current state** - All documentation in .context and CLAUDE.md should reflect the current state of the codebase. Never use changelog format where you document the things you got wrong. Just document how things are.

   ✅ **GOOD EXAMPLE** (current state documentation):

   ```markdown
   The `/dev` route provides development-only tools.
   ```

   ❌ **BAD EXAMPLE** (changelog-style writing):

   ```markdown
   The `/dev` route provides development-only tools.
   **Note**: Folders prefixed with underscore (e.g., `_dev`) are treated as private by Next.js and don't create routes, so we use `/dev` instead.
   ```

2. **Continuous learning** - When you learn something important or make a mistake, immediately update the relevant .context file to prevent future errors
3. **Regular commits** - Git commit regularly to save progress
4. **Post-task documentation** - Before committing, always check if any .context files need updating to reflect the new state of the codebase
5. **Ask, don't guess** - Prefer asking questions over making assumptions. If multiple approaches exist, ask which to use
