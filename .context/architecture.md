# Frontend Architecture

## Overview

The Jiki frontend is a Next.js application designed for global edge deployment on Cloudflare Workers, providing a learn-to-code platform with interactive exercises and content.

## Key Architectural Decisions

### Edge Deployment

- Deployed on Cloudflare Workers for global low-latency access
- Uses Next.js Edge Runtime for compatibility
- Static assets and exercises bundled at deployment time

### Exercise System

- Exercises compiled and deployed alongside the Next.js app
- Each exercise has a standardized entry point for rendering
- "Run Code" executes tests locally using custom interpreters
- Test results and progress sent to Rails API after local execution
- API determines which exercise to show next

### Content Management

- Markdown content statically built and inserted during deployment
- Content repo pushes trigger automatic FE redeployment via GitHub Actions
- Build-time processing for optimal performance

### State Management

- User progress tracked via Rails API
- Local execution results synced to backend
- Client-side routing with linear progression (Duolingo-style)

### Internationalization

- Full i18n support for global audience
- Right-to-left (RTL) language support
- Purchasing power parity (PPP) pricing display based on location

### Performance Optimizations

- Static generation at build time
- Edge caching strategies
- Bundle optimization for exercises and content
- Mobile-first responsive design

## Project Structure

Following Next.js best practices, we use the "Store project files outside of app" strategy:

### Directory Organization

```
/app              # Only routing files (page.tsx, layout.tsx, etc.)
  /dev            # Development-only tools and utilities (blocked in production)
/components       # Reusable React components used by pages
/lib              # Utility functions and shared logic
/public           # Static assets
/middleware.ts    # Edge middleware for route protection and filtering
```

### Key Principles

- **App directory**: Contains only routing-related files - pages, layouts, loading, and error boundaries
- **Components directory**: All UI components that pages use live here, organized by feature or type
- **Separation of concerns**: Business logic, components, and utilities are kept outside the app directory
- **Clean routing**: The app directory structure directly mirrors the URL structure without clutter

This approach provides:

- Better code organization and maintainability
- Clear separation between routing and implementation
- Easier navigation and discovery of components
- Flexibility to reorganize components without affecting routing

## Development Environment

### Development-Only Routes

The `/dev` route provides access to development tools and utilities that are only available in development mode:

- **Location**: `/app/dev/` directory contains all development-specific pages
- **Protection**: Middleware at `/middleware.ts` blocks access to `/dev/*` routes in production (returns 404)
- **Detection**: Routes are available when `NODE_ENV === 'development'` or `VERCEL_ENV === 'development'`
- **Purpose**: Debug panels, component galleries, test data generators, and other dev tools
