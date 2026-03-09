import { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, clipboard, globalShortcut, shell } from 'electron';
import * as path from 'path';
import { spawn, exec, ChildProcess } from 'child_process';
// @ts-expect-error icon-extractor does not have types
import iconExtractor from 'icon-extractor';

app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let clipboardPollingInterval: ReturnType<typeof setInterval> | null = null;
let lastClipboardText: string = '';
let lastClipboardImageDataUrl: string = '';
let currentEdge: string = 'left';
let psProcess: ChildProcess | null = null;
let isGlobalPasteModeActive = false;

const isDev = !app.isPackaged;

function createWindow() {
    const { bounds, workAreaSize } = screen.getPrimaryDisplay();

    // We make horizontal window MASSIVE to avoid Note panel crops (6000 ensures dual 4K monitor compatibility)
    // We bind height perfectly to workAreaSize to prevent "Tile memory exceeded" and to prevent vertical crops off-screen
    const winW = 7000;
    const winH = Math.max(bounds.height, workAreaSize.height);

    // Center window over primary display exactly!
    const startX = Math.round(bounds.x + (workAreaSize.width / 2) - (winW / 2));
    const startY = bounds.y; // Pin exactly to top of screen so panels aren't offset vertically

    mainWindow = new BrowserWindow({
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
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

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
    if (clipboardPollingInterval) return; // Already polling

    // Snapshot current clipboard so we don't immediately capture stale content
    lastClipboardText = clipboard.readText() || '';
    const img = clipboard.readImage();
    lastClipboardImageDataUrl = img.isEmpty() ? '' : img.toDataURL();

    clipboardPollingInterval = setInterval(() => {
        if (!mainWindow) return;

        // Check for new text
        const currentText = clipboard.readText() || '';
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
        const currentImage = clipboard.readImage();
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
    const icon = nativeImage.createFromBuffer(
        Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjbQg61aAAAADUlEQVQoU2NgYGD4DwABBAEAcCBlCwAAAABJRU5ErkJggg==',
            'base64'
        )
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

    app.on('will-quit', () => {
        globalShortcut.unregisterAll();
        if (psProcess) psProcess.kill();
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

ipcMain.on('start-clipboard-listener', () => {
    startClipboardPolling();
});

ipcMain.on('stop-clipboard-listener', () => {
    stopClipboardPolling();
});

ipcMain.on('write-to-clipboard', (_event, data: { type: string; content: string }) => {
    if (data.type === 'text') {
        clipboard.writeText(data.content);
        lastClipboardText = data.content; // Prevent recursive copy!
    } else if (data.type === 'image') {
        const img = nativeImage.createFromDataURL(data.content);
        clipboard.writeImage(img);
        lastClipboardImageDataUrl = data.content; // Prevent recursive copy!
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
    }, 100);
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

ipcMain.handle('get-file-icon', async (event, filePath) => {
    return new Promise((resolve) => {
        // Step A: Resolve target path for .lnk files
        if (filePath.toLowerCase().endsWith('.lnk')) {
            const psScript = `
            $shell = New-Object -ComObject WScript.Shell
            $link = $shell.CreateShortcut("${filePath}")
            $link.TargetPath
            `;
            exec(`powershell -NoProfile -Command "${psScript}"`, (error, stdout) => {
                if (error || !stdout.trim()) {
                    resolve(null); // Fallback if link resolution fails
                    return;
                }
                const targetPath = stdout.trim();
                // Step B: Get the icon for the target EXE
                extractIcon(targetPath, resolve);
            });
        } else {
            // It's a direct .exe or other file, get its icon directly
            extractIcon(filePath, resolve);
        }
    });
});

// Helper function to extract and convert the icon to base64
function extractIcon(filePath: string, resolve: (val: string | null) => void) {
    const contextId = Math.random().toString(36).substring(7);
    iconExtractor.getIcon(contextId, filePath);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onIconResponse = (data: any) => {
        if (data.Context === contextId) {
            resolve(`data:image/png;base64,${data.Base64ImageData}`);
            iconExtractor.emitter.removeListener('icon', onIconResponse); // Cleanup
        }
    };
    iconExtractor.emitter.on('icon', onIconResponse);
}

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
