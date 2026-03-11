import { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, clipboard, globalShortcut, shell, dialog } from 'electron';
import * as path from 'path';
import { spawn, exec, ChildProcess } from 'child_process';
import { LicenseManager } from './licenseManager.cjs';
import { autoUpdater } from 'electron-updater';

// Dosyanın uygun bir yerinde (örneğin app.whenReady() içinde) test için yazdır:
console.log("BU BİLGİSAYARIN HWID KODU:", LicenseManager.getDeviceHWID());

// hardware acceleration is left ON to allow Windows DWM to properly composite the massive transparent window 
// over hardware-accelerated video players (like YouTube on Chrome) without blacking them out.
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let clipboardPollingInterval: ReturnType<typeof setInterval> | null = null;
let lastClipboardText = '';
let lastClipboardImageDataUrl = '';
let currentEdge: string = 'left';
let psProcess: ChildProcess | null = null;
let isGlobalPasteModeActive = false;

const isDev = !app.isPackaged;

function createWindow() {
    const { bounds, workArea } = screen.getPrimaryDisplay();

    // We make horizontal window MASSIVE to avoid Note panel crops (6000 ensures dual 4K monitor compatibility)
    // We bind height perfectly to workArea to prevent covering the Windows taskbar at the bottom!
    const winW = 7000;
    const winH = workArea.height;

    // Center window over primary display exactly!
    const startX = Math.round(bounds.x + (workArea.width / 2) - (winW / 2));
    const startY = workArea.y; // Pin exactly to workArea top so taskbar limits are respected

    mainWindow = new BrowserWindow({
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
        icon: path.join(__dirname, '../Assets/25px.png'),
        show: false // Don't show until ready-to-show fires
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
        mainWindow.loadURL('http://localhost:5173').catch(err => console.error("Failed to load window:", err));
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        const prodPath = path.join(__dirname, '../dist/index.html');
        console.log("Loading production URL from:", prodPath);
        mainWindow.loadFile(prodPath).catch(err => {
            dialog.showErrorBox('UI Load Error', err.message);
        });
    }

    mainWindow.once('ready-to-show', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.setAlwaysOnTop(true, 'screen-saver');
        }
    });

    // Edge detection — fires during drag for smooth real-time updates
    mainWindow.on('move', handleWindowMove);
}

function handleWindowMove() {
    if (!mainWindow) return;
    const [x] = mainWindow.getPosition();
    const [width] = mainWindow.getSize();
    const windowCenter = x + (width / 2);
    const { workAreaSize } = screen.getPrimaryDisplay();
    const newEdge = windowCenter > (workAreaSize.width / 2) ? 'right' : 'left';

    if (newEdge !== currentEdge) {
        currentEdge = newEdge;
        mainWindow.webContents.send('edge-changed', newEdge);
    }
}

