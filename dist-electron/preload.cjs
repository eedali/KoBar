"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
console.log('Preload loaded successfully');
electron_1.contextBridge.exposeInMainWorld('api', {
    hideApp: () => electron_1.ipcRenderer.send('hide-app'),
    onEdgeChanged: (callback) => {
        electron_1.ipcRenderer.on('edge-changed', (_event, edge) => callback(edge));
    },
    // Clipboard Manager
    startClipboardListener: () => electron_1.ipcRenderer.send('start-clipboard-listener'),
    stopClipboardListener: () => electron_1.ipcRenderer.send('stop-clipboard-listener'),
    onClipboardUpdate: (callback) => {
        electron_1.ipcRenderer.on('clipboard-updated', (_event, data) => callback(data));
    },
    writeToClipboard: (data) => {
        electron_1.ipcRenderer.send('write-to-clipboard', data);
    },
});
