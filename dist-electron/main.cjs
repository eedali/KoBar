"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
let mainWindow = null;
let tray = null;
let clipboardPollingInterval = null;
let lastClipboardText = '';
let lastClipboardImageDataUrl = '';
let currentEdge = 'left';
const isDev = !electron_1.app.isPackaged;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 3400,
        height: 2200,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: true,
        enableLargerThanScreen: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        }
    });
    mainWindow.setMaximumSize(10000, 10000);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    // Edge detection — ONLY fires on drop to prevent Aero Snap bugs
    mainWindow.on('moved', handleWindowMove);
}
function handleWindowMove() {
    // 50ms delay bypasses the Windows Aero Snap bug
    setTimeout(() => {
        if (!mainWindow)
            return;
        const bounds = mainWindow.getBounds();
        const windowCenter = bounds.x + (bounds.width / 2);
        const { workAreaSize } = electron_1.screen.getPrimaryDisplay();
        const newEdge = windowCenter > (workAreaSize.width / 2) ? 'right' : 'left';
        if (newEdge !== currentEdge) {
            // Sidebar is 80px. Exact jump distance is window width minus 80.
            const jumpDistance = bounds.width - 80;
            const newX = newEdge === 'right' ? bounds.x - jumpDistance : bounds.x + jumpDistance;
            mainWindow.setBounds({ x: newX, y: bounds.y, width: bounds.width, height: bounds.height });
            currentEdge = newEdge;
            mainWindow.webContents.send('edge-changed', newEdge);
        }
    }, 50);
}
// --- Clipboard Polling ---
function startClipboardPolling() {
    if (clipboardPollingInterval)
        return; // Already polling
    // Snapshot current clipboard so we don't immediately capture stale content
    lastClipboardText = electron_1.clipboard.readText() || '';
    const img = electron_1.clipboard.readImage();
    lastClipboardImageDataUrl = img.isEmpty() ? '' : img.toDataURL();
    clipboardPollingInterval = setInterval(() => {
        if (!mainWindow)
            return;
        // Check for new text
        const currentText = electron_1.clipboard.readText() || '';
        if (currentText && currentText !== lastClipboardText) {
            lastClipboardText = currentText;
            lastClipboardImageDataUrl = ''; // Reset image tracking
            mainWindow.webContents.send('clipboard-updated', {
                type: 'text',
                content: currentText,
            });
            return;
        }
        // Check for new image
        const currentImage = electron_1.clipboard.readImage();
        if (!currentImage.isEmpty()) {
            const currentDataUrl = currentImage.toDataURL();
            if (currentDataUrl !== lastClipboardImageDataUrl) {
                lastClipboardImageDataUrl = currentDataUrl;
                lastClipboardText = ''; // Reset text tracking
                mainWindow.webContents.send('clipboard-updated', {
                    type: 'image',
                    content: currentDataUrl,
                });
            }
        }
    }, 500);
}
function stopClipboardPolling() {
    if (clipboardPollingInterval) {
        clearInterval(clipboardPollingInterval);
        clipboardPollingInterval = null;
    }
}
function createTray() {
    // Use a blank native image as a placeholder for the icon
    const icon = electron_1.nativeImage.createFromBuffer(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjbQg61aAAAADUlEQVQoU2NgYGD4DwABBAEAcCBlCwAAAABJRU5ErkJggg==', 'base64'));
    tray = new electron_1.Tray(icon);
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Show/Hide KoBar',
            click: () => {
                if (mainWindow) {
                    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                electron_1.app.quit();
            }
        }
    ]);
    tray.setToolTip('KoBar');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
        if (mainWindow) {
            mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
        }
    });
}
electron_1.app.whenReady().then(() => {
    createWindow();
    createTray();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// IPC listeners
electron_1.ipcMain.on('hide-app', () => {
    if (mainWindow) {
        mainWindow.hide();
    }
});
electron_1.ipcMain.on('start-clipboard-listener', () => {
    startClipboardPolling();
});
electron_1.ipcMain.on('stop-clipboard-listener', () => {
    stopClipboardPolling();
});
electron_1.ipcMain.on('write-to-clipboard', (_event, data) => {
    if (data.type === 'text') {
        electron_1.clipboard.writeText(data.content);
    }
    else if (data.type === 'image') {
        const img = electron_1.nativeImage.createFromDataURL(data.content);
        electron_1.clipboard.writeImage(img);
    }
});
electron_1.ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
    const win = electron_1.BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.setIgnoreMouseEvents(ignore, { forward: true });
    }
});