// --- Clipboard Polling ---
function startClipboardPolling() {
    if (clipboardPollingInterval) return;

    lastClipboardText = clipboard.readText() || '';
    const img = clipboard.readImage();
    lastClipboardImageDataUrl = img.isEmpty() ? '' : img.toDataURL();

    clipboardPollingInterval = setInterval(() => {
        if (!mainWindow) return;

        // Check for new text
        const currentText = clipboard.readText() || '';
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
        const currentImage = clipboard.readImage();
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
    const icon = nativeImage.createFromPath(iconPath);

    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
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
                    if (!mainWindow.isVisible()) mainWindow.show();
                    mainWindow.webContents.send('open-settings');
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.quit();
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

app.whenReady().then(() => {
    psProcess = spawn('powershell', ['-NoProfile', '-Command', '-']);
    psProcess.stdin?.write(`Add-Type -TypeDefinition ' using System.Runtime.InteropServices; public class K { [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, uint dwExtraInfo); [DllImport("user32.dll")] public static extern short GetAsyncKeyState(int vKey); } '\n`);

    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    app.on('will-quit', () => {
        globalShortcut.unregisterAll();
        if (psProcess) psProcess.kill();
    });

    // Auto Updater Setup
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', () => {
        console.log('Update available.');
    });

    autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox({
            type: 'info',
            title: 'Update Ready',
            message: 'A new version has been downloaded. Restart the application to apply the updates?',
            buttons: ['Yes', 'Later']
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });

    autoUpdater.on('error', (err) => {
        console.error('Auto Updater Error:', err);
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC listeners
ipcMain.on('hide-app', () => {
    if (mainWindow) {
        mainWindow.hide();
    }
});

ipcMain.on('quit-app', () => {
    app.quit();
});

// Auto-launch at system startup
ipcMain.handle('get-auto-launch', () => {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
});

ipcMain.on('set-auto-launch', (_event, enabled: boolean) => {
    app.setLoginItemSettings({
        openAtLogin: enabled,
    });
});

ipcMain.on('start-clipboard-listener', () => {
    startClipboardPolling();
});

ipcMain.on('stop-clipboard-listener', () => {
    stopClipboardPolling();
});

ipcMain.on('write-to-clipboard', (_event, data: { type: string; content: string }) => {
    if (data.type === 'text') {
        clipboard.writeText(data.content);
        lastClipboardText = data.content;
    } else if (data.type === 'image') {
        const img = nativeImage.createFromDataURL(data.content);
        clipboard.writeImage(img);
        lastClipboardImageDataUrl = data.content;
    }
});

ipcMain.on('set-ignore-mouse-events', (event, ignore: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.setIgnoreMouseEvents(ignore, { forward: true });
    }
});

ipcMain.on('set-global-paste-mode', (event, isActive) => {
    isGlobalPasteModeActive = isActive;
    if (isActive) {
        globalShortcut.register('CommandOrControl+V', () => {
            if (mainWindow) mainWindow.webContents.send('request-next-paste');
        });
    } else {
        globalShortcut.unregister('CommandOrControl+V');
        if (psProcess && psProcess.stdin) {
            psProcess.stdin.write('[K]::keybd_event(0x11, 0, 2, 0)\n[K]::keybd_event(0x10, 0, 2, 0)\n[K]::keybd_event(0x12, 0, 2, 0)\n');
        }
    }
});

ipcMain.on('execute-global-paste', (event, data) => {
    if (data.type === 'text') {
        clipboard.writeText(data.content);
        lastClipboardText = data.content;
    } else if (data.type === 'image') {
        const img = nativeImage.createFromDataURL(data.content);
        clipboard.writeImage(img);
        lastClipboardImageDataUrl = data.content;
    }
    globalShortcut.unregister('CommandOrControl+V');

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
            globalShortcut.register('CommandOrControl+V', () => {
                if (mainWindow) mainWindow.webContents.send('request-next-paste');
            });
        }
    }, 200);
});

ipcMain.on('trigger-screenshot', () => {
    if (psProcess && psProcess.stdin) {
        // VK_SNAPSHOT = 0x2C (PrintScreen)
        const psScreenshot = `
[K]::keybd_event(0x2C, 0, 0, 0)
[K]::keybd_event(0x2C, 0, 2, 0)
`;
        psProcess.stdin.write(psScreenshot + '\n');
    }
});

ipcMain.on('move-window', (event, { dx, dy }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        const [x, y] = win.getPosition();
        win.setPosition(Math.round(x + dx), Math.round(y + dy));
    }
});

ipcMain.handle('get-file-icon', async (_event, filePath: string) => {
    try {
        // Step A: Resolve target path for .lnk shortcut files
        let targetPath = filePath;
        if (filePath.toLowerCase().endsWith('.lnk')) {
            targetPath = await new Promise<string>((resolve) => {
                const psScript = `
                $shell = New-Object -ComObject WScript.Shell
                $link = $shell.CreateShortcut("${filePath}")
                $link.TargetPath
                `;
                exec(`powershell -NoProfile -Command "${psScript}"`, (error, stdout) => {
                    if (error || !stdout.trim()) {
                        resolve(filePath); // Fallback to original path
                        return;
                    }
                    resolve(stdout.trim());
                });
            });
        }

        // Step B: Use Electron's native API to get the file icon
        const icon = await app.getFileIcon(targetPath, { size: 'large' });
        return icon.toDataURL();
    } catch (e) {
        console.error('Failed to get file icon:', e);
        return null;
    }
});

ipcMain.on('launch-file', async (event, filePath) => {
    if (!filePath || typeof filePath !== 'string') {
        console.error('Launch failed: Invalid or undefined file path received.');
        return;
    }
    try {
        const errorMessage = await shell.openPath(filePath);
        if (errorMessage) {
            console.error('Shell error opening path:', errorMessage);
        }
    } catch (e) {
        console.error('Failed to launch application:', e);
    }
});

import * as fs from 'fs';
ipcMain.handle('get-melody-audio', (_event, melodyName: string) => {
    try {
        const audioPath = path.join(__dirname, '../Assets/Melody', `${melodyName}.ogg`);
        if (fs.existsSync(audioPath)) {
            const buf = fs.readFileSync(audioPath);
            return `data:audio/ogg;base64,${buf.toString('base64')}`;
        }
        return null;
    } catch (e) {
        console.error('Failed to load melody audio:', e);
        return null;
    }
});

// IPC map to expose the Hardware ID synchronously generated from LicenseManager
ipcMain.handle('get-hwid', () => {
    return LicenseManager.getDeviceHWID();
});
