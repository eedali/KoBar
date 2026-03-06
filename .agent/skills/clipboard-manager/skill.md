---
name: kobar-clipboard-manager
description: Use this skill when building, modifying, or debugging the multi-slot copy/paste clipboard manager, FIFO queue, or clipboard slot UI states for the KoBar application.
---

# SKILL: KoBar Multi-Slot Clipboard Manager

## Context
KoBar has a unique multi-slot copy/paste mechanism that acts as a visual FIFO (First-In-First-Out) queue. The user can activate a "Copy Mode" to listen to the OS clipboard, fill visual slots sequentially, and then activate a "Paste Mode" to paste them sequentially.

## The State Machine & Visual Logic (CRITICAL)

The AI MUST implement the exact logic below using `zustand` for state management. 
A slot can be in one of these states:
1.  **Empty**: White circle.
2.  **Listening (Next to be filled)**: Blue circle.
3.  **Filled**: Green circle.
4.  **Selected for Paste**: Green circle + Red Stroke (Border).

### Copy Mode Logic
- **Default State**: All slots are Empty (White).
- **Activation**: User clicks the "Copy Button".
  - The 1st slot becomes Listening (Blue).
  - Electron backend starts polling or listening to OS `clipboard` changes.
- **On OS Copy (e.g., Ctrl+C)**: 
  - The copied data is stored in the Zustand queue.
  - The Listening (Blue) slot becomes Filled (Green).
  - The *next* Empty slot becomes Listening (Blue).
  - The corresponding slot in the Paste section also becomes Filled (Green).
- **Deactivation**: User clicks the "Copy Button" again.
  - The currently Listening (Blue) slot reverts to Empty (White).
  - The backend stops listening to the OS clipboard. Filled (Green) slots remain Green.

### Paste Mode Logic
- **Activation**: User clicks the "Paste Button".
  - The *first* Filled (Green) slot in the queue gets a Red Stroke (indicating it is the active item to be pasted).
- **On User Paste (e.g., Ctrl+V or API trigger)**:
  - The backend writes the currently selected item back to the OS clipboard to be pasted.
  - The item is removed from the FIFO queue.
  - The slot that was just pasted becomes Empty (White) and loses the Red Stroke.
  - The *next* Filled (Green) slot gets the Red Stroke.
- **Deactivation**: User clicks the "Paste Button" again.
  - The Red Stroke is removed from the active slot. No item will be pasted sequentially.

## Implementation Architecture

1.  **Electron Main Process (`main.ts`)**
    - MUST use `electron.clipboard` to read and write text, images, or files.
    - Create an IPC handler to start/stop clipboard polling.
    - Emit events to the frontend via `webContents.send` when new clipboard content is detected while in "Copy Mode".

2.  **Preload Script (`preload.ts`)**
    - Expose `window.api.onClipboardUpdate(callback)` to pass data to React.
    - Expose `window.api.startClipboardListener()` and `window.api.stopClipboardListener()`.
    - Expose `window.api.writeToClipboard(data)`.

3.  **React Frontend (`store/useClipboardStore.ts`)**
    - Build a Zustand store managing: `slots` (array of objects with type/content), `isCopyModeActive` (boolean), `isPasteModeActive` (boolean).
    - Expose actions to handle the state transitions exactly as described in the State Machine above.