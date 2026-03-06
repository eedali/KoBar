import { create } from 'zustand';

interface AppState {
    edgePosition: 'left' | 'right';
    setEdgePosition: (edge: 'left' | 'right') => void;
    isNotePanelOpen: boolean;
    setNotePanelOpen: (isOpen: boolean) => void;
    toggleNotePanel: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    edgePosition: 'right', // Default assumption
    setEdgePosition: (edge) => set({ edgePosition: edge }),
    isNotePanelOpen: true, // Open by default or based on requirement
    setNotePanelOpen: (isOpen) => set({ isNotePanelOpen: isOpen }),
    toggleNotePanel: () => set((state) => ({ isNotePanelOpen: !state.isNotePanelOpen })),
}));
