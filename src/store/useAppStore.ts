import { create } from 'zustand';

interface AppState {
    edgePosition: 'left' | 'right';
    setEdgePosition: (edge: 'left' | 'right') => void;
}

export const useAppStore = create<AppState>((set) => ({
    edgePosition: 'right', // Default assumption
    setEdgePosition: (edge) => set({ edgePosition: edge }),
}));
