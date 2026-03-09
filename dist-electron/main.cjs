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
const child_process_1 = require("child_process");
electron_1.app.disableHardwareAcceleration();
let mainWindow = null;
let tray = null;
let clipboardPollingInterval = null;
let lastClipboardText = '';
let lastClipboardImageDataUrl = '';
let currentEdge = 'left';
let psProcess = null;
let isGlobalPasteModeActive = false;
const isDev = !electron_1.app.isPackaged;
function createWindow() {
    const { bounds, workAreaSize } = electron_1.screen.getPrimaryDisplay();
    // We make horizontal window MASSIVE to avoid Note panel crops (6000 ensures dual 4K monitor compatibility)
    // We bind height perfectly to workAreaSize to prevent "Tile memory exceeded" and to prevent vertical crops off-screen
    const winW = 7000;
    const winH = Math.max(bounds.height, workAreaSize.height);
    // Center window over primary display exactly!
    const startX = Math.round(bounds.x + (workAreaSize.width / 2) - (winW / 2));
    const startY = bounds.y; // Pin exactly to top of screen so panels aren't offset vertically
    mainWindow = new electron_1.BrowserWindow({
        x: startX,
        y: startY,
        width: winW,
        height: winH,
        minWidth: winW,
        minHeight: winH,
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
    currentEdge = 'right'; // Set default edge
    mainWindow.setMinimumSize(4000, 200);
    mainWindow.setMaximumSize(12000, 12000);
    // Lock window parameters early
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    // Edge detection — fires during drag for smooth real-time updates
    mainWindow.on('move', handleWindowMove);
}
function handleWindowMove() {
    if (!mainWindow)
        return;
    const [x] = mainWindow.getPosition();
    const [width] = mainWindow.getSize();
    const windowCenter = x + (width / 2);
    const { workAreaSize } = electron_1.screen.getPrimaryDisplay();
    const newEdge = windowCenter > (workAreaSize.width / 2) ? 'right' : 'left';
    if (newEdge !== currentEdge) {
        currentEdge = newEdge;
        mainWindow.webContents.send('edge-changed', newEdge);
    }
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
    lastClipboardText = '';
    lastClipboardImageDataUrl = '';
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
        {
            label: 'Settings',
            click: () => {
                if (mainWindow) {
                    if (!mainWindow.isVisible())
                        mainWindow.show();
                    mainWindow.webContents.send('open-settings');
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
    psProcess = (0, child_process_1.spawn)('powershell', ['-NoProfile', '-Command', '-']);
    psProcess.stdin?.write(`Add-Type -TypeDefinition ' using System.Runtime.InteropServices; public class K { [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, uint dwExtraInfo); [DllImport("user32.dll")] public static extern short GetAsyncKeyState(int vKey); } '\n`);
    createWindow();
    createTray();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
    electron_1.app.on('will-quit', () => {
        electron_1.globalShortcut.unregisterAll();
        if (psProcess)
            psProcess.kill();
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
        lastClipboardText = data.content; // Prevent recursive copy!
    }
    else if (data.type === 'image') {
        const img = electron_1.nativeImage.createFromDataURL(data.content);
        electron_1.clipboard.writeImage(img);
        lastClipboardImageDataUrl = data.content; // Prevent recursive copy!
    }
});
electron_1.ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
    const win = electron_1.BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.setIgnoreMouseEvents(ignore, { forward: true });
    }
});
electron_1.ipcMain.on('set-global-paste-mode', (event, isActive) => {
    isGlobalPasteModeActive = isActive;
    if (isActive) {
        electron_1.globalShortcut.register('CommandOrControl+V', () => {
            if (mainWindow)
                mainWindow.webContents.send('request-next-paste');
        });
    }
    else {
        electron_1.globalShortcut.unregister('CommandOrControl+V');
        if (psProcess && psProcess.stdin) {
            psProcess.stdin.write('[K]::keybd_event(0x11, 0, 2, 0)\n[K]::keybd_event(0x10, 0, 2, 0)\n[K]::keybd_event(0x12, 0, 2, 0)\n');
        }
    }
});
electron_1.ipcMain.on('execute-global-paste', (event, data) => {
    if (data.type === 'text') {
        electron_1.clipboard.writeText(data.content);
        lastClipboardText = data.content;
    }
    else if (data.type === 'image') {
        const img = electron_1.nativeImage.createFromDataURL(data.content);
        electron_1.clipboard.writeImage(img);
        lastClipboardImageDataUrl = data.content;
    }
    electron_1.globalShortcut.unregister('CommandOrControl+V');
    const psPaste = `
$isDown = ([K]::GetAsyncKeyState(0x11) -band 0x8000) -ne 0
if (-not $isDown) { [K]::keybd_event(0x11, 0, 0, 0) }
[K]::keybd_event(0x56, 0, 0, 0)
[K]::keybd_event(0x56, 0, 2, 0)
if (-not $isDown) { [K]::keybd_event(0x11, 0, 2, 0) }
`;
    if (psProcess && psProcess.stdin) {
        psProcess.stdin.write(psPaste + '\n');
    }
    setTimeout(() => {
        if (isGlobalPasteModeActive) {
            electron_1.globalShortcut.register('CommandOrControl+V', () => {
                if (mainWindow)
                    mainWindow.webContents.send('request-next-paste');
            });
        }
    }, 100);
});
electron_1.ipcMain.on('trigger-screenshot', () => {
    if (psProcess && psProcess.stdin) {
        // VK_SNAPSHOT = 0x2C (PrintScreen)
        const psScreenshot = `
[K]::keybd_event(0x2C, 0, 0, 0)
[K]::keybd_event(0x2C, 0, 2, 0)
`;
        psProcess.stdin.write(psScreenshot + '\n');
    }
});
electron_1.ipcMain.on('move-window', (event, { dx, dy }) => {
    const win = electron_1.BrowserWindow.fromWebContents(event.sender);
    if (win) {
        const [x, y] = win.getPosition();
        win.setPosition(Math.round(x + dx), Math.round(y + dy));
    }
});
electron_1.ipcMain.handle('get-file-icon', async (event, filePath) => {
    try {
        const icon = await electron_1.app.getFileIcon(filePath, { size: 'normal' });
        return icon.toDataURL();
    }
    catch (e) {
        return null;
    }
});
electron_1.ipcMain.on('launch-file', async (event, filePath) => {
    if (!filePath || typeof filePath !== 'string') {
        console.error('Launch failed: Invalid or undefined file path received.');
        return;
    }
    try {
        const errorMessage = await electron_1.shell.openPath(filePath);
        if (errorMessage) {
            console.error('Shell error opening path:', errorMessage);
        }
    }
    catch (e) {
        console.error('Failed to launch application:', e);
    }
});
