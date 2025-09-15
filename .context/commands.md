# Development Commands

## Core Commands
- `./bin/dev` or `pnpm run dev` - Start development server on port 3060
- `pnpm run build` - Build production bundle with Turbopack
- `pnpm run start` - Start production server
- `pnpm run lint` - Run ESLint for code quality checks

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