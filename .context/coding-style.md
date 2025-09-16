# Coding Style Guidelines

## File Organization

### React/TypeScript Components

Components should be organized from most general to most specific, cascading from top to bottom:

1. **Imports** - At the very top
2. **Types/Interfaces** - Type definitions for the component
3. **Main Component** - The exported component function
4. **Sub-components** - Any sub-components used by the main component
5. **Helper Functions** - Utility functions at the bottom

This creates a natural reading flow where the high-level structure (JSX/TSX) is immediately visible, and implementation details are found below.

#### Example Structure

```typescript
// 1. Imports
import React, { useState } from 'react';
import { someUtility } from './utils';

// 2. Types/Interfaces
interface ComponentProps {
  title: string;
  onClick: () => void;
}

// 3. Main Component (most general - the "what")
export default function MyComponent({ title, onClick }: ComponentProps) {
  const [state, setState] = useState(0);

  const handleClick = () => {
    processData(state);
    onClick();
  };

  return (
    <div>
      <h1>{title}</h1>
      <SubComponent value={state} />
      <button onClick={handleClick}>Click</button>
    </div>
  );
}

// 4. Sub-components
function SubComponent({ value }: { value: number }) {
  return <span>{formatValue(value)}</span>;
}

// 5. Helper Functions (most specific - the "how")
function processData(data: number): void {
  // Implementation details
}

function formatValue(value: number): string {
  return `Value: ${value}`;
}
```

## Rationale

- **Readability**: Developers can quickly understand what a component does by looking at the JSX structure first
- **Maintenance**: Related logic is grouped together, with implementation details separate from structure
- **Cognitive Load**: Reduces mental overhead by presenting information in order of importance
- **Consistency**: Provides a predictable structure across all components

## Other Style Guidelines

### General TypeScript/JavaScript

- Use `const` for functions and immutable values
- Use descriptive variable names
- Keep functions small and focused on a single responsibility
- Group related functionality together

### React Specific

- Use function components with hooks (no class components)
- Extract complex logic into custom hooks
- Keep JSX readable with proper indentation
- Use semantic HTML elements

### Comments

- Write self-documenting code that doesn't need extensive comments
- Add comments only for complex business logic or non-obvious decisions
- Use JSDoc for public APIs and component props when needed
