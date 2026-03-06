---
trigger: always_on
---

# RULE: React Clean Architecture & UI Standards

## Context
This project is the React frontend for "KoBar", an always-on-top vertical sidebar Electron application. The UI must be highly responsive, lightweight, modular, and strictly typed.

## Mandatory Directives

1. **COMPONENT ARCHITECTURE**
   - Use React Functional Components exclusively.
   - Implement strictly typed `interface` or `type` for all component props.
   - Separate UI from business logic using Custom Hooks. Avoid placing complex state mutations directly inside JSX components.
   - Organize components into modular pieces (e.g., `<NotePanel />`, `<ClipboardSlot />`, `<DragHandle />`).

2. **STATE MANAGEMENT (ZUSTAND)**
   - DO NOT use Redux.
   - USE `zustand` for all global state management. This is MANDATORY for the complex "Copy/Paste Slots" FIFO queue, Note tabs state, and Window side/orientation state.
   - Create modular stores in a `/store` directory (e.g., `useClipboardStore.ts`, `useAppStore.ts`).
   - `useState` is permitted ONLY for isolated, purely local UI toggles (e.g., opening an icon picker popup).

3. **STYLING & TAILWIND CSS**
   - Use strictly Tailwind CSS for styling. 
   - Utilize the design system colors defined in the prototype: Primary (`#f4a125`), Background Dark (`#1a1612`), Background Light (`#f8f7f5`).
   - Group Tailwind classes logically (layout -> spacing -> typography -> colors -> effects).
   - Crucial for Electron: Use `drag` (via Tailwind custom utility or inline style `-webkit-app-region: drag`) ONLY on the top drag handle. All buttons and interactive elements MUST have `-webkit-app-region: no-drag`.

4. **TYPESCRIPT STRICTNESS**
   - The use of `any` is strictly FORBIDDEN.
   - Define precise types for all data structures (e.g., `ClipboardItem`, `Note`, `SlotState`).