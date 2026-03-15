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
    // Settings
    showTooltips: boolean;
    setShowTooltips: (val: boolean) => void;
    
    // Feature Toggles
    isShortcutsEnabled: boolean;
    setIsShortcutsEnabled: (val: boolean) => void;
    maxShortcuts: number;
    setMaxShortcuts: (val: number) => void;
    
    isCopyPasteEnabled: boolean;
    setIsCopyPasteEnabled: (val: boolean) => void;
    
    isScreenshotEnabled: boolean;
    setIsScreenshotEnabled: (val: boolean) => void;
    
    isFocusModeEnabled: boolean;
    setIsFocusModeEnabled: (val: boolean) => void;

    isCalculatorEnabled: boolean;
    setIsCalculatorEnabled: (val: boolean) => void;

    featureOrder: string[];
    setFeatureOrder: (order: string[]) => void;
    
    // UI Spacing & Sizing
    toggleWidth: number;
    setToggleWidth: (val: number) => void;
    featureSpacing: number;
    setFeatureSpacing: (val: number) => void;
    
    // Launch at Startup
    launchAtStartup: boolean;
    setLaunchAtStartup: (val: boolean) => void;
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

    // License
    isLicensed: boolean;
    setLicensed: (val: boolean) => void;
}

const defaultNotes: Note[] = [
    {
        id: 1,
        title: 'KoBar Tutorial',
        icon: 'folder',
        emoji: '📁',
        content: `<ul><li><p><strong>Moving KoBar</strong></p></li></ul>
<p><img src="/DefaultNote/Eye.png"></p>
<p>Just click and hold the <strong>"Eye"</strong> icon with your left mouse button to drag KoBar wherever you like.<br>Want it out of the way? A single left click on the <strong>"Eye"</strong> will instantly shrink it! 👁️</p>
<p>______________________________</p>
<ul><li><p><strong>Copy &amp; Paste</strong></p></li></ul>
<p><img src="/DefaultNote/Copy.png"></p>
<p>Hit the copy button to copy as many items as you want, one after the other. Everything you copy is safely stored in your <strong>"Slots"</strong>.</p>
<p><img src="/DefaultNote/Paste.png"></p>
<p>When you're ready, hit the paste button to paste all those separate snippets of text wherever you need them, sequentially. 📋</p>
<p>______________________________</p>
<ul><li><p><strong>Shortcuts</strong></p></li></ul>
<p><img src="/DefaultNote/DnD.png"></p>
<p>Drag and drop your favorite apps, folders, or games right onto this icon for quick access straight from KoBar.<br>Need to remove one? Just long-press the shortcut with your left mouse button to reveal the delete option. ⚡</p>
<p>______________________________</p>
<ul><li><p><strong>Focus Mode</strong></p></li></ul>
<p><img src="/DefaultNote/focus.png"></p>
<p>Ready for some uninterrupted deep work?<br>Click this button, set your timer, and stay in the zone until the alarm goes off! 🎯</p>
<p>______________________________</p>
<ul><li><p><strong>Screenshot</strong></p></li></ul>
<p><img src="/DefaultNote/SS.png"></p>
<p>Forget clunky keyboard shortcuts! Just hit this button on KoBar to grab your screenshots instantly. 📸</p>
<p>______________________________</p>
<ul><li><p><strong>Settings</strong></p></li></ul>
<p><img src="/DefaultNote/Settings.png"></p>
<p>To tweak your language, theme, slot preferences, and more,<br>simply right-click the KoBar tray icon in the bottom-right corner of your screen and select "Settings". ⚙️</p>`
    }
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

            // Settings
            showTooltips: true,
            setShowTooltips: (val) => set({ showTooltips: val }),
            
            // Feature Toggles (Initial State)
            isShortcutsEnabled: true,
            setIsShortcutsEnabled: (val) => set({ isShortcutsEnabled: val }),
            maxShortcuts: 6,
            setMaxShortcuts: (val) => set({ maxShortcuts: val }),
            
            isCopyPasteEnabled: true,
            setIsCopyPasteEnabled: (val) => set({ isCopyPasteEnabled: val }),
            
            isScreenshotEnabled: true,
            setIsScreenshotEnabled: (val) => set({ isScreenshotEnabled: val }),
            
            isFocusModeEnabled: true,
            setIsFocusModeEnabled: (val: boolean) => set({ isFocusModeEnabled: val }),

            isCalculatorEnabled: true,
            setIsCalculatorEnabled: (val: boolean) => set({ isCalculatorEnabled: val }),

            featureOrder: ['shortcuts', 'copypaste', 'screenshot', 'focusmode', 'calculator'],
            setFeatureOrder: (order) => set({ featureOrder: order }),
            
            // UI Spacing & Sizing (defaults)
            toggleWidth: 24, // Matches w-6 (24px)
            setToggleWidth: (val) => set({ toggleWidth: val }),
            featureSpacing: 8, // Matches my-2 (8px margin top/bottom)
            setFeatureSpacing: (val) => set({ featureSpacing: val }),
            
            // Launch at Startup
            launchAtStartup: true,
            setLaunchAtStartup: (val) => {
                set({ launchAtStartup: val });
                window.api?.setAutoLaunch?.(val);
            },

            // Language
            language: 'en',
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
            nextNoteId: 2,
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

            // License
            isLicensed: false,
            setLicensed: (val) => set({ isLicensed: val }),
        }),
        {
            name: 'kobar-storage',
            version: 1,
            migrate: (persistedState: any, version: number) => {
                if (version === 0) {
                    // Ensure 'calculator' is in the order if it's missing
                    if (persistedState.featureOrder && !persistedState.featureOrder.includes('calculator')) {
                        persistedState.featureOrder = [...persistedState.featureOrder, 'calculator'];
                    }
                    // Ensure it's enabled by default if not set
                    if (persistedState.isCalculatorEnabled === undefined) {
                        persistedState.isCalculatorEnabled = true;
                    }
                }
                return persistedState;
            },
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
                showTooltips: state.showTooltips,
                launchAtStartup: state.launchAtStartup,
                isShortcutsEnabled: state.isShortcutsEnabled,
                maxShortcuts: state.maxShortcuts,
                isCopyPasteEnabled: state.isCopyPasteEnabled,
                isScreenshotEnabled: state.isScreenshotEnabled,
                isFocusModeEnabled: state.isFocusModeEnabled,
                isCalculatorEnabled: state.isCalculatorEnabled,
                featureOrder: state.featureOrder,
            }),
        }
    )
);
