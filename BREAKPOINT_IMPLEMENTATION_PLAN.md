⏺ Plan for Implementing BreakpointStepperButtons

Based on the analysis of the existing FrameStepperButtons implementation, here's a comprehensive plan for adding BreakpointStepperButtons:

1. Core Implementation Files

A. Utility Functions (components/complex-exercise/ui/scrubber/breakpointUtils.ts)

- findPrevBreakpointFrame(currentFrame, frames, breakpoints): Find previous frame that matches a breakpoint line
- findNextBreakpointFrame(currentFrame, frames, breakpoints): Find next frame that matches a breakpoint line
- These should filter frames based on:
  - Frame line number matching breakpoint lines
  - Respecting folded lines (skip folded frames)
  - Timeline time ordering

B. Component (components/complex-exercise/ui/scrubber/BreakpointStepperButtons.tsx)

- Follow same pattern as FrameStepperButtons:
  - Props: orchestrator, enabled
  - Use useOrchestratorStore to get currentTest and breakpoints
  - Store prev/next breakpoint frames in Zustand store for performance
  - Event handlers as module-level functions
  - Buttons with proper aria-labels and disabled states

C. Orchestrator Updates (components/complex-exercise/lib/Orchestrator.ts)

- Add methods:
  - goToPrevBreakpoint(): Navigate to previous breakpoint frame
  - goToNextBreakpoint(): Navigate to next breakpoint frame
- Store updates (components/complex-exercise/lib/orchestrator/store.ts):
  - Add prevBreakpointFrame and nextBreakpointFrame to state
  - Update these when frames, breakpoints, or current frame changes

2. Unit Tests

A. Utility Tests (tests/unit/components/complex-exercise/scrubber/breakpointUtils.test.ts)

- Test finding prev/next breakpoint frames
- Handle edge cases:
  - No breakpoints set
  - Current frame is on a breakpoint
  - No matching frames for breakpoints
  - Folded lines filtering
  - Multiple breakpoints on same line

B. Component Tests (tests/unit/components/complex-exercise/scrubber/BreakpointStepperButtons.test.tsx)

Following FrameStepperButtons test pattern:

- Rendering tests:
  - Buttons render correctly
  - Proper data-ci attribute
  - Buttons hidden when no breakpoints
- Previous button tests:
  - Enabled when prev breakpoint exists
  - Disabled when no prev breakpoint
  - Disabled when enabled=false
  - Click navigates to correct frame
- Next button tests:
  - Enabled when next breakpoint exists
  - Disabled when no next breakpoint
  - Disabled when enabled=false
  - Click navigates to correct frame
- Edge cases:
  - No breakpoints (component returns null)
  - Breakpoints on non-existent lines
  - All breakpoint lines are folded

3. Integration Tests

A. Orchestrator Integration (tests/integration/complex-exercise/breakpoint-navigation.test.tsx)

- Test orchestrator methods work with real store
- Verify state updates when navigating
- Test interaction with folded lines
- Verify frame selection logic

4. E2E Tests

A. Breakpoint Stepping E2E (tests/e2e/complex-exercise/breakpoint-stepper-buttons.test.ts)

Following FrameStepperButtons E2E pattern:

- Basic navigation:
  - Set breakpoints and navigate between them
  - Skip frames without breakpoints
  - Button states update correctly
- Edge cases:
  - No breakpoints (buttons not visible)
  - Single breakpoint
  - All frames have breakpoints
- Folded lines integration:
  - Skip folded breakpoint lines
  - Update navigation when folding/unfolding
- Combined with frame stepping:
  - Both button sets work independently
  - Can mix frame and breakpoint navigation

5. Additional Considerations

A. Performance Optimizations

- Pre-calculate prev/next breakpoint frames in store
- Update only when breakpoints, frames, or folded lines change
- Avoid recalculation on every render

B. UI/UX Details

- Use same button styling as FrameStepperButtons
- Consider icon differentiation (maybe skip icons vs step icons)
- Tooltip text: "Previous breakpoint" / "Next breakpoint"
- Hide entire component when no breakpoints set

C. State Management

- Sync with existing breakpoint state from EditorManager
- React to breakpoint changes from editor clicks
- Maintain consistency with timeline/scrubber state

6. Implementation Order

1. Create utility functions with tests
1. Update store with new state fields
1. Implement component with basic functionality
1. Add unit tests for component
1. Update Orchestrator with navigation methods
1. Add integration tests
1. Create E2E test page and tests
1. Polish UI and handle edge cases

This plan ensures the BreakpointStepperButtons follows the established patterns while properly integrating with the existing breakpoint and frame navigation systems.
