# AGENTS.md

This file provides guidelines for AI agents (Claude, GitHub Copilot, etc.) when working with this codebase.

## Git Workflow Requirements

### Branch Policy

**IMPORTANT: All changes must be made on feature branches. Direct commits to `main` are not allowed.**

1. **Always create a new branch** before making changes:

   ```bash
   git checkout -b descriptive-branch-name
   ```

2. **Branch naming conventions**:
   - Features: `feature/description` or `add-feature-name`
   - Fixes: `fix/description` or `fix-issue-name`
   - Documentation: `docs/description` or `update-docs-name`
   - Tests: `test/description` or `add-tests-name`

3. **Create a pull request** after pushing changes:

   ```bash
   git push -u origin branch-name
   gh pr create --title "Clear description" --body "Detailed explanation"
   ```

4. **Never push directly to main**

## Development Guidelines

### Testing

- Write tests for new features
- Ensure all tests pass before creating a PR
- Include both unit and integration tests where appropriate

### Documentation

- Update relevant documentation when making changes
- Keep `.context/` files current with implementation details
- Update README.md for user-facing changes

### Code Quality

- Run linting before committing: `pnpm run lint`
- Format code with Prettier: `pnpm run format`
- Follow existing code patterns and conventions

## CI/CD Considerations

- All PRs trigger CI workflows (formatting, unit tests, E2E tests)
- Tests must pass before merging
- Keep commits atomic and well-described

## Context Files

When making significant changes, update relevant context files:

- `.context/architecture.md` - Architectural decisions
- `.context/testing.md` - Testing approach and guidelines
- `.context/tech-stack.md` - Technology choices
- `.context/commands.md` - Available commands

## Working with Agents

When an AI agent is working on this codebase:

1. Start by creating a feature branch
2. Make incremental, tested changes
3. Commit regularly with clear messages
4. Create a PR when feature is complete
5. Never merge without review (when possible)
