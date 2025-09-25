# Time Scales in Complex Exercise

The complex exercise system uses two different time scales for different purposes, with a clear separation between interpreter execution time and animation time.

## Core Concepts

### Microseconds (Interpreter Time)

- **Purpose**: Keep individual frames from consuming visible timeline space
- **Used by**: Interpreter, scrubber control, frame timestamps
- **Frame.time field**: Always in microseconds
- **Benefits**: Expressions like `if(x == 4/3)` create 4 frames but only advance 4 microseconds (0.004ms), keeping them effectively invisible on the timeline while preserving order

### Milliseconds (Animation Time)

- **Purpose**: Compatible with web animation libraries
- **Used by**: AnimeJS animations, timeline duration
- **Frame.timeInMs field**: Always in milliseconds (converted from microseconds)
- **Benefits**: Standard unit for web animations

### TIME_SCALE_FACTOR

- **Value**: 1000
- **Location**: Exported from `interpreters/src/shared/frames.ts`
- **Usage**: Convert between microseconds and milliseconds
- **Formula**: `timeInMs = time / TIME_SCALE_FACTOR`

## Implementation Details

### Frame Type Structure

```typescript
interface Frame {
  time: number; // Microseconds (interpreter time)
  timeInMs: number; // Milliseconds (animation time)
  line: number;
  status: FrameStatus;
  code: string;
  generateDescription: () => string;
  // ... other fields
}
```

### Key Components

#### TimelineManager

- Manages scrubber position in microseconds
- Converts to milliseconds when seeking AnimationTimeline
- See `components/complex-exercise/lib/orchestrator/TimelineManager.ts`

#### AnimationTimeline

- Works with milliseconds for AnimeJS compatibility
- Seeks using converted millisecond values
- See `components/complex-exercise/lib/AnimationTimeline.ts`

#### Scrubber Components

- Input range uses microseconds for fine control
- Display values may be converted to seconds for readability
- See `components/complex-exercise/ui/scrubber/`

## Testing

### Test Frame Creation

Use the `createTestFrame` factory function for consistent test data:

```typescript
import { createTestFrame } from "@/components/complex-exercise/lib/test-utils/createTestFrame";

// Create a frame at 100ms (100,000 microseconds)
const frame = createTestFrame(100000, {
  line: 5,
  generateDescription: () => "Test frame"
});
```

The factory automatically:

- Sets `time` to the provided microseconds value
- Calculates `timeInMs` by dividing by TIME_SCALE_FACTOR
- Provides sensible defaults for all required Frame fields

## Important Notes

1. **Always use TIME_SCALE_FACTOR**: Never hardcode 1000 for conversions
2. **Clear field naming**: `time` = microseconds, `timeInMs` = milliseconds
3. **Scrubber precision**: The scrubber operates in microseconds to allow fine-grained control
4. **Animation compatibility**: AnimeJS requires milliseconds, so conversion happens at the boundary

## Migration Guide

When working with time values:

1. Determine if you're dealing with microseconds or milliseconds
2. Use `Frame.time` for microseconds (interpreter/scrubber)
3. Use `Frame.timeInMs` for milliseconds (animations)
4. Import and use TIME_SCALE_FACTOR for any conversions
5. Use createTestFrame for test data to ensure consistency
