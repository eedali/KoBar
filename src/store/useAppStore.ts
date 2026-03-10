import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations } from '../i18n/translations';
import type { LanguageCode, TranslationKeys } from '../i18n/translations';

export type ThemeName = 'ember' | 'ocean' | 'sakura' | 'emerald' | 'midnight' | 'amethyst' | 'crimson' | 'nord' | 'coffee' | 'lavender';

export interface Note {
    id: number;
    title: string;
    icon: string;
    emoji: string | null;
    content: string;
    isSettings?: boolean;
}

export interface PinnedApp {
    id: string;
    name: string;
    path: string;
    icon: string;
}

export interface FocusSettings {
    minutes: number;
    seconds: number;
    melody: string;
    loop: boolean;
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
    // Mini Mode
    isMiniMode: boolean;
    miniModePosition: { x: number, y: number } | null;
    setMiniMode: (isMini: boolean, pos?: { x: number, y: number }) => void;
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
    openSettingsTab: () => void;
    // App Launcher
    pinnedApps: PinnedApp[];
    pinApp: (app: PinnedApp) => void;
    unpinApp: (id: string) => void;
    // Theme
    theme: ThemeName;
    setTheme: (theme: ThemeName) => void;
    // Language
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    t: (key: TranslationKeys) => string;

    // Focus Mode
    focusSettings: FocusSettings;
    setFocusSettings: (settings: Partial<FocusSettings>) => void;
    isFocusActive: boolean;
    focusRemainingTime: number;
    startFocusMode: () => void;
    stopFocusMode: () => void;
    tickFocusTracker: () => void;
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
        (set, get) => ({
            edgePosition: 'right',
            setEdgePosition: (edge) => set({ edgePosition: edge }),
            isNotePanelOpen: false,
            setNotePanelOpen: (isOpen) => set({ isNotePanelOpen: isOpen }),
            toggleNotePanel: () => set((state) => ({ isNotePanelOpen: !state.isNotePanelOpen })),
            notePanelWidth: 400,
            setNotePanelWidth: (width) => set((state) => ({ notePanelWidth: typeof width === 'function' ? width(state.notePanelWidth) : width })),
            notePanelHeight: 600,
            setNotePanelHeight: (height) => set((state) => ({ notePanelHeight: typeof height === 'function' ? height(state.notePanelHeight) : height })),

            // App Launcher State
            pinnedApps: [],
            pinApp: (app) => set((state) => {
                // Max 5 apps
                if (state.pinnedApps.length >= 5) return state;
                return { pinnedApps: [...state.pinnedApps, app] };
            }),
            unpinApp: (id) => set((state) => ({
                pinnedApps: state.pinnedApps.filter((a) => a.id !== id),
            })),

            // Theme
            theme: 'ember',
            setTheme: (theme) => {
                document.documentElement.setAttribute('data-theme', theme);
                set({ theme });
            },

            // Language
            language: 'tr', // Default Turkish
            setLanguage: (language) => set({ language }),
            t: (key) => {
                const state = get();
                const lang = state.language || 'tr';
                return (translations as Record<string, Record<string, string>>)[lang]?.[key]
                    || (translations as Record<string, Record<string, string>>)['en'][key]
                    || key;
            },

            // Focus Mode
            focusSettings: { minutes: 25, seconds: 0, melody: 'Calming', loop: false },
            setFocusSettings: (settings) => set((state) => ({ focusSettings: { ...state.focusSettings, ...settings } })),
            isFocusActive: false,
            focusRemainingTime: 0,
            startFocusMode: () => {
                const state = get();
                const totalSeconds = (state.focusSettings.minutes * 60) + state.focusSettings.seconds;
                if (totalSeconds > 0) {
                    set({ isFocusActive: true, focusRemainingTime: totalSeconds });
                }
            },
            stopFocusMode: () => set({ isFocusActive: false, focusRemainingTime: 0 }),
            tickFocusTracker: () => {
                set((state) => {
                    if (!state.isFocusActive) return state;
                    if (state.focusRemainingTime <= 1) {
                        // Don't set isFocusActive false here! Let FocusButton detect
                        // focusRemainingTime === 0 while isFocusActive is still true,
                        // so it can trigger the alarm.
                        return { focusRemainingTime: 0 };
                    }
                    return { focusRemainingTime: state.focusRemainingTime - 1 };
                });
            },

            // Mini Mode
            isMiniMode: false,
            miniModePosition: null,
            setMiniMode: (isMini, pos) => set({ isMiniMode: isMini, miniModePosition: pos || null }),
            // Note management
            notes: defaultNotes,
            activeNoteId: 1,
            nextNoteId: 4,
            setActiveNoteId: (id) => set({ activeNoteId: id }),
            addNote: () => set((state) => {
                const newNote: Note = {
                    id: state.nextNoteId,
                    title: state.t('addNewNote'),
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
            openSettingsTab: () => set((state) => {
                let settingsNote = state.notes.find(n => n.isSettings);
                let nextNotes = state.notes;
                let nextId = state.nextNoteId;

                if (!settingsNote) {
                    settingsNote = {
                        id: state.nextNoteId,
                        title: state.t('settings'),
                        icon: 'settings',
                        emoji: null,
                        content: '',
                        isSettings: true,
                    };
                    nextNotes = [...state.notes, settingsNote];
                    nextId++;
                }

                return {
                    isNotePanelOpen: true,
                    notes: nextNotes,
                    activeNoteId: settingsNote.id,
                    nextNoteId: nextId,
                };
            }),
        }),
        {
            name: 'kobar-storage',
            partialize: (state) => ({
                notes: state.notes,
                activeNoteId: state.activeNoteId,
                nextNoteId: state.nextNoteId,
                notePanelWidth: state.notePanelWidth,
                notePanelHeight: state.notePanelHeight,
                pinnedApps: state.pinnedApps,
                theme: state.theme,
                language: state.language,
                focusSettings: state.focusSettings,
            }),
        }
    )
);
