import React, { useEffect } from 'react';
import { useClipboardStore } from '../../store/useClipboardStore';
import type { SlotState } from '../../store/useClipboardStore';
import { useAppStore } from '../../store/useAppStore';
import TooltipButton from '../layout/TooltipButton';

function getSlotColorClass(state: SlotState, design: string): string {
    switch (state) {
        case 'empty':
            return 'radio-grey';
        case 'listening':
            return 'radio-blue';
        case 'filled':
            return 'radio-green';
        case 'selected':
            return `radio-green ring-2 ring-primary ring-offset-1 ${design === 'style2' ? 'ring-offset-transparent' : 'ring-offset-[var(--theme-bg-dark)]'}`;
        default:
            return 'radio-grey';
    }
}

const ClipboardSlots: React.FC = () => {
    const {
        slots,
        isCopyModeActive,
        isPasteModeActive,
        toggleCopyMode,
        togglePasteMode,
        addClipboardItem,
        pasteNextItem,
        resetAll,
        clearSlot,
        setListeningSlot,
        setSelectedSlot,
    } = useClipboardStore();
    const { t, design } = useAppStore();

    // Listen for clipboard updates from Electron backend
    useEffect(() => {
        let cleanup: (() => void) | undefined;
        if (window.api?.onClipboardUpdate) {
            cleanup = window.api.onClipboardUpdate((data) => {
                addClipboardItem(data.type as 'text' | 'image', data.content);
            });
        }
        return () => {
            if (cleanup) cleanup();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isCopyModeActive) {
            window.api?.startClipboardListener?.();
        } else {
            window.api?.stopClipboardListener?.();
        }
    }, [isCopyModeActive]);

    // The global OS paste trigger already handles the Ctrl+V shortcut across the entire system.
    // If we kept the local 'keydown' listener, pasting inside KoBar itself would trigger twice—
    // once by the OS, and once by the local listener—skipping a slot.


    const hasPasteableItems = slots.some(s => s.state === 'filled' || s.state === 'selected');

    // Sync global paste mode to backend
    useEffect(() => {
        if (isPasteModeActive && hasPasteableItems) {
            window.api?.setGlobalPasteMode(true);
        } else {
            window.api?.setGlobalPasteMode(false);
        }
        return () => window.api?.setGlobalPasteMode(false);
    }, [isPasteModeActive, hasPasteableItems]);

    // Listen for global OS paste trigger
    useEffect(() => {
        if (!isPasteModeActive) return;
        const cleanup = window.api?.onRequestNextPaste(() => {
            const targetSlot = slots.find(s => s.state === 'selected') || slots.find(s => s.state === 'filled');
            if (targetSlot && targetSlot.content && targetSlot.type) {
                window.api?.executeGlobalPaste({ type: targetSlot.type, content: targetSlot.content });
                pasteNextItem();
            }
        });
        return cleanup;
    }, [isPasteModeActive, slots, pasteNextItem]);

    const handleSlotClick = (e: React.MouseEvent, index: number, state: SlotState) => {
        e.preventDefault();
        if (isCopyModeActive && state === 'empty') {
            setListeningSlot(index);
        } else if (isPasteModeActive && state === 'filled') {
            setSelectedSlot(index);
            const slotData = slots[index];
            if (slotData && slotData.content && slotData.type) {
                window.api?.writeToClipboard({ type: slotData.type, content: slotData.content });
            }
        }
    };

    return (
        <div className="flex flex-col items-center gap-2 w-full px-2 no-drag-region">
            {/* Copy Button */}
            <TooltipButton
                onClick={toggleCopyMode}
                onDoubleClick={resetAll}
                className={`p-1.5 transition-colors cursor-pointer ${isCopyModeActive
                    ? 'text-green-500 hover:text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded-md relative group/tooltip'
                    : 'text-slate-500 hover:text-slate-300'
                    }`}
                label={t('copy')}
            >
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
            </TooltipButton>

            {/* Unified Slot Circles */}
            <div className="grid grid-cols-4 gap-2 relative w-[80%] mx-auto justify-items-center">
                {slots.map((slot, index) => (
                    <label
                        key={`slot-${index}`}
                        className="relative flex items-center justify-center cursor-pointer group"
                        onClick={(e) => handleSlotClick(e, index, slot.state)}
                        onDoubleClick={(e) => {
                            e.preventDefault();
                            clearSlot(index);
                        }}
                    >
                        <input
                            readOnly
                            checked={slot.state !== 'empty'}
                            className={`custom-radio ${getSlotColorClass(slot.state, design)} pointer-events-none`}
                            type="radio"
                            name={`slot_${index}`}
                        />
                    </label>
                ))}
            </div>

            {/* Paste Button */}
            <TooltipButton
                onClick={togglePasteMode}
                onDoubleClick={resetAll}
                className={`p-1.5 transition-colors cursor-pointer ${isPasteModeActive
                    ? 'text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-md'
                    : 'text-slate-500 hover:text-slate-300'
                    }`}
                label={t('paste')}
            >
                <span className="material-symbols-outlined text-[18px]">content_paste</span>
            </TooltipButton>
        </div>
    );
};

export default ClipboardSlots;
