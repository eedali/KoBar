---
description: Triggered by `/build-ui`. Converts raw HTML/Tailwind prototypes (e.g., from Stitch) into production-ready, modular React + Tailwind components following clean architecture and Electron drag rules.
---

# WORKFLOW: Build React UI from Prototype

## Trigger
User invokes `/build-ui [filename.html/png]`

## Goal
Transform a raw HTML/Tailwind prototype or a design image into strictly typed, modular React Functional Components (`.tsx`), strictly adhering to the `.agent/rules/react-clean-architecture.md` file.

## Execution Steps

### Step 1: Analyze the Source
- Read the provided HTML file or analyze the provided design image.
- Identify the core layout sections (e.g., Drag Handle, Note Tabs, Rich Text Area, Clipboard Slots, Screenshot Button, Action Buttons).
- Extract all exact Tailwind utility classes, custom colors (`#f4a125`, `#1a1612`, `#f8f7f5`), and typography configurations.

### Step 2: Component Breakdown Strategy
- Do NOT output one giant `App.tsx` file.
- Plan a modular component tree (e.g., `src/components/layout/Sidebar.tsx`, `src/components/clipboard/SlotItem.tsx`, `src/components/notes/NoteEditor.tsx`).
- Present this proposed component tree to the user for a quick validation before generating the code.

### Step 3: Enforce Electron Drag Regions (CRITICAL)
- Identify the area meant for dragging the window (the top handle). Apply `className="[-webkit-app-region:drag]"`.
- For EVERY interactive element (buttons, inputs, text areas, clipboard slots), explicitly ensure `className="[-webkit-app-region:no-drag]"` is applied so they remain clickable.

### Step 4: Generate Code
- Write the `.tsx` files using React Functional Components.
- Define strict TypeScript `interface` or `type` for all props.
- For complex state (like the multi-color clipboard slots), do NOT use `useState`. Wire them up to use the empty Zustand store skeleton (which will be populated by the `kobar-clipboard-manager` skill).

### Step 5: Verification
- Review the generated code against the original HTML prototype to ensure no visual fidelity is lost.
- Confirm that no Node.js modules are imported into these UI files (as per `electron-security.md`).