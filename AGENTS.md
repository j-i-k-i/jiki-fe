# Instructions for coding assistants

This file provides guidance to AI agents when working with code in this repository.

## Context Files

Load the relevant context files from `.context/` directory based on your task:

- **`.context/coding-style.md`** - **ALWAYS READ THIS FIRST** - Coding style and file organization guidelines
- `.context/about-jiki.md` - Overview of Jiki platform and business model
- `.context/commands.md` - Development commands and scripts
- `.context/tech-stack.md` - Technologies, frameworks, and dependencies
- `.context/architecture.md` - Frontend architecture and design decisions
- `.context/deployment.md` - Deployment process and configuration
- `.context/git.md` - Git hooks configuration
- `.context/testing.md` - Testing setup and guidelines
- `.context/orchestrator-pattern.md` - Orchestrator pattern for complex state management

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

## Testing Guidelines

**IMPORTANT: Always read `.context/testing.md` before writing tests**

- Unit tests MUST be placed in `tests/unit/` directory
- Integration tests go in `tests/integration/` directory
- E2E tests go in `tests/e2e/` directory
- Never place test files alongside source files
- **ALWAYS run `pnpm run build` after running tests to check for TypeScript errors**

## Git Workflow

### Branching and Pull Requests

**IMPORTANT: All changes must be made on feature branches. Never commit directly to main.**

1. **Always create a feature branch** for changes:

   ```bash
   git checkout -b descriptive-branch-name
   ```

2. **After pushing a new branch, always create a Pull Request**:

   ```bash
   git push -u origin branch-name
   gh pr create --title "Clear, concise title" --body "Detailed description of changes"
   ```

   Repository: https://github.com/exercism/jiki-fe

3. **Branch naming conventions**:
   - Features: `add-feature-name` or `feature/description`
   - Fixes: `fix-issue-name` or `fix/description`
   - Documentation: `update-docs-name` or `docs/description`
   - Tests: `add-tests-name` or `test/description`

## Important Rules

1. **Documentation is current state** - All documentation in .context and AGENTS.md should reflect the current state of the codebase. Never use changelog format that documents iterative changes or corrections. Focus on documenting the current implementation.

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
