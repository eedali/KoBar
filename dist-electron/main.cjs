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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
// @ts-expect-error icon-extractor does not have types
const icon_extractor_1 = __importDefault(require("icon-extractor"));
const licenseManager_cjs_1 = require("./licenseManager.cjs");
const electron_updater_1 = require("electron-updater");
// Dosyanın uygun bir yerinde (örneğin app.whenReady() içinde) test için yazdır:
console.log("BU BİLGİSAYARIN HWID KODU:", licenseManager_cjs_1.LicenseManager.getDeviceHWID());
// hardware acceleration is left ON to allow Windows DWM to properly composite the massive transparent window 
// over hardware-accelerated video players (like YouTube on Chrome) without blacking them out.
electron_1.app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
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
    const { bounds, workArea } = electron_1.screen.getPrimaryDisplay();
    // We make horizontal window MASSIVE to avoid Note panel crops (6000 ensures dual 4K monitor compatibility)
    // We bind height perfectly to workArea to prevent covering the Windows taskbar at the bottom!
    const winW = 7000;
    const winH = workArea.height;
    // Center window over primary display exactly!
    const startX = Math.round(bounds.x + (workArea.width / 2) - (winW / 2));
    const startY = workArea.y; // Pin exactly to workArea top so taskbar limits are respected
    mainWindow = new electron_1.BrowserWindow({
        x: startX,
        y: startY,
        width: winW,
        height: winH,
        minWidth: winW,
        minHeight: winH,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        opacity: 0.999, // CRITICAL: This bypasses Windows DWM 'MPO' (Multi-Plane Overlay) occlusion bug, fixing black YouTube screens!
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: true,
        enableLargerThanScreen: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        },
        icon: path.join(__dirname, '../Assets/25px.png')
    });
    currentEdge = 'right'; // Set default edge
    mainWindow.setMinimumSize(4000, 200);
    mainWindow.setMaximumSize(12000, 12000);
    // Lock window parameters early
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
    // Forcefully keep window above all OS elements (including Windows Taskbar)
    // Windows frequently demotes always-on-top windows when the Taskbar is clicked.
    setInterval(() => {
        if (mainWindow) {
            mainWindow.setAlwaysOnTop(true, 'screen-saver');
        }
    }, 1500);
    // Re-assert alwaysOnTop on focus/show just to be instant
    mainWindow.on('focus', () => {
        mainWindow?.setAlwaysOnTop(true, 'screen-saver');
    });
    mainWindow.on('show', () => {
        mainWindow?.setAlwaysOnTop(true, 'screen-saver');
    });
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
        return;
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
            lastClipboardImageDataUrl = '';
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
                lastClipboardText = '';
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
    const iconPath = path.join(__dirname, '../Assets/25px.png');
    const icon = electron_1.nativeImage.createFromPath(iconPath);
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
    // Auto Updater Setup
    electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
    electron_updater_1.autoUpdater.on('update-available', () => {
        console.log('Update available.');
    });
    electron_updater_1.autoUpdater.on('update-downloaded', () => {
        electron_1.dialog.showMessageBox({
            type: 'info',
            title: 'Update Ready',
            message: 'A new version has been downloaded. Restart the application to apply the updates?',
            buttons: ['Yes', 'Later']
        }).then((result) => {
            if (result.response === 0) {
                electron_updater_1.autoUpdater.quitAndInstall();
            }
        });
    });
    electron_updater_1.autoUpdater.on('error', (err) => {
        console.error('Auto Updater Error:', err);
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
electron_1.ipcMain.on('quit-app', () => {
    electron_1.app.quit();
});
// Auto-launch at system startup
electron_1.ipcMain.handle('get-auto-launch', () => {
    const settings = electron_1.app.getLoginItemSettings();
    return settings.openAtLogin;
});
electron_1.ipcMain.on('set-auto-launch', (_event, enabled) => {
    electron_1.app.setLoginItemSettings({
        openAtLogin: enabled,
    });
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
        lastClipboardText = data.content;
    }
    else if (data.type === 'image') {
        const img = electron_1.nativeImage.createFromDataURL(data.content);
        electron_1.clipboard.writeImage(img);
        lastClipboardImageDataUrl = data.content;
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
    }, 200);
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
    return new Promise((resolve) => {
        // Step A: Resolve target path for .lnk files
        if (filePath.toLowerCase().endsWith('.lnk')) {
            const psScript = `
            $shell = New-Object -ComObject WScript.Shell
            $link = $shell.CreateShortcut("${filePath}")
            $link.TargetPath
            `;
            (0, child_process_1.exec)(`powershell -NoProfile -Command "${psScript}"`, (error, stdout) => {
                if (error || !stdout.trim()) {
                    resolve(null); // Fallback if link resolution fails
                    return;
                }
                const targetPath = stdout.trim();
                // Step B: Get the icon for the target EXE
                extractIcon(targetPath, resolve);
            });
        }
        else {
            // It's a direct .exe or other file, get its icon directly
            extractIcon(filePath, resolve);
        }
    });
});
// Helper function to extract and convert the icon to base64
function extractIcon(filePath, resolve) {
    const contextId = Math.random().toString(36).substring(7);
    icon_extractor_1.default.getIcon(contextId, filePath);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onIconResponse = (data) => {
        if (data.Context === contextId) {
            resolve(`data:image/png;base64,${data.Base64ImageData}`);
            icon_extractor_1.default.emitter.removeListener('icon', onIconResponse); // Cleanup
        }
    };
    icon_extractor_1.default.emitter.on('icon', onIconResponse);
}
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
const fs = __importStar(require("fs"));
electron_1.ipcMain.handle('get-melody-audio', (_event, melodyName) => {
    try {
        const audioPath = path.join(__dirname, '../Assets/Melody', `${melodyName}.ogg`);
        if (fs.existsSync(audioPath)) {
            const buf = fs.readFileSync(audioPath);
            return `data:audio/ogg;base64,${buf.toString('base64')}`;
        }
        return null;
    }
    catch (e) {
        console.error('Failed to load melody audio:', e);
        return null;
    }
});
// IPC map to expose the Hardware ID synchronously generated from LicenseManager
electron_1.ipcMain.handle('get-hwid', () => {
    return licenseManager_cjs_1.LicenseManager.getDeviceHWID();
});
