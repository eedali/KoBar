import React, { useEffect } from 'react';
import { useClipboardStore } from '../../store/useClipboardStore';
import type { SlotState } from '../../store/useClipboardStore';

function getSlotColorClass(state: SlotState): string {
    switch (state) {
        case 'empty':
            return 'radio-grey';
        case 'listening':
            return 'radio-blue';
        case 'filled':
            return 'radio-green';
        case 'selected':
            return 'radio-green ring-2 ring-red-500 ring-offset-1 ring-offset-[#14110e]';
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

    // Listen for Ctrl+V globally to trigger sequential paste
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isPasteModeActive && e.ctrlKey && e.key === 'v') {
                pasteNextItem();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPasteModeActive, pasteNextItem]);

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
            <button
                onClick={toggleCopyMode}
                onDoubleClick={resetAll}
                className={`p-1.5 transition-colors cursor-pointer ${isCopyModeActive
                    ? 'text-blue-400 hover:text-blue-300'
                    : 'text-slate-400 hover:text-slate-200'
                    }`}
                title={isCopyModeActive ? 'Stop Copy Mode (Double-click to reset)' : 'Start Copy Mode (Double-click to reset)'}
            >
                <span className="material-symbols-outlined text-[20px]">content_copy</span>
            </button>

            {/* Unified Slot Circles */}
            <div className="flex flex-row flex-wrap justify-center gap-1.5 relative px-2">
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
                            className={`custom-radio ${getSlotColorClass(slot.state)} pointer-events-none`}
                            type="radio"
                            name={`slot_${index}`}
                        />
                    </label>
                ))}
            </div>

            {/* Paste Button */}
            <button
                onClick={togglePasteMode}
                onDoubleClick={resetAll}
                className={`p-1.5 transition-colors cursor-pointer ${isPasteModeActive
                    ? 'text-red-400 hover:text-red-300'
                    : 'text-slate-400 hover:text-slate-200'
                    }`}
                title={isPasteModeActive ? 'Stop Paste Mode (Double-click to reset)' : 'Start Paste Mode (Double-click to reset)'}
            >
                <span className="material-symbols-outlined text-[20px]">content_paste</span>
            </button>
        </div>
    );
};

export default ClipboardSlots;
