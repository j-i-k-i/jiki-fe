# Keyboard Shortcuts

Simple keyboard shortcut system with scopes and sequences.

## Basic Usage

```ts
import { keyboard } from "@/lib/keyboard";

// Register at module level (runs once)
keyboard.on(
  "cmd+s",
  (e) => {
    e.preventDefault();
    save();
  },
  { description: "Save" }
);

keyboard.on("cmd+k", () => openCommandPalette());
keyboard.on("?", () => keyboard.showHelp());
```

## Accessing Component State

Use module-level state with `useSyncExternalStore`:

```ts
let state = { count: 0 };
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function updateState(updates: Partial<typeof state>) {
  state = { ...state, ...updates };
  listeners.forEach(l => l());
}

// Register shortcuts that access state
keyboard.on("cmd+s", () => {
  console.log(`Saved! Count: ${state.count}`);
});

// In component
function MyComponent() {
  const { count } = useSyncExternalStore(subscribe, () => state);
  return <button onClick={() => updateState({ count: count + 1 })} />;
}
```

## Scopes

Activate shortcuts only in specific contexts:

```ts
import { keyboard, pushScope } from "@/lib/keyboard";

function openModal() {
  const removeScope = pushScope("modal");

  const unsubscribe = keyboard.on(
    "escape",
    () => {
      closeModal();
      removeScope();
      unsubscribe();
    },
    { scope: "modal" }
  );
}
```

## Sequences (Chords)

```ts
keyboard.on("g g", () => scrollToTop()); // Press 'g' twice
keyboard.on("g i", () => goToInbox()); // Press 'g' then 'i'
```

## Options

```ts
keyboard.on("cmd+s", handler, {
  description: "Save file", // Shows in help
  scope: "editor", // Only active in scope
  preventDefault: true, // Default: true
  stopPropagation: false, // Default: false
  enabled: true // Toggle on/off
});
```

## Cleanup

```ts
const unsubscribe = keyboard.on("cmd+s", handler);
unsubscribe(); // Remove shortcut
```

## Show Help

```ts
keyboard.showHelp(); // Shows modal with all active shortcuts
```
