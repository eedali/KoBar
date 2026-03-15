import { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, clipboard, globalShortcut, shell, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, exec, ChildProcess } from 'child_process';
import { LicenseManager } from './licenseManager.cjs';
import { autoUpdater } from 'electron-updater';

// Dosyanın uygun bir yerinde (örneğin app.whenReady() içinde) test için yazdır:
console.log("BU BİLGİSAYARIN HWID KODU:", LicenseManager.getDeviceHWID());

app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.disableHardwareAcceleration();

const windowStatePath = path.join(app.getPath('userData'), 'window-state.json');

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let clipboardPollingInterval: ReturnType<typeof setInterval> | null = null;
let lastClipboardText = '';
let lastClipboardImageDataUrl = '';
let currentEdge: string = 'left';
let psProcess: ChildProcess | null = null;
let isGlobalPasteModeActive = false;

// Set this to true for Microsoft Store releases (disables custom licensing & updates)
const IS_STORE_BUILD = true;

const isDev = !app.isPackaged;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 3400,
        height: 2200,
        minWidth: 3400,
        minHeight: 2200,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        maximizable: false,
        enableLargerThanScreen: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        }
    });

    mainWindow.setMinimumSize(3400, 2200);
    mainWindow.setMaximumSize(10000, 10000);
    mainWindow.setSize(3400, 2200);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setIgnoreMouseEvents(true, { forward: true });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Edge detection — fires during drag for smooth real-time updates
    mainWindow.on('move', () => handleWindowMove());

    mainWindow.once('ready-to-show', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.setAlwaysOnTop(true, 'screen-saver');
            handleWindowMove(true);
        }
    });

    let saveBoundsTimeout: ReturnType<typeof setTimeout>;
    mainWindow.on('move', () => {
        clearTimeout(saveBoundsTimeout);
        saveBoundsTimeout = setTimeout(() => {
            if (!mainWindow) return;
            const [x, y] = mainWindow.getPosition();
            fs.writeFileSync(windowStatePath, JSON.stringify({ x, y }));
        }, 500);
    });
}

function handleWindowMove(force = false) {
    if (!mainWindow) return;
    const [x] = mainWindow.getPosition();
    const [width] = mainWindow.getSize();
    const windowCenter = x + (width / 2);
    const { workAreaSize } = screen.getPrimaryDisplay();
    const newEdge = windowCenter > (workAreaSize.width / 2) ? 'right' : 'left';

    if (force || newEdge !== currentEdge) {
        currentEdge = newEdge;
        mainWindow.webContents.send('edge-changed', newEdge);
        console.log(`Edge changed to: ${newEdge}`);
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
    const icon = nativeImage.createFromBuffer(
        Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjbQg61aAAAADUlEQVQoU2NgYGD4DwABBAEAcCBlCwAAAABJRU5ErkJggg==', 'base64')
    );
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

    if (app.isPackaged) {
        app.setLoginItemSettings({
            openAtLogin: true,
            path: process.execPath,
            args: [
                '--processStart', `"${process.execPath}"`,
                '--process-start-args', `"--hidden"`
            ]
        });
    } else {
        app.setLoginItemSettings({ openAtLogin: false, path: process.execPath });
    }

    app.on('will-quit', () => {
        globalShortcut.unregisterAll();
        if (psProcess) psProcess.kill();
    });

    // Auto Updater Setup (Disabled for MS Store build)
    if (!IS_STORE_BUILD) {
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
    }
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
    if (isDev) {
        console.log(`Bypassing auto-launch setting in DEV mode (would set to: ${enabled})`);
        return;
    }
    app.setLoginItemSettings({
        openAtLogin: enabled,
        path: process.execPath,
        args: [
            '--processStart', `"${process.execPath}"`,
            '--process-start-args', `"--hidden"`
        ]
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
