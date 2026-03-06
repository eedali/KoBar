import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload loaded successfully');
contextBridge.exposeInMainWorld('api', {
    hideApp: () => ipcRenderer.send('hide-app'),
    onEdgeChanged: (callback: (edge: 'left' | 'right') => void) => {
        ipcRenderer.on('edge-changed', (_event, edge) => callback(edge));
    }
});
