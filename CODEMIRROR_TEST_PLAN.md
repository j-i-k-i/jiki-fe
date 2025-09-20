# CodeMirror Test Plan

## Current Test Coverage Summary

### ✅ What's Already Tested

#### Unit Tests (Extensions)

- **breakpoint.ts** - 20 tests covering state management, effect mapping, toggle functionality
- **clean-up-editor.ts** - 6 tests for state effects and null safety
- **js-theme.ts** - 14 tests for theme configuration and syntax highlighting
- **lineHighlighter.ts** - 19 tests for line/color state management
- **move-cursor-by-paste-length.ts** - 13 tests for paste handling and cursor positioning
- **underlineRange.ts** - 26 tests for range validation and decorations

#### Integration Tests

- **codemirror-simple.test.tsx** - Basic integration with mocked CodeMirror
- **CodeMirror.rerenders.test.tsx** - Re-render prevention tests

#### Orchestrator Tests

- **Orchestrator.test.ts** - Basic orchestrator initialization and state management
- **frameMethods.test.ts** - Frame calculation methods
- **stateAccessors.test.ts** - State accessor functions

## 🔴 Missing Tests - Critical Priority

### 1. Orchestrator-CodeMirror Integration Tests

#### Test File: `tests/integration/orchestrator-codemirror.test.tsx`

**Test Cases:**

1. **Editor Lifecycle Management**
   - Editor view is properly stored in orchestrator on mount
   - Editor view is cleared on unmount
   - Content is saved to localStorage on unmount
   - Multiple mount/unmount cycles work correctly

2. **State Synchronization**
   - Orchestrator state changes trigger CodeMirror effects
   - CodeMirror changes update orchestrator state
   - Bidirectional sync remains consistent

3. **Event Handler Integration**
   - Document changes trigger all configured handlers
   - Breakpoint changes update orchestrator state
   - Fold changes update orchestrator state
   - Handler execution order is correct

4. **Error Boundary Testing**
   - Editor mounting errors are caught and stored
   - Unhandled errors set proper flags
   - Error recovery works correctly

### 2. Extension Integration Tests

#### Test File: `tests/integration/codemirror-extensions.test.tsx`

**Test Cases:**

1. **Multi-Extension Interaction**
   - Line highlighter works with folded lines
   - Breakpoints persist through folding/unfolding
   - Readonly ranges prevent editing correctly
   - Information widgets display at correct positions

2. **Extension State Persistence**
   - Extension states survive re-renders
   - States are properly saved/loaded from localStorage
   - State conflicts are resolved correctly

3. **Performance Under Load**
   - Large documents with multiple extensions
   - Rapid state changes don't cause lag
   - Memory usage remains stable

### 3. Complex State Management Tests

#### Test File: `tests/integration/complex-state-scenarios.test.tsx`

**Test Cases:**

1. **Running Code with Breakpoints**
   - Execution stops at breakpoints
   - Line highlighting follows execution
   - Information widgets show at breakpoints
   - Folded sections are handled correctly

2. **Auto-Run Scenarios**
   - Code auto-runs on changes when enabled
   - Auto-run respects debounce timing
   - Errors during auto-run are handled
   - Auto-run can be cancelled

3. **Readonly Range Scenarios**
   - Protected code cannot be edited
   - Copy/paste respects readonly ranges
   - Readonly ranges update dynamically
   - Visual indicators show correctly

### 4. User Interaction Tests

#### Test File: `tests/integration/user-interactions.test.tsx`

**Test Cases:**

1. **Editing Operations**
   - Typing updates orchestrator state
   - Undo/redo works with custom extensions
   - Copy/paste handles special cases
   - Multi-cursor editing works

2. **Navigation and Selection**
   - Keyboard navigation works with extensions
   - Mouse selection respects readonly ranges
   - Search works across folded sections
   - Go-to-line handles folded code

3. **Visual Feedback**
   - Hover effects show correctly
   - Gutter interactions work
   - Tooltips appear at right positions
   - Theme changes apply immediately

