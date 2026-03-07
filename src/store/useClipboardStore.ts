import { create } from 'zustand';

export type SlotState = 'empty' | 'listening' | 'filled' | 'selected';

export interface ClipboardSlot {
    state: SlotState;
    type: 'text' | 'image' | null;
    content: string | null;
}

const SLOT_COUNT = 6;

function createEmptySlot(): ClipboardSlot {
    return { state: 'empty', type: null, content: null };
}

function createEmptySlots(): ClipboardSlot[] {
    return Array.from({ length: SLOT_COUNT }, () => createEmptySlot());
}

interface ClipboardState {
    copySlots: ClipboardSlot[];
    pasteSlots: ClipboardSlot[];
    isCopyModeActive: boolean;
    isPasteModeActive: boolean;

    // Copy Mode actions
    toggleCopyMode: () => void;
    addClipboardItem: (type: 'text' | 'image', content: string) => void;

    // Paste Mode actions
    togglePasteMode: () => void;
    pasteNextItem: () => ClipboardSlot | null;

    // Reset
    resetAll: () => void;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
    copySlots: createEmptySlots(),
    pasteSlots: createEmptySlots(),
    isCopyModeActive: false,
    isPasteModeActive: false,

    toggleCopyMode: () => {
        const { isCopyModeActive, copySlots, pasteSlots } = get();

        if (isCopyModeActive) {
            // Deactivate: revert the current Listening slot back to Empty
            const updatedCopySlots = copySlots.map(slot =>
                slot.state === 'listening' ? { ...slot, state: 'empty' as SlotState } : slot
            );
            set({ isCopyModeActive: false, copySlots: updatedCopySlots });

            // Tell Electron to stop polling
            if (window.api?.stopClipboardListener) {
                window.api.stopClipboardListener();
            }
        } else {
            // Activate: find the first empty slot and make it Listening
            const updatedCopySlots = [...copySlots];
            const updatedPasteSlots = [...pasteSlots];
            const firstEmptyIndex = updatedCopySlots.findIndex(s => s.state === 'empty');

            if (firstEmptyIndex === -1) {
                // All slots are filled, no room to listen
                return;
            }

            updatedCopySlots[firstEmptyIndex] = { ...updatedCopySlots[firstEmptyIndex], state: 'listening' };

            set({
                isCopyModeActive: true,
                copySlots: updatedCopySlots,
                pasteSlots: updatedPasteSlots,
            });

            // Tell Electron to start polling
            if (window.api?.startClipboardListener) {
                window.api.startClipboardListener();
            }
        }
    },

    addClipboardItem: (type, content) => {
        const { copySlots, pasteSlots, isCopyModeActive } = get();
        if (!isCopyModeActive) return;

        const updatedCopySlots = [...copySlots];
        const updatedPasteSlots = [...pasteSlots];

        // Find the current Listening slot
        const listeningIndex = updatedCopySlots.findIndex(s => s.state === 'listening');
        if (listeningIndex === -1) return;

        // Fill the Listening slot
        updatedCopySlots[listeningIndex] = { state: 'filled', type, content };
        updatedPasteSlots[listeningIndex] = { state: 'filled', type, content };

        // Find the next empty slot to make Listening
        const nextEmptyIndex = updatedCopySlots.findIndex((s, i) => i > listeningIndex && s.state === 'empty');

        if (nextEmptyIndex !== -1) {
            updatedCopySlots[nextEmptyIndex] = { ...updatedCopySlots[nextEmptyIndex], state: 'listening' };
            set({ copySlots: updatedCopySlots, pasteSlots: updatedPasteSlots });
        } else {
            // No more empty slots — auto-deactivate copy mode
            set({
                copySlots: updatedCopySlots,
                pasteSlots: updatedPasteSlots,
                isCopyModeActive: false,
            });
            if (window.api?.stopClipboardListener) {
                window.api.stopClipboardListener();
            }
        }
    },

    togglePasteMode: () => {
        const { isPasteModeActive, pasteSlots } = get();

        if (isPasteModeActive) {
            // Deactivate: remove the Red Stroke from the selected slot
            const updatedPasteSlots = pasteSlots.map(slot =>
                slot.state === 'selected' ? { ...slot, state: 'filled' as SlotState } : slot
            );
            set({ isPasteModeActive: false, pasteSlots: updatedPasteSlots });
        } else {
            // Activate: find the first Filled slot and mark it as Selected (Red Stroke)
            const updatedPasteSlots = [...pasteSlots];
            const firstFilledIndex = updatedPasteSlots.findIndex(s => s.state === 'filled');

            if (firstFilledIndex === -1) {
                // No filled slots to paste
                return;
            }

            updatedPasteSlots[firstFilledIndex] = { ...updatedPasteSlots[firstFilledIndex], state: 'selected' };
            set({ isPasteModeActive: true, pasteSlots: updatedPasteSlots });
        }
    },

    pasteNextItem: () => {
        const { pasteSlots, isPasteModeActive } = get();
        if (!isPasteModeActive) return null;

        const updatedPasteSlots = [...pasteSlots];
        const selectedIndex = updatedPasteSlots.findIndex(s => s.state === 'selected');

        if (selectedIndex === -1) return null;

        const item = { ...updatedPasteSlots[selectedIndex] };

        // Write to OS clipboard
        if (item.type && item.content && window.api?.writeToClipboard) {
            window.api.writeToClipboard({ type: item.type, content: item.content });
        }

        // Clear the pasted slot
        updatedPasteSlots[selectedIndex] = createEmptySlot();

        // Find the next filled slot
        const nextFilledIndex = updatedPasteSlots.findIndex((s, i) => i > selectedIndex && s.state === 'filled');

        if (nextFilledIndex !== -1) {
            updatedPasteSlots[nextFilledIndex] = { ...updatedPasteSlots[nextFilledIndex], state: 'selected' };
            set({ pasteSlots: updatedPasteSlots });
        } else {
            // No more items — auto-deactivate paste mode
            set({ pasteSlots: updatedPasteSlots, isPasteModeActive: false });
        }

        return item;
    },

    resetAll: () => {
        set({
            copySlots: createEmptySlots(),
            pasteSlots: createEmptySlots(),
            isCopyModeActive: false,
            isPasteModeActive: false,
        });
        if (window.api?.stopClipboardListener) {
            window.api.stopClipboardListener();
        }
    },
}));
