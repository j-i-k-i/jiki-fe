# Scrubber and Frame System

## Overview

The scrubber is a timeline control that allows students to navigate through the execution of their code, synchronizing code frames with visual animations.

## Core Components

### Frames

Frames are generated during code execution by the custom interpreter:

- **Generation**: One frame per expression parsed
- **Timing**: Each frame increments time by 1 (represents 1ms of execution)
- **Content**: Each frame contains:
  - Status (success or error)
  - Execution details
  - Time value for synchronization

#### Frame Granularity

Expressions are parsed at a granular level. For example:

```javascript
if(1+1 == 2)  // Generates 3 frames:
              // 1. Math expression (1+1)
              // 2. Boolean expression (result == 2)
              // 3. If statement
```

### Animation Timeline

- **Library**: anime.js
- **Integration**: Exercise classes (e.g., `MazeExercise`) expose functions that trigger animations
- **Timing**: Animations are scheduled using frame time context

### Time Synchronization

- **Frame Time**: Increments by 1 per expression (conceptually 1ms)
- **Timeline Time**: anime.js timeline uses milliseconds
- **Conversion**: 1 frame time = 1ms timeline time (1:1 ratio)
- **Context**: When interpreted functions are called, they receive the current frame time to schedule animations

## Scrubber Functionality

### UI Design

- **Type**: Continuous bar (not discrete markers)
- **Controls**: Click/drag to scrub, play button for animation

### Interaction Modes

#### Manual Scrubbing

When user clicks/drags the scrubber:

1. Update current time value
2. Load corresponding frame in editor (for tooltips, highlighting)
3. Jump anime.js timeline to matching time

#### Play Mode

When user presses play:

1. Run anime.js timeline
2. Sync editor frames to follow animation progress
3. Update scrubber position to reflect current time

### Error Handling

- **Execution Errors**: Timeline stops at error frames
- **Parse Errors**: Require special handling (no frames generated)

## Implementation Considerations

### Orchestrator Pattern Integration

The scrubber should follow the orchestrator pattern:

- Pure UI component for the scrubber bar
- State management via zustand store
- Orchestrator handles synchronization between:
  - Frame state
  - Animation timeline
  - Editor highlighting
  - Scrubber position

### State Requirements

- Current time/position
- Total duration (based on frame count)
- Play/pause status
- Current frame index
- Error states
