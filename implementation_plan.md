# Phase 1 - Foundation Implementation Plan

This plan scaffolds the foundational structure of the KoBar application using Electron, React, TypeScript, Vite, and Tailwind CSS. It strictly adheres to all defined constraints (`electron-security.md`, `react-clean-architecture.md`, and `window-manager` skill).

## Proposed Changes

### Configuration and Tooling

*   **Initialize Project:**
    *   Set up a Vite project with React + TypeScript template.
    *   Install necessary dependencies: `electron`, `electron-builder`, `vite`, `tailwindcss`, `postcss`, `autoprefixer`, `concurrently` (for dev script), `wait-on`, `cross-env`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`.
*   **Vite Configuration:**
    *   Update `vite.config.ts` to set the base path to `./` for Electron compatibility.
    *   Setup the build process for standard web assets.

#### [NEW] package.json
*   Define standard scripts: `dev` (runs vite and then starts electron), `build` (vite build && electron-builder).
*   Add main entry point: `"main": "dist-electron/main.js"`.

#### [NEW] tailwind.config.js / postcss.config.js
*   Initialize Tailwind CSS and Configure content paths for React components.
*   Define custom colors: Primary (`#f4a125`), Background Dark (`#1a1612`), Background Light (`#f8f7f5`).

#### [NEW] tsconfig.json / tsconfig.node.json
*   Configure TypeScript for React and Node.js environments.

---

### Electron Backend (Main Process & IPC)

#### [NEW] electron/main.ts
*   Initialize the main process.
*   Create a frameless, transparent `BrowserWindow`.
*   Configure `webPreferences` with strict security constraints: `nodeIntegration: false`, `contextIsolation: true`, and define the `preload` script path.
*   Set window constraints: `frame: false`, `transparent: true`, `alwaysOnTop: true, level: 'screen-saver'`, `skipTaskbar: true`, `resizable: false`.
*   Implement System Tray: Include a Tray icon (`kobar-icon.png`), context menu ("Show/Hide KoBar", "Quit"), and attach double-click logic to toggle window visibility.
*   Setup `ipcMain.on('hide-app', ...)` to listen for the hide message from the React frontend.

#### [NEW] electron/preload.ts
*   Implement `contextBridge.exposeInMainWorld('api', { hideApp: () => ipcRenderer.send('hide-app') })`. This enforces strict context isolation without exposing the raw `ipcRenderer`.

---

### React Frontend (UI Components & State)

#### [NEW] src/index.css
*   Import Tailwind base, components, and utilities.
*   Add global CSS to handle drag logic: `-webkit-app-region: drag` for specific classes and `-webkit-app-region: no-drag` for general interactive elements.
*   Define body background as transparent since the Electron window is transparent.

#### [NEW] src/main.tsx
*   Initialize React root.

#### [NEW] src/App.tsx
*   Build a simple placeholder UI using Tailwind.
*   Implement a vertical dark bar styling (`bg-[#1a1612]`).
*   Add a drag handle (`-webkit-app-region: drag`).
*   Add the "Eye" button (`-webkit-app-region: no-drag`) with an `onClick` that invokes `window.api.hideApp()`.

#### [NEW] src/types/global.d.ts
*   Define strict TypeScript typings for `window.api` so that `App.tsx` can compile without `any` type errors.

## Verification Plan

### Automated / Manual Verification
1.  **Run Development Server:** `npm run dev` to launch Vite and spawn the Electron application simultaneously.
2.  **Verify UI Render:** Ensure the app displays a dark vertical bar that is frameless and transparent.
3.  **Verify Dragging:** Ensure the app can be dragged via the top handle, but not via buttons.
4.  **Verify Always on Top:** Open another application (e.g., a browser) and drag it over the KoBar UI to ensure KoBar remains forcefully on top (`screen-saver` level).
5.  **Verify Tray Icon:** Check the system tray in bottom right, ensure the context menu has the right actions, and double-clicking toggles visibility correctly.
6.  **Verify IPC Hide:** Click the temporary "Eye" button on the UI and check if the Electron window correctly hides itself.

## User Review Required
Please confirm this foundational architecture layout. Once you approve, I will proceed with creating these files and getting the foundational app running.
