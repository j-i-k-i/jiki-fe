# Scrubber Implementation Details

## Core Components

### Scrubber.tsx

Main UI component containing:

- Play/pause button
- Range input (HTML5 slider)
- Frame stepper buttons (prev/next)
- Breakpoint stepper buttons
- Information widget toggle
- Tooltip information

### useScrubber Hook

Complex state management hook handling:

- Timeline synchronization
- Frame navigation
- Breakpoint detection
- Keyboard shortcuts
- Auto-pause on errors/breakpoints

## Key Concepts

### Timeline Time Scale

- **Frame Time**: Increments by 0.01ms per expression
- **Timeline Time**: Frame time × 100 (for integer precision)
- **TIME_TO_TIMELINE_SCALE_FACTOR**: 100
- All operations use integer timeline time to avoid floating point errors

### Frame Finding Logic

Multiple finder functions handle navigation:

```typescript
findFrameIdxNearestTimelineTime(timelineTime);
// Finds frame closest to given time, considering folded lines

findPrevFrameIdx(currentIdx);
// Finds previous non-folded frame

findNextFrame(currentIdx);
// Finds next non-folded frame

findPrevBreakpointFrame(currentIndex);
// Finds previous frame at a breakpoint line

findNextBreakpointFrame(currentIndex);
// Finds next frame at a breakpoint line

findBreakpointFrameBetweenTimes(startTime, endTime);
// Finds breakpoint frames in time range
```

### State Synchronization

Three main synchronization points:

1. **Animation Playing** (`onUpdate` callback)
   - Updates timeline value as animation progresses
   - Checks for breakpoints between frames
   - Auto-pauses at breakpoints
   - Marks timeline complete when finished

2. **Manual Scrubbing** (`handleChange`)
   - Updates timeline value from slider
   - Finds nearest frame
   - Seeks animation to that point
   - Shows information widget

3. **Frame Changes** (`useEffect` on `timelineValue`)
   - Updates highlighted line in editor
   - Updates information widget content
   - Scrolls editor to line (if widget visible)
   - Shows error details if frame has error

## Navigation Controls

### Keyboard Shortcuts

- **Arrow Left**: Previous frame
- **Arrow Right**: Next frame
- **Arrow Down**: First frame
- **Arrow Up**: Last frame
- **Spacebar**: Play/pause

### Mouse Interactions

- **Scrub**: Drag slider to navigate
- **Release**: Snaps to nearest frame
- **Frame Buttons**: Jump to prev/next frame
- **Breakpoint Buttons**: Jump to prev/next breakpoint

## Disabled States

Scrubber is disabled when:

- Code has been edited (`hasCodeBeenEdited`)
- Less than 2 frames exist
- Spotlight mode is active (`isSpotlightActive`)

## Error Handling

### Initial Error Jump

When frames change (new test run):

1. Check for first error frame
2. If breakpoint exists before error, jump there
3. Otherwise jump directly to error frame
4. Show information widget

### Error Display

Errors trigger:

- Line highlighting with error color
- Underline range for specific error location
- Information widget with error details
- Editor scroll to error line

## Breakpoint Integration

Breakpoints are editor line numbers where execution pauses:

- Stored in `editorStore.breakpoints`
- Checked during animation playback
- Skipped if line is folded
- Auto-show information widget at breakpoints

## Folded Lines

Folded lines in editor are:

- Skipped during frame navigation
- Not considered for breakpoints
- Stored in `editorStore.foldedLines`

## Information Widget

Shows frame details:

- Success: Frame description/value
- Error: Error message and details
- Controlled by `shouldShowInformationWidget`
- Auto-scrolls editor when visible

## Animation Timeline Integration

### Methods Used

- `play()`: Start animation playback
- `pause()`: Stop animation
- `seek(time)`: Jump to specific time
- `seekEndOfTimeline()`: Jump to end
- `onUpdate(callback)`: Animation progress callback

### State Tracking

- `hasPlayedOrScrubbed`: Prevents auto-reset
- `paused`: Current play state
- `completed`: Animation finished
- `progress`: Current time position
- `duration`: Total timeline length

## Range Input Styling

Dynamic gradient background shows progress:

```javascript
percentage = ((value - min) / (max - min)) * 100;
background = `linear-gradient(to right, #7128F5 ${percentage}%, #fff ${percentage}%)`;
```

## Performance Optimizations

- Update callbacks throttled to 60fps (16ms)
- Batch state updates in effects
- Use integer math for timeline calculations
- Memoized frame finding functions
