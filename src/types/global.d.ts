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
            // Mouse click-through
            setIgnoreMouseEvents: (ignore: boolean) => void;
            onOpenSettings: (callback: () => void) => (() => void);
            // Global Paste Support
            setGlobalPasteMode: (isActive: boolean) => void;
            onRequestNextPaste: (callback: () => void) => (() => void);
            executeGlobalPaste: (data: { type: string; content: string }) => void;
            triggerScreenshot: () => void;
            moveWindow: (dx: number, dy: number) => void;
            // Native App Launcher
            getFileIcon: (path: string) => Promise<string | null>;
            launchFile: (path: string) => void;
            getFilePath: (file: File) => string;
            // Auto-launch
            getAutoLaunch: () => Promise<boolean>;
            setAutoLaunch: (enabled: boolean) => void;
        };
    }
}
