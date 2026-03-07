import { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, clipboard } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let clipboardPollingInterval: ReturnType<typeof setInterval> | null = null;
let lastClipboardText: string = '';
let lastClipboardImageDataUrl: string = '';

const isDev = !app.isPackaged;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 4000,
        height: 2000,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        }
    });

    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setIgnoreMouseEvents(true, { forward: true });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Edge detection
    mainWindow.on('moved', handleWindowMove);
    mainWindow.on('move', handleWindowMove);
}

function handleWindowMove() {
    if (!mainWindow) return;

    const [x] = mainWindow.getPosition();
    const [width] = mainWindow.getSize();
    const windowCenter = x + (width / 2);

    const { workAreaSize } = screen.getPrimaryDisplay();
    const edgeState = windowCenter > (workAreaSize.width / 2) ? 'right' : 'left';

    mainWindow.webContents.send('edge-changed', edgeState);
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
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
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
    } else if (data.type === 'image') {
        const img = nativeImage.createFromDataURL(data.content);
        clipboard.writeImage(img);
    }
});

ipcMain.on('set-ignore-mouse-events', (event, ignore: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.setIgnoreMouseEvents(ignore, { forward: true });
    }
});
