import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import NoteEditor from './NoteEditor';

interface Tab {
    id: number;
    title: string;
    icon: string;
    active: boolean;
}

const NotePanel: React.FC = () => {
    const { isNotePanelOpen } = useAppStore();

    // Quick mock state for tabs
    const [tabs, setTabs] = useState<Tab[]>([
        { id: 1, title: 'Project Ideas', icon: 'lightbulb', active: true },
        { id: 2, title: 'Meeting Notes', icon: 'groups', active: false },
        { id: 3, title: 'Daily Tasks', icon: 'checklist', active: false },
    ]);

    if (!isNotePanelOpen) return null;

    const handleDelete = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this note?")) {
            setTabs(tabs.filter(tab => tab.id !== id));
        }
    };

    const setActive = (id: number) => {
        setTabs(tabs.map(tab => ({ ...tab, active: tab.id === id })));
    };

    return (
        <div className="flex-1 flex flex-col bg-[#1e1b17] h-full overflow-hidden z-10">
            {/* Tabs Header */}
            <div className="flex items-end border-b border-[#3f362b] bg-[#1a1612] pt-4 px-4 gap-6 no-drag-region shrink-0">
                <div className="flex gap-2 overflow-x-auto custom-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActive(tab.id)}
                            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${tab.active
                                    ? 'bg-[#1e1b17] text-slate-200 border border-[#3f362b] border-b-0 relative top-[1px]'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                            {tab.title}
                            {tab.active && (
                                <span
                                    onClick={(e) => handleDelete(e, tab.id)}
                                    className="material-symbols-outlined text-[16px] ml-2 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-sm transition-all p-0.5"
                                    title="Close tab"
                                >
                                    close
                                </span>
                            )}
                        </button>
                    ))}
                    <button
                        className="px-3 py-2.5 text-slate-400 hover:text-slate-200 text-sm font-medium rounded-t-lg transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                        title="Add new note"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                </div>
            </div>

            {/* Note Editor Area */}
            <NoteEditor />
        </div>
    );
};

export default NotePanel;
