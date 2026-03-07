export { };

declare global {
    interface Window {
        api: {
            hideApp: () => void;
            onEdgeChanged: (callback: (edge: 'left' | 'right') => void) => void;
            // Clipboard Manager
            startClipboardListener: () => void;
            stopClipboardListener: () => void;
            onClipboardUpdate: (callback: (data: { type: string; content: string }) => void) => (() => void);
            writeToClipboard: (data: { type: string; content: string }) => void;
        };
    }
}
