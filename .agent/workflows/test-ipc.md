---
description: Triggered by `/test-ipc [feature_name]`. Audits and verifies the Inter-Process Communication (IPC) bridge between the React frontend and the Electron main process for a specific feature (e.g., screenshot, clipboard, hide-window).
---

# WORKFLOW: IPC Bridge Verification & Testing

## Trigger
User invokes `/test-ipc [feature_name]` (e.g., `/test-ipc screenshot` or `/test-ipc copy-slot`).

## Goal
Ensure that the communication channel between the React UI and the Electron OS-level backend is strictly typed, secure (following `electron-security.md`), and functionally complete.

## Execution Steps

### Step 1: Preload Audit (`preload.ts`)
- Check if the specific method for `[feature_name]` is exposed via `contextBridge.exposeInMainWorld`.
- Verify that the exposed method is strictly typed.
- **Fail Condition:** The entire `ipcRenderer` is exposed, or the method is missing.

### Step 2: Main Process Audit (`main.ts`)
- Check if there is a corresponding `ipcMain.on` (for one-way messages) or `ipcMain.handle` (for two-way asynchronous requests) waiting for the channel name defined in the preload script.
- Verify that the OS-level API (e.g., `desktopCapturer`, `clipboard`, `BrowserWindow` controls) is correctly imported and utilized within the handler.

### Step 3: Frontend Implementation Audit
- Locate the React Component or Zustand store responsible for triggering this feature.
- Verify that it calls the global API correctly (e.g., `window.api.takeScreenshot()`).
- Verify that there are NO direct `electron` or Node.js imports in the frontend file.

### Step 4: End-to-End Resolution Report
- If all 3 layers (UI -> Preload -> Main) are correctly wired up, output a success message: `✅ IPC Bridge for [feature_name] is secure and ready.`
- If any layer is missing or misconfigured, immediately rewrite the faulty code blocks and present them to the user for implementation.