import { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, clipboard, globalShortcut } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let clipboardPollingInterval: ReturnType<typeof setInterval> | null = null;
let lastClipboardText: string = '';
let lastClipboardImageDataUrl: string = '';
let currentEdge: string = 'left';
let psProcess: ChildProcess | null = null;

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
        resizable: true,
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
    if (isActive) {
        globalShortcut.register('CommandOrControl+V', () => {
            if (mainWindow) mainWindow.webContents.send('request-next-paste');
        });
    } else {
        globalShortcut.unregister('CommandOrControl+V');
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
        globalShortcut.register('CommandOrControl+V', () => {
            if (mainWindow) mainWindow.webContents.send('request-next-paste');
        });
    }, 100);
});
