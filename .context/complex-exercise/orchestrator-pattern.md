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

### 1. Orchestrator Class

Located in `components/[feature]/Orchestrator.ts`:

```typescript
class Orchestrator {
  private store: StoreApi<Store>;  // Instance-based zustand store

  constructor(id: string, initialData: any) {
    this.store = createStore(...)(); // Create store per instance
  }

  // Public methods for state mutations
  setCode(code: string) { ... }
  runCode() { ... }

  // Expose store for hooks
  getStore() { return this.store; }
}
```

### 2. React Hook

Export a hook that connects components to the orchestrator's store:

```typescript
export function useOrchestratorStore(orchestrator: Orchestrator): State {
  return useStore(
    orchestrator.getStore(),
    useShallow((state) => ({
      // Select only the state needed
    }))
  );
}
```

### 3. Component Usage

Components create a single orchestrator instance and pass it down:

```typescript
export default function ComplexComponent() {
  const orchestratorRef = useRef<Orchestrator>(
    new Orchestrator("id", initialData)
  );
  const orchestrator = orchestratorRef.current;

  // Get reactive state
  const { code, output } = useOrchestratorStore(orchestrator);

  // Pass orchestrator to child components
  return <ChildComponent orchestrator={orchestrator} />;
}
```

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

## Example: ComplexExercise

The ComplexExercise feature demonstrates this pattern:

- `components/complex-exercise/Orchestrator.ts` - Main orchestrator class
- `components/complex-exercise/ComplexExercise.tsx` - Root component
- `components/complex-exercise/CodeEditor.tsx` - Child using orchestrator
- `components/complex-exercise/RunButton.tsx` - Child using orchestrator

Each child component receives the orchestrator and uses `useOrchestratorStore(orchestrator)` to subscribe to state changes.

## Frame and Timeline System

### Frame Structure

Frames represent execution states at specific points in time:

```typescript
interface Frame {
  interpreterTime: number; // Internal interpreter clock value
  timelineTime: number; // Timeline position for animation/scrubbing
  line: number; // Line number in code
  status: "SUCCESS" | "ERROR";
  description: string; // Human-readable description
}
```

### Timeline Management

The orchestrator manages timeline state and provides methods for navigation:

```typescript
// Set the current timeline position
orchestrator.setCurrentTestTimelineTime(timelineTime: number)

// Set by interpreter time (automatically converts to timeline time)
orchestrator.setCurrentTestInterpreterTime(interpreterTime: number)

// Get nearest frame to current position
orchestrator.getNearestCurrentFrame(): Frame | null
```

### Scrubber Components

The scrubber UI is modularized into focused components:

- `Scrubber.tsx` - Main container that coordinates state
- `ScrubberInput.tsx` - Range input for timeline scrubbing
- `FrameStepperButtons.tsx` - Previous/next frame navigation

Each component receives the orchestrator and uses the enabled prop pattern:

```typescript
const isEnabled = !!currentTest && !hasCodeBeenEdited && !isSpotlightActive && frames.length >= 2;
```
