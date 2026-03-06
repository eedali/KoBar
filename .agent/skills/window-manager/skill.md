---
name: kobar-window-manager
description: Use this skill when building, modifying, or debugging the Electron window settings, always-on-top behavior, drag handle, system tray, or edge-detection logic for the KoBar application.
---

# SKILL: KoBar Window & Edge Manager

## Context
KoBar is a frameless, transparent, always-on-top vertical sidebar. It can be dragged around the screen. Crucially, if the bar is dragged to the right half of the screen, the Note panel MUST open to its left. If dragged to the left half, the Note panel MUST open to its right.

## Mandatory Implementation Logic

1. **BROWSER WINDOW CONFIGURATION (`main.ts`)**
   - `frame`: `false`
   - `transparent`: `true`
   - `alwaysOnTop`: `true`, with level set to `'screen-saver'` to ensure it stays above everything.
   - `skipTaskbar`: `true` (It should only appear in the System Tray).
   - `resizable`: `false` (Size should adapt to content or be fixed).

2. **SYSTEM TRAY INTEGRATION (`main.ts`)**
   - Create a `Tray` icon.
   - Context menu must include: "Show/Hide KoBar" and "Quit".
   - Double-clicking the Tray icon should toggle window visibility.
   - The UI "Eye" button will send an IPC message (`window.api.hideApp()`) to hide the window.

3. **DRAG HANDLE & EDGE DETECTION (CRITICAL)**
   - **Frontend (UI):** The top grab area must have the CSS class or style `-webkit-app-region: drag`. Everything else MUST be `-webkit-app-region: no-drag`.
   - **Backend (`main.ts`):** - Listen to window `moved` or `move` events.
     - Use `electron.screen.getPrimaryDisplay().workAreaSize` to get the screen width.
     - Calculate the window's `x` position.
     - If `x > (screenWidth / 2)`, the app is on the Right Edge.
     - If `x <= (screenWidth / 2)`, the app is on the Left Edge.
     - Send this edge state to the frontend via `webContents.send('edge-changed', 'left' | 'right')`.
   - **Frontend React Store (`useAppStore.ts`):**
     - Listen to `window.api.onEdgeChanged`.
     - Update global state `edgePosition`.
     - The `<NotePanel />` component MUST use this state to apply Tailwind classes (e.g., `right-full` to open left, or `left-full` to open right) dynamically.

4. **NOTE PANEL TOGGLE LOGIC**
   - When the window moves across the screen centerline (changing from left to right, or right to left), if the Note panel is currently OPEN, it must auto-close, and immediately re-open on the correct opposite side to maintain a smooth UX.