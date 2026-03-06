import { create } from 'zustand';

interface AppState {
    edgePosition: 'left' | 'right';
    setEdgePosition: (edge: 'left' | 'right') => void;
    isNotePanelOpen: boolean;
    setNotePanelOpen: (isOpen: boolean) => void;
    toggleNotePanel: () => void;
    notePanelWidth: number;
    setNotePanelWidth: (width: number | ((prev: number) => number)) => void;
}

export const useAppStore = create<AppState>((set) => ({
    edgePosition: 'right', // Default assumption
    setEdgePosition: (edge) => set({ edgePosition: edge }),
    isNotePanelOpen: true, // Open by default or based on requirement
    setNotePanelOpen: (isOpen) => set({ isNotePanelOpen: isOpen }),
    toggleNotePanel: () => set((state) => ({ isNotePanelOpen: !state.isNotePanelOpen })),
    notePanelWidth: 400,
    setNotePanelWidth: (width) => set((state) => ({
        notePanelWidth: typeof width === 'function' ? width(state.notePanelWidth) : width
    })),
}));
