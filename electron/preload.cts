import { contextBridge, ipcRenderer, webUtils } from 'electron';

console.log('Preload loaded successfully');
contextBridge.exposeInMainWorld('api', {
    hideApp: () => ipcRenderer.send('hide-app'),
    onEdgeChanged: (callback: (edge: 'left' | 'right') => void) => {
        ipcRenderer.on('edge-changed', (_event, edge) => callback(edge));
    },
    // Clipboard Manager
    startClipboardListener: () => ipcRenderer.send('start-clipboard-listener'),
    stopClipboardListener: () => ipcRenderer.send('stop-clipboard-listener'),
    onClipboardUpdate: (callback: (data: { type: string; content: string }) => void) => {
        const handler = (_event: Electron.IpcRendererEvent, data: { type: string; content: string }) => callback(data);
        ipcRenderer.on('clipboard-updated', handler);
        // Return cleanup function
        return () => {
            ipcRenderer.removeListener('clipboard-updated', handler);
        };
    },
    writeToClipboard: (data: { type: string; content: string }) => {
        ipcRenderer.send('write-to-clipboard', data);
    },
    // Mouse click-through for transparent window
    setIgnoreMouseEvents: (ignore: boolean) => ipcRenderer.send('set-ignore-mouse-events', ignore),
    onOpenSettings: (callback: () => void) => {
        const handler = () => callback();
        ipcRenderer.on('open-settings', handler);
        return () => {
            ipcRenderer.removeListener('open-settings', handler);
        };
    },
    // Global Paste Support
    setGlobalPasteMode: (isActive: boolean) => ipcRenderer.send('set-global-paste-mode', isActive),
    onRequestNextPaste: (callback: () => void) => {
        const handler = () => callback();
        ipcRenderer.on('request-next-paste', handler);
        return () => {
            ipcRenderer.removeListener('request-next-paste', handler);
        };
    },
    executeGlobalPaste: (data: { type: string; content: string }) => ipcRenderer.send('execute-global-paste', data),
    triggerScreenshot: () => ipcRenderer.send('trigger-screenshot'),
    moveWindow: (dx: number, dy: number) => ipcRenderer.send('move-window', { dx, dy }),

    // App Launcher Native
    getFileIcon: (path: string) => ipcRenderer.invoke('get-file-icon', path),
    launchFile: (path: string) => ipcRenderer.send('launch-file', path),
    getFilePath: (file: File) => webUtils.getPathForFile(file)
});
