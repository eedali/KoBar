---
trigger: always_on
---

# RULE: Electron Security & IPC Architecture

## Context
This project is an Electron desktop application with a React frontend. It requires OS-level integrations (clipboard reading, system tray, always-on-top window management, screenshot capture).

## Mandatory Directives

1. **STRICT CONTEXT ISOLATION**
   - `nodeIntegration` MUST ALWAYS be set to `false` in `BrowserWindow` webPreferences.
   - `contextIsolation` MUST ALWAYS be set to `true`.
   - The `@electron/remote` module is strictly FORBIDDEN.

2. **FRONTEND LIMITATIONS (React/UI Layer)**
   - NEVER import Node.js built-in modules (`fs`, `path`, `os`, `child_process`, etc.) inside React components or any frontend code.
   - NEVER import the `electron` module directly into the React frontend.
   - The UI layer MUST ONLY communicate with the OS/Electron backend via the globally exposed `window.api` (or a similarly named interface).

3. **PRELOAD SCRIPT (`preload.ts`)**
   - All Inter-Process Communication (IPC) must be explicitly defined and bridged using `contextBridge.exposeInMainWorld`.
   - DO NOT expose the entire `ipcRenderer` object to the window. Expose only specific, strictly-typed functions (e.g., `window.api.getClipboard()`, `window.api.hideWindow()`, `window.api.takeScreenshot()`).

4. **IPC COMMUNICATION (`main.ts` & UI)**
   - Use `ipcMain.handle` (Main) and `ipcRenderer.invoke` (Preload) for asynchronous two-way communication.
   - Use `ipcMain.on` and `ipcRenderer.send` for one-way events.
   - NEVER trust frontend data; validate all payloads received in `ipcMain` before executing OS-level commands.