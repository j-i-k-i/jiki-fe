# Scrubber Implementation Details

## Navigation

- **Parent**: [Complex Exercise README](./README.md)
- **Related**:
  - [Scrubber Frames](./scrubber-frames.md) - Frame system concepts
  - [Orchestrator Pattern](./orchestrator-pattern.md) - State management
  - [CodeMirror Integration](./codemirror.md) - Editor synchronization
- **Context Root**: [.context/README.md](../README.md)

## Architecture

The scrubber uses the orchestrator pattern for centralized state management with modular UI components.

## Core Components

### Component Structure

```
components/complex-exercise/ui/scrubber/
├── Scrubber.tsx              # Main container, coordinates state
├── ScrubberInput.tsx          # Range input for timeline scrubbing
└── FrameStepperButtons.tsx   # Previous/next frame navigation
```

### Orchestrator Integration

The orchestrator (`components/complex-exercise/lib/Orchestrator.ts`) manages:

- Timeline state synchronization
- Frame navigation logic
- Timeline time calculations
- Animation timeline integration

## Key Concepts

### Timeline Time vs Interpreter Time

- **Interpreter Time**: Internal clock value from the interpreter
- **Timeline Time**: Position on the animation timeline for UI
- Orchestrator provides conversion methods between the two

### Frame Navigation Methods

The orchestrator provides key navigation methods:

- `setCurrentTestTimelineTime(timelineTime: number)` - Set timeline position directly
- `setCurrentTestInterpreterTime(interpreterTime: number)` - Set by interpreter time (converts automatically)
- `getNearestCurrentFrame(): Frame | null` - Get nearest frame to current position
- `getCurrentFrame(): Frame | null` - Get current frame (cached for performance)

**Performance Optimization**: Previous and next frames are now calculated and stored in the Zustand store for better performance. This avoids recalculating frame positions on every render and enables efficient frame navigation.

### Component Responsibilities

1. **Scrubber.tsx**
   - Manages enabled/disabled state logic
   - Passes orchestrator to child components
   - Handles container click to focus input

2. **ScrubberInput.tsx**
   - Range input for timeline scrubbing
   - Calls `orchestrator.setCurrentTestTimelineTime` on change
   - Snaps to nearest frame on mouse release
   - Keyboard event handlers (space, arrows - TODO)

3. **FrameStepperButtons.tsx**
   - Previous/next frame navigation buttons
   - Calculates frame existence for button states
   - Calls orchestrator methods for navigation

## Navigation Controls

### Keyboard Shortcuts (TODO)

Planned keyboard shortcuts in ScrubberInput:

- **Arrow Left**: Previous frame
- **Arrow Right**: Next frame
- **Arrow Down**: First frame
- **Arrow Up**: Last frame
- **Spacebar**: Play/pause

### Mouse Interactions

- **Scrub**: Drag slider to navigate timeline
- **Release**: Snaps to nearest frame via `getNearestCurrentFrame()`
- **Frame Buttons**: Jump to prev/next frame
- **Container Click**: Focus input for keyboard control

## Enabled State Logic

The scrubber calculates enabled state based on whether there's a current test, code hasn't been edited, spotlight isn't active, and there are at least 2 frames. All child components receive this as an `enabled` prop.

## Frame Structure

See `components/complex-exercise/lib/stubs.ts` for the Frame interface which includes:

- `interpreterTime` - Internal interpreter clock
- `timelineTime` - Timeline position for UI
- `line` - Code line number
- `status` - SUCCESS or ERROR
- `description` - Human-readable description

## Range Input Calculations

### Min/Max Values

- **Min Value**: -1 for single frame, 0 for multiple frames (see `calculateMinInputValue` in ScrubberInput.tsx)
- **Max Value**: Animation duration × 100 (see `calculateMaxInputValue` in ScrubberInput.tsx)

### Frame Snapping

On mouse release, the scrubber snaps to the nearest frame:

```typescript
function handleOnMouseUp(orchestrator: Orchestrator) {
  const nearestFrame = orchestrator.getNearestCurrentFrame();
  if (nearestFrame) {
    orchestrator.setCurrentTestTimelineTime(nearestFrame.timelineTime);
  }
}
```

## Testing Strategy

Tests are organized by component responsibility:

- **Scrubber.test.tsx**: Container behavior and prop coordination
- **ScrubberInput.test.tsx**: Range input, onChange, and frame snapping
- **FrameStepperButtons.test.tsx**: Navigation button states and clicks

Each test file uses consistent mock helpers at the top for creating test data.