## 🟡 Missing Tests - Medium Priority

### 5. Utility Function Tests

#### Test File: `tests/unit/components/complex-exercise/ui/codemirror/utils/*.test.ts`

**Missing Tests:**

- `scrollToLine.test.ts` - Scrolling to specific lines
- `unfoldableFunctionNames.test.ts` - Function folding logic
- `getBreakpointLines.test.ts` - Breakpoint line extraction
- `getFoldedLines.test.ts` - Folded line extraction

### 6. Hook Tests

#### Test File: `tests/unit/components/complex-exercise/ui/codemirror/hooks/*.test.tsx`

**Missing Tests:**

- `useHighlightLine.test.tsx` - Line highlighting hook
- `useHighlightLineColor.test.tsx` - Color management hook
- `useReadonlyCompartment.test.tsx` - Readonly state hook
- `useReadonlyRanges.test.tsx` - Range management hook
- `useUnderlineRange.test.tsx` - Underline state hook

### 7. Complex Extension Tests

#### Test Files in: `tests/unit/components/complex-exercise/ui/codemirror/extensions/`

**Missing Tests:**

- `multiLineHighlighter.test.ts` - Multiple line highlighting
- `fold-gutter.test.ts` - Custom folding logic
- `placeholder-widget.test.ts` - Placeholder functionality
- `information-widget.test.ts` - Information display widget
- `edit-editor/*.test.ts` - Editor animation/editing tests
- `read-only-ranges/*.test.ts` - Readonly functionality

## 🟢 Missing Tests - Lower Priority

### 8. E2E Tests

#### Test File: `tests/e2e/codemirror.test.ts`

**Test Cases:**

1. **Full User Journey**
   - Open exercise → Edit code → Run → Debug → Submit
   - Use all features in sequence
   - Verify final state matches expectations

2. **Accessibility Testing**
   - Keyboard-only navigation
   - Screen reader compatibility
   - Focus management

### 9. Performance Tests

#### Test File: `tests/performance/codemirror.test.ts`

**Test Cases:**

1. **Benchmark Tests**
   - Initial render time
   - Re-render performance
   - Large document handling
   - Memory leak detection

## Implementation Guidelines

### Test Structure

```typescript
describe("Feature Category", () => {
  describe("Specific Feature", () => {
    it("should handle specific scenario", () => {
      // Arrange
      const orchestrator = new Orchestrator("test-id", "initial code");

      // Act
      // Perform action

      // Assert
      // Verify outcome
    });
  });
});
```

### Mocking Strategy

1. **For Integration Tests**: Mock CodeMirror internals, use real Orchestrator
2. **For Unit Tests**: Mock all dependencies, test in isolation
3. **For E2E Tests**: Use real implementations with test environment

### Test Data Patterns

```typescript
// Reusable test fixtures
const mockExerciseCode = `
function solution() {
  // Test code
  return 42;
}`;

const mockReadonlyRanges = [
  { from: 0, to: 10 },
  { from: 50, to: 60 }
];

const mockBreakpoints = [5, 10, 15];
```

## Priority Execution Plan

### Phase 1 (Immediate - Critical)

1. Orchestrator-CodeMirror Integration Tests
2. Extension Integration Tests
3. Complex State Management Tests

### Phase 2 (Next Sprint)

4. User Interaction Tests
5. Utility Function Tests
6. Hook Tests

### Phase 3 (Future)

7. Complex Extension Tests
8. E2E Tests
9. Performance Tests

## Success Metrics

- **Coverage Target**: 80% for critical paths, 60% overall
- **Test Execution Time**: Under 30 seconds for unit/integration
- **Reliability**: Zero flaky tests
- **Maintainability**: Clear test names and documentation

## Notes

- Focus on testing integration points rather than implementation details
- Prioritize tests that catch real bugs users might encounter
- Keep tests isolated and independent
- Use descriptive test names that explain the scenario
- Add comments for complex test setups
- Consider visual regression tests for UI elements
