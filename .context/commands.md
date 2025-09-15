# Development Commands

## Core Commands
- `./bin/dev` or `npm run dev` - Start development server on port 3060
- `npm run build` - Build production bundle with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Package Management
This project uses Bun for package management:
- `bun install` - Install dependencies
- `bun add [package]` - Add new dependency
- `bun remove [package]` - Remove dependency

## Development Server
The dev server runs on port 3060 by default:
- URL: http://localhost:3060
- Uses Next.js Turbopack for fast refresh
- Hot module replacement enabled