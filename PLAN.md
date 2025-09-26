# Exercise System Restructuring Plan

## Completed ✅

### 1. Exercise System Restructured
- Created `components/exercises/` directory structure
- Basic movement exercise migrated to new structure
- Types defined for ExerciseDefinition, Task, and Scenario
- Exercise registry created with dynamic imports
- Removed `difficulty` and `tags` fields from exercise definition
- Renamed `id` to `slug` throughout exercise system

### 2. Orchestrator Simplified
- Constructor now public and takes only `ExerciseDefinition` parameter
- Removed static factory methods (`create` and `createForTesting`)
- Exercise initialization happens automatically in constructor
- Uses `exercise.slug` as the internal identifier for localStorage
- Removed need for separate `initializeExerciseData()` call

### 3. ComplexExercise Component Updated
- Loads exercise asynchronously before creating Orchestrator
- Simplified state management - uses orchestrator presence for loading state
- Clean error handling
- Uses `exerciseSlug` instead of `exerciseId`

### 4. Code Quality
- TypeScript compiles without errors for non-test files
- ESLint passes with no errors or warnings for non-test files

## Current Structure

### Directory Structure
```
components/exercises/
├── index.ts                 # Registry for all exercises
├── types.ts                 # Shared types
└── basic-movement/          # First exercise
    ├── index.ts            # Main export combining all parts
    ├── Exercise.ts         # Exercise class implementation
    ├── scenarios.ts        # Tasks and scenarios definitions
    └── metadata.json       # Exercise metadata
```

### Type Definitions (`exercises/types.ts`)
```typescript
export interface ExerciseDefinition {
  slug: string;  // Changed from 'id'
  title: string;
  instructions: string;
  estimatedMinutes: number;
  initialCode: string;
  ExerciseClass: new () => Exercise;
  tasks: Task[];
  scenarios: Scenario[];
  hints?: string[];
  solution?: string;
}
```

### Usage Pattern
```typescript
// In ComplexExercise component
const loader = exercises[exerciseSlug];
const exercise = (await loader()).default;
const orchestrator = new Orchestrator(exercise);
```

## What's Left To Do

### Test Updates (Not Started Yet)
All test files still expect the old Orchestrator constructor signature with two parameters:
- Old: `new Orchestrator("test-uuid", "initial code")`
- New: `new Orchestrator(exerciseDefinition)`

Test files that need updating include:
- Unit tests in `tests/unit/`
- Integration tests in `tests/integration/`
- Test pages in `app/test/`
- Test utilities and mocks

### Approach for Test Updates (To Be Discussed)
Options:
1. Create a mock exercise helper for tests
2. Update each test to create a proper ExerciseDefinition
3. Create a test-specific constructor helper

## Benefits Achieved
- **Simpler API**: Single constructor parameter
- **Type Safe**: ExerciseDefinition ensures all required fields
- **Cleaner initialization**: Constructor handles everything
- **Clear Separation**: Exercise loading separate from orchestrator creation
- **Consistent naming**: Using 'slug' throughout for exercise identifier
- **Maintainable**: Each exercise self-contained in its directory