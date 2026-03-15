import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../store/useAppStore';
import NoteEditor from './NoteEditor';
import SettingsPanel from './SettingsPanel';
import ResizerHandle from './ResizerHandle';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';

const NotePanel: React.FC = () => {
    const {
        isNotePanelOpen, notePanelWidth, notePanelHeight, setNotePanelHeight, setNotePanelWidth,
        notes, activeNoteId, setActiveNoteId, addNote, deleteNote, updateNoteEmoji, t, openSettingsTab, edgePosition,
    } = useAppStore();

    const activeNote = notes.find(n => n.id === activeNoteId);

    // Local dimensions for lag-free resizing (avoids Tiptap re-renders)
    const [localWidth, setLocalWidth] = useState(notePanelWidth);
    const [localHeight, setLocalHeight] = useState(notePanelHeight);

    // Sync local dimensions when store changes externally (double-click reset, etc.)
    useEffect(() => { setLocalWidth(notePanelWidth); }, [notePanelWidth]);
    useEffect(() => { setLocalHeight(notePanelHeight); }, [notePanelHeight]);

    // Startup sanity check — reset panel to safe default if persisted size is too large
    useEffect(() => {
        const safeMaxW = window.screen.availWidth - 120;
        const safeMaxH = window.screen.availHeight - 100;
        if (notePanelWidth > safeMaxW) {
            setNotePanelWidth(400);
            setLocalWidth(400);
        }
        if (notePanelHeight > safeMaxH) {
            setNotePanelHeight(600);
            setLocalHeight(600);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Callback for resizer handles to update local dimensions
    const handleResizeTemp = useCallback((w: number, h: number) => {
        setLocalWidth(w);
        setLocalHeight(h);
    }, []);

    const [emojiPickerTabId, setEmojiPickerTabId] = useState<number | null>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: number, x: number, y: number } | null>(null);
    const deleteConfirmRef = useRef<HTMLDivElement>(null);

    // Close on outside click for delete confirm
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (deleteConfirmRef.current && !deleteConfirmRef.current.contains(e.target as Node)) {
                setDeleteConfirm(null);
            }
        };
        if (deleteConfirm !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [deleteConfirm]);

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

    const handleDelete = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        const noteToDelete = notes.find(n => n.id === id);
        if (noteToDelete?.isSettings) {
            deleteNote(id);
            return;
        }
        setDeleteConfirm({ id, x: e.clientX, y: e.clientY });
    };

    const confirmDelete = () => {
        if (deleteConfirm) {
            deleteNote(deleteConfirm.id);
            setDeleteConfirm(null);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm(null);
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

    const tabsRef = useRef<HTMLDivElement>(null);
    const [isDraggingTabs, setIsDraggingTabs] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftState, setScrollLeftState] = useState(0);
    const [dragDistance, setDragDistance] = useState(0);

    const handleTabsMouseDown = (e: React.MouseEvent) => {
        if (!tabsRef.current) return;
        setIsDraggingTabs(true);
        setStartX(e.pageX - tabsRef.current.offsetLeft);
        setScrollLeftState(tabsRef.current.scrollLeft);
        setDragDistance(0);
    };

    const handleTabsMouseLeave = () => {
        setIsDraggingTabs(false);
    };

    const handleTabsMouseUp = () => {
        setIsDraggingTabs(false);
    };

    const handleTabsMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingTabs || !tabsRef.current) return;
        e.preventDefault();
        const x = e.pageX - tabsRef.current.offsetLeft;
        const walk = (x - startX) * 1.5; // Scroll speed multiplier
        tabsRef.current.scrollLeft = scrollLeftState - walk;
        setDragDistance(Math.abs(walk));
    };

    const handleTabClick = (noteId: number) => {
        // Only switch tabs if we didn't drag much
        if (dragDistance < 5) {
            setActiveNoteId(noteId);
        }
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (e.currentTarget) {
            e.currentTarget.scrollLeft += e.deltaY;
        }
    };

    return (
        <div
            className={`relative flex flex-col border z-30 shadow-2xl shrink-0 pointer-events-auto ${isNotePanelOpen ? 'opacity-100' : 'pointer-events-none opacity-0 border-none'}`}
            style={{
                width: `${localWidth}px`,
                height: `${localHeight}px`,
                backgroundColor: 'var(--theme-bg-base)',
                borderColor: 'var(--theme-border)',
            }}
        >
            {/* Side Resizer */}
            <ResizerHandle direction="side" onResizeTemp={handleResizeTemp} />
            {/* Bottom Resizer */}
            <ResizerHandle direction="bottom" onResizeTemp={handleResizeTemp} />
            {/* Corner Resizer */}
            <ResizerHandle direction="corner" onResizeTemp={handleResizeTemp} />

            {/* Tabs Header */}
            <div className="flex items-end border-b pt-4 px-4 gap-6 no-drag-region shrink-0 relative" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-dark)' }}>
                <div
                    ref={tabsRef}
                    onWheel={handleWheel}
                    onMouseDown={handleTabsMouseDown}
                    onMouseLeave={handleTabsMouseLeave}
                    onMouseUp={handleTabsMouseUp}
                    onMouseMove={handleTabsMouseMove}
                    className={`flex-1 flex gap-2 overflow-x-auto scrollbar-hide snap-x select-none ${isDraggingTabs ? 'cursor-grabbing' : 'cursor-grab'}`}
                >
                    {notes.map((note) => (
                        <button
                            key={note.id}
                            onClick={() => handleTabClick(note.id)}
                            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 snap-start ${note.id === activeNoteId
                                ? 'text-slate-200 border border-b-0 relative top-[1px]'
                                + ' bg-[var(--theme-bg-base)] border-[var(--theme-border)]'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            {/* Icon: emoji or Material icon */}
                            <span
                                onClick={(e) => {
                                    if (note.isSettings) return;
                                    toggleEmojiPicker(e, note.id);
                                }}
                                className={`${note.isSettings ? '' : 'cursor-pointer hover:scale-110 transition-transform'}`}
                                title={note.isSettings ? '' : t('changeIcon')}
                            >
                                {note.emoji ? (
                                    <span className="text-[18px]">{note.emoji}</span>
                                ) : (
                                    <span className="material-symbols-outlined text-[18px]">{note.icon}</span>
                                )}
                            </span>
                            {note.isSettings ? t('settings') : note.title}
                            {note.id === activeNoteId && (
                                <span
                                    onClick={(e) => handleDelete(e, note.id)}
                                    className="material-symbols-outlined text-[16px] ml-2 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-sm transition-all p-0.5"
                                    title={t('closeTab')}
                                >
                                    close
                                </span>
                            )}
                        </button>
                    ))}
                    <button
                        onClick={() => addNote()}
                        className="px-3 py-2.5 text-slate-400 hover:text-slate-200 text-sm font-medium rounded-t-lg transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                        title={t('addNewNote')}
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                </div>

                {/* Settings Button (Fixed in Top Right) */}
                <button
                    onClick={openSettingsTab}
                    className="mb-2 p-1.5 text-slate-500 hover:text-primary transition-all rounded-lg hover:bg-white/5 flex items-center justify-center pointer-events-auto"
                    title={t('settings')}
                >
                    <span className="material-symbols-outlined text-[22px]">settings</span>
                </button>

                {/* Emoji Picker Popover */}
                {emojiPickerTabId !== null && createPortal(
                    <div
                        ref={emojiPickerRef}
                        className="fixed z-[100] no-drag-region shadow-2xl rounded-xl overflow-hidden pointer-events-auto"
                        style={{
                            top: '80px', // Roughly below the tabs
                            left: edgePosition === 'left' ? '120px' : 'auto',
                            right: edgePosition === 'right' ? '120px' : 'auto',
                        }}
                    >
                        <EmojiPicker
                            onEmojiClick={handleEmojiSelect}
                            theme={Theme.DARK}
                            width={320}
                            height={400}
                            searchPlaceholder="Search emoji..."
                            lazyLoadEmojis
                        />
                    </div>,
                    document.body
                )}

                {/* Delete Confirm Popup */}
                {deleteConfirm !== null && createPortal(
                    <div
                        ref={deleteConfirmRef}
                        className="fixed z-[110] border rounded-lg shadow-2xl flex flex-col p-4 pointer-events-auto"
                        style={{
                            top: `${deleteConfirm.y + 10}px`,
                            left: `${deleteConfirm.x - 60}px`,
                            backgroundColor: 'var(--theme-bg-dark)',
                            borderColor: 'var(--theme-border)',
                        }}
                    >
                        <span className="text-slate-200 text-sm mb-4">{t('deleteConfirmMsg')}</span>
                        <div className="flex gap-2 justify-end items-center">
                            <button
                                onClick={(e) => { e.stopPropagation(); cancelDelete(); }}
                                className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors rounded-md"
                                style={{ backgroundColor: 'var(--theme-bg-base)' }}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); confirmDelete(); }}
                                className="px-4 py-1.5 text-xs font-medium text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 transition-colors border border-red-500/30 rounded-md"
                            >
                                {t('deleteTitle')}
                            </button>
                        </div>
                    </div>,
                    document.body
                )}
            </div>

            {/* Editor or Settings Area */}
            {activeNote?.isSettings ? (
                <SettingsPanel />
            ) : (
                <NoteEditor />
            )}
        </div>
    );
};

export default NotePanel;

