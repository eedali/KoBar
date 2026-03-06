export { };

declare global {
    interface Window {
        api: {
            hideApp: () => void;
            onEdgeChanged: (callback: (edge: 'left' | 'right') => void) => void;
        };
    }
}
