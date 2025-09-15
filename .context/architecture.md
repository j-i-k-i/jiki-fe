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