# Git Configuration

## Git Hooks

This project uses Husky to manage Git hooks that ensure code quality before commits.

### Pre-commit Hook

The pre-commit hook (`.husky/pre-commit`) runs automatically before each commit and performs the following checks:

1. **Code Formatting** (💅)
   - Automatically formats staged files using Prettier
   - Only processes changed files with extensions: `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.md`
   - Formatted files are automatically re-staged

2. **Linting** (🔍)
   - Runs ESLint on the entire codebase via `pnpm run lint`
   - Blocks commit if linting errors are found

3. **Testing** (🧪)
   - Runs all tests via `pnpm test`
   - Blocks commit if any tests fail

If any check fails, the commit is aborted with an error message indicating which check failed.

### Hook Management

- Hooks are installed automatically via `pnpm install` (through the `prepare` script)
- To bypass hooks temporarily (not recommended): `git commit --no-verify`
- To modify hooks: Edit files in `.husky/` directory
