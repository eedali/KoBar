import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Note {
    id: number;
    title: string;
    icon: string;
    emoji: string | null;
    content: string;
}

interface AppState {
    edgePosition: 'left' | 'right';
    setEdgePosition: (edge: 'left' | 'right') => void;
    isNotePanelOpen: boolean;
    setNotePanelOpen: (isOpen: boolean) => void;
    toggleNotePanel: () => void;
    notePanelWidth: number;
    setNotePanelWidth: (width: number | ((prev: number) => number)) => void;
    notePanelHeight: number;
    setNotePanelHeight: (height: number | ((prev: number) => number)) => void;
    // Note management
    notes: Note[];
    activeNoteId: number;
    nextNoteId: number;
    setActiveNoteId: (id: number) => void;
    addNote: () => void;
    deleteNote: (id: number) => void;
    updateNoteContent: (id: number, content: string) => void;
    updateNoteTitle: (id: number, title: string) => void;
    updateNoteEmoji: (id: number, emoji: string) => void;
}

const defaultNotes: Note[] = [
    {
        id: 1,
        title: 'Project Ideas',
        icon: 'lightbulb',
        emoji: null,
        content: `<p>Here are some initial thoughts for the upcoming quarter:</p>
            <ul>
                <li><strong>Revamp the Dashboard:</strong> Focus on user-customizable widgets.</li>
                <li><strong>Integrate new API:</strong> The third-party data needs to be pulled in real-time.</li>
                <li><strong>Performance optimization:</strong> Investigate the slow load times on the reporting module.</li>
            </ul>
            <p>Next steps are to schedule a sync with design to review wireframes by next Tuesday.</p>`,
    },
    {
        id: 2,
        title: 'Meeting Notes',
        icon: 'groups',
        emoji: null,
        content: '<p>Meeting notes go here...</p>',
    },
    {
        id: 3,
        title: 'Daily Tasks',
        icon: 'checklist',
        emoji: null,
        content: '<p>Daily task list goes here...</p>',
    },
];

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            edgePosition: 'right',
            setEdgePosition: (edge) => set({ edgePosition: edge }),
            isNotePanelOpen: true,
            setNotePanelOpen: (isOpen) => set({ isNotePanelOpen: isOpen }),
            toggleNotePanel: () => set((state) => ({ isNotePanelOpen: !state.isNotePanelOpen })),
            notePanelWidth: 400,
            setNotePanelWidth: (width) => set((state) => ({
                notePanelWidth: typeof width === 'function' ? width(state.notePanelWidth) : width
            })),
            notePanelHeight: 600,
            setNotePanelHeight: (height) => set((state) => ({
                notePanelHeight: typeof height === 'function' ? height(state.notePanelHeight) : height
            })),
            // Note management
            notes: defaultNotes,
            activeNoteId: 1,
            nextNoteId: 4,
            setActiveNoteId: (id) => set({ activeNoteId: id }),
            addNote: () => set((state) => {
                const newNote: Note = {
                    id: state.nextNoteId,
                    title: 'New Note',
                    icon: 'note',
                    emoji: null,
                    content: '',
                };
                return {
                    notes: [...state.notes, newNote],
                    activeNoteId: newNote.id,
                    nextNoteId: state.nextNoteId + 1,
                };
            }),
            deleteNote: (id) => set((state) => {
                const filtered = state.notes.filter(n => n.id !== id);
                if (filtered.length === 0) return state;
                const newActiveId = state.activeNoteId === id
                    ? filtered[0].id
                    : state.activeNoteId;
                return { notes: filtered, activeNoteId: newActiveId };
            }),
            updateNoteContent: (id, content) => set((state) => ({
                notes: state.notes.map(n => n.id === id ? { ...n, content } : n),
            })),
            updateNoteTitle: (id, title) => set((state) => ({
                notes: state.notes.map(n => n.id === id ? { ...n, title } : n),
            })),
            updateNoteEmoji: (id, emoji) => set((state) => ({
                notes: state.notes.map(n => n.id === id ? { ...n, emoji } : n),
            })),
        }),
        {
            name: 'kobar-storage',
            partialize: (state) => ({
                notes: state.notes,
                activeNoteId: state.activeNoteId,
                nextNoteId: state.nextNoteId,
                notePanelWidth: state.notePanelWidth,
                notePanelHeight: state.notePanelHeight,
            }),
        }
    )
);
