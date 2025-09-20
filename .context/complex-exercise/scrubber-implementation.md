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

```typescript
// Set timeline position directly
orchestrator.setCurrentTestTimelineTime(timelineTime: number)

// Set by interpreter time (converts automatically)
orchestrator.setCurrentTestInterpreterTime(interpreterTime: number)

// Get nearest frame to current position
orchestrator.getNearestCurrentFrame(): Frame | null

// Get current frame (cached for performance)
orchestrator.getCurrentFrame(): Frame | null
```

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

The scrubber uses a single-line enabled calculation:

```typescript
const isEnabled = !!currentTest && !hasCodeBeenEdited && !isSpotlightActive && frames.length >= 2;
```

All child components receive this as an `enabled` prop.

## Frame Structure

```typescript
interface Frame {
  interpreterTime: number; // Internal interpreter clock
  timelineTime: number; // Timeline position for UI
  line: number; // Code line number
  status: "SUCCESS" | "ERROR";
  description: string; // Human-readable description
}
```

## Range Input Calculations

### Min/Max Values

```typescript
// Min: -1 for single frame, 0 for multiple frames
function calculateMinInputValue(frames: Frame[]) {
  return frames.length < 2 ? -1 : 0;
}

// Max: Animation duration * 100
function calculateMaxInputValue(animationTimeline: AnimationTimeline) {
  return Math.round(animationTimeline.duration * 100);
}
```

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
