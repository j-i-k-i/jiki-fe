# Orchestrator Pattern

The codebase uses an orchestrator pattern for complex components that require centralized state management.

## Navigation

- **Parent**: [Complex Exercise README](./README.md)
- **Related**:
  - [CodeMirror Integration](./codemirror.md) - Editor that uses orchestrator
  - [Scrubber Frames](./scrubber-frames.md) - Frame system managed by orchestrator
  - [Test Runner](./test-runner.md) - Test execution integrated with orchestrator
- **Context Root**: [.context/README.md](../README.md)

## Overview

The orchestrator pattern combines:

- **Zustand stores** for reactive state management
- **Class-based orchestrators** for business logic and methods
- **React hooks** for connecting components to state

## Architecture

### 1. Orchestrator Class (Facade Pattern with Composition)

Located in `components/[feature]/lib/Orchestrator.ts`:

The orchestrator uses a **facade pattern** with internal composition. It maintains a stable public API while delegating implementation to specialized internal classes.

See `components/complex-exercise/lib/Orchestrator.ts` for the implementation.

**Key Principles:**

- **Single orchestrator instance** passed around the component tree
- **Public methods persist** on orchestrator, providing stable API
- **Internal delegation** to specialized managers for implementation
- **No direct access** to internal managers from components
- **Maintains backwards compatibility** when refactoring internals
- **Lazy instantiation** of EditorManager when DOM element becomes available
- **Stable ref callbacks** for React lifecycle management
- **Direct method calls** instead of callback indirection for cleaner architecture

**Internal Managers:**

- **TimelineManager** - Handles frame navigation and timeline positioning
- **EditorManager** - Manages CodeMirror editor integration (created lazily)
- **BreakpointManager** - Handles breakpoint navigation and state

### 2. React Hook

Export a hook that connects components to the orchestrator's store using `useStore` with `useShallow` to prevent infinite render loops.

### 3. Component Usage

Components create a single orchestrator instance using `useRef`, access state via the custom hook, and pass the orchestrator to child components as a prop.

## Key Principles

1. **Instance-based stores**: Each orchestrator creates its own store to avoid global state pollution
2. **Separation of concerns**: Read operations via hooks, write operations via orchestrator methods
3. **useShallow**: Prevents infinite render loops by doing shallow equality checks
4. **Prop drilling orchestrator**: Pass the orchestrator instance to child components that need it

## Benefits

- **Encapsulation**: Store internals are hidden, only public methods exposed
- **Type safety**: Full TypeScript support for state and methods
- **Testability**: Easy to test orchestrator logic in isolation
- **Performance**: React only re-renders when selected state changes
- **Maintainability**: Internal refactoring doesn't break component contracts
- **Separation of Concerns**: Each internal manager handles one domain

## Implementation with Composition

When refactoring a large orchestrator, break it into specialized managers:

### Internal Manager Classes

Each manager is a private class that handles a specific domain:

- **EditorManager** (`orchestrator/EditorManager.ts`) - Handles all CodeMirror interactions, requires DOM element upfront, guarantees editorView exists
- **TimelineManager** (`orchestrator/TimelineManager.ts`) - Handles timeline and frame navigation, calculates frame positions

### Orchestrator as Facade

The orchestrator maintains the public API and delegates to internal managers:

- **EditorManager** created lazily when DOM element becomes available via `setupEditor()` ref callback
- **TimelineManager** created during orchestrator construction
- Public methods delegate to appropriate managers while hiding implementation details
- Returns stable ref callbacks for React lifecycle management

This ensures:

- Components only interact with the orchestrator's public methods
- Internal structure can be refactored without changing the public API
- Each manager can be tested independently
- The orchestrator remains the single source of truth passed around

## Example: ComplexExercise

The ComplexExercise feature demonstrates this pattern:

- `components/complex-exercise/Orchestrator.ts` - Main orchestrator class
- `components/complex-exercise/ComplexExercise.tsx` - Root component
- `components/complex-exercise/CodeEditor.tsx` - Child using orchestrator
- `components/complex-exercise/RunButton.tsx` - Child using orchestrator

Each child component receives the orchestrator and uses `useOrchestratorStore(orchestrator)` to subscribe to state changes.

## Frame and Timeline System

### Frame Structure

Frames represent execution states at specific points in time. See `components/complex-exercise/lib/stubs.ts` for the Frame interface definition which includes:

- `interpreterTime` - Internal interpreter clock value
- `timelineTime` - Timeline position for animation/scrubbing
- `line` - Line number in code
- `status` - SUCCESS or ERROR
- `description` - Human-readable description

### Timeline Management

The orchestrator manages timeline state and provides methods for navigation:

- `setCurrentTestTimelineTime(timelineTime: number)` - Set the current timeline position
- `setCurrentTestInterpreterTime(interpreterTime: number)` - Set by interpreter time (automatically converts to timeline time)
- `getNearestCurrentFrame(): Frame | null` - Get nearest frame to current position

### Scrubber Components

The scrubber UI is modularized into focused components:

- `Scrubber.tsx` - Main container that coordinates state
- `ScrubberInput.tsx` - Range input for timeline scrubbing
- `FrameStepperButtons.tsx` - Previous/next frame navigation

Each component receives the orchestrator and uses the enabled prop pattern based on test state, edit state, spotlight mode, and frame availability.
