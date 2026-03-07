import { contextBridge, ipcRenderer } from 'electron';

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
        ipcRenderer.on('clipboard-updated', (_event, data) => callback(data));
    },
    writeToClipboard: (data: { type: string; content: string }) => {
        ipcRenderer.send('write-to-clipboard', data);
    },
});
