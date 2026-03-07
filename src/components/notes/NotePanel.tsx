import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import NoteEditor from './NoteEditor';
import ResizerHandle from './ResizerHandle';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';

const NotePanel: React.FC = () => {
    const {
        isNotePanelOpen, notePanelWidth, edgePosition, setNotePanelWidth,
        notes, activeNoteId, setActiveNoteId, addNote, deleteNote, updateNoteEmoji,
    } = useAppStore();

    // Startup sanity check: reset width if persisted value exceeds physical screen
    useEffect(() => {
        const safeMax = window.screen.availWidth - 120;
        if (notePanelWidth > safeMax) {
            setNotePanelWidth(400);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const [emojiPickerTabId, setEmojiPickerTabId] = useState<number | null>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    // Close emoji picker on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
                setEmojiPickerTabId(null);
            }
        };
        if (emojiPickerTabId !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [emojiPickerTabId]);

    if (!isNotePanelOpen) return null;

    const handleDelete = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this note?")) {
            deleteNote(id);
        }
    };

    const handleEmojiSelect = (emojiData: EmojiClickData) => {
        if (emojiPickerTabId === null) return;
        updateNoteEmoji(emojiPickerTabId, emojiData.emoji);
        setEmojiPickerTabId(null);
    };

    const toggleEmojiPicker = (e: React.MouseEvent, tabId: number) => {
        e.stopPropagation();
        setEmojiPickerTabId(prev => prev === tabId ? null : tabId);
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.currentTarget.scrollLeft += e.deltaY;
    };

    return (
        <div
            className={`absolute top-0 h-full flex flex-col bg-[#1e1b17] border border-[#3f362b] z-10 transition-[width] duration-0 overflow-hidden shadow-2xl shrink-0 ${edgePosition === 'right' ? 'right-full' : 'left-full'
                }`}
            style={{ width: `${notePanelWidth}px`, maxWidth: 'calc(100vw - 120px)' }}
        >
            <ResizerHandle />

            {/* Tabs Header */}
            <div className="flex items-end border-b border-[#3f362b] bg-[#1a1612] pt-4 px-4 gap-6 no-drag-region shrink-0 relative">
                <div onWheel={handleWheel} className="flex gap-2 overflow-x-auto scrollbar-hide snap-x">
                    {notes.map((note) => (
                        <button
                            key={note.id}
                            onClick={() => setActiveNoteId(note.id)}
                            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 snap-start ${note.id === activeNoteId
                                ? 'bg-[#1e1b17] text-slate-200 border border-[#3f362b] border-b-0 relative top-[1px]'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            {/* Icon: emoji or Material icon */}
                            <span
                                onClick={(e) => toggleEmojiPicker(e, note.id)}
                                className="cursor-pointer hover:scale-110 transition-transform"
                                title="Click to change icon"
                            >
                                {note.emoji ? (
                                    <span className="text-[18px]">{note.emoji}</span>
                                ) : (
                                    <span className="material-symbols-outlined text-[18px]">{note.icon}</span>
                                )}
                            </span>
                            {note.title}
                            {note.id === activeNoteId && (
                                <span
                                    onClick={(e) => handleDelete(e, note.id)}
                                    className="material-symbols-outlined text-[16px] ml-2 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-sm transition-all p-0.5"
                                    title="Close tab"
                                >
                                    close
                                </span>
                            )}
                        </button>
                    ))}
                    <button
                        onClick={() => addNote()}
                        className="px-3 py-2.5 text-slate-400 hover:text-slate-200 text-sm font-medium rounded-t-lg transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                        title="Add new note"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                </div>

                {/* Emoji Picker Popover */}
                {emojiPickerTabId !== null && (
                    <div
                        ref={emojiPickerRef}
                        className="absolute top-full left-4 mt-2 z-50 no-drag-region shadow-2xl rounded-xl overflow-hidden"
                    >
                        <EmojiPicker
                            onEmojiClick={handleEmojiSelect}
                            theme={Theme.DARK}
                            width={320}
                            height={400}
                            searchPlaceholder="Search emoji..."
                            lazyLoadEmojis
                        />
                    </div>
                )}
            </div>

            {/* Note Editor Area */}
            <NoteEditor />
        </div>
    );
};

export default NotePanel;
