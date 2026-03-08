import React from 'react';
import ClipboardSlots from '../clipboard/ClipboardSlots';
import { useAppStore } from '../../store/useAppStore';

const Sidebar: React.FC = () => {
    const { toggleNotePanel, setNotePanelWidth, setNotePanelHeight } = useAppStore();

    const handleHide = () => {
        if (window.api && window.api.hideApp) {
            window.api.hideApp();
        }
    };

    return (
        <div className="w-24 bg-[#14110e] border-[#3f362b] flex flex-col items-center py-4 relative z-20 overflow-y-auto overflow-x-hidden border-x">
            {/* Toggle Note Panel Button */}
            <button
                className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-[#14110e] border border-[#3f362b] rounded-sm flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors z-30 shadow-lg no-drag-region"
                title="Toggle Notes Section"
                onClick={toggleNotePanel}
            >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>

            {/* Drag Handle - double click resets note panel size */}
            <div className="flex flex-col items-center gap-4 mb-4 drag-region w-full" onDoubleClick={() => { setNotePanelWidth(400); setNotePanelHeight(600); }}>
                <div className="p-2 text-slate-500 hover:text-slate-300 transition-colors cursor-grab active:cursor-grabbing flex justify-center w-full">
                    <span className="material-symbols-outlined text-[24px]">drag_indicator</span>
                </div>
            </div>

            <div className="w-12 h-px bg-[#3f362b] mb-4"></div>

            <div className="flex-grow drag-region w-full"></div>

            {/* Note Tabs Add Button Placeholder */}
            <div className="flex flex-col items-center gap-4 mb-2 no-drag-region">
                <button className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-white hover:bg-slate-700 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
            </div>

            <div className="w-12 h-px bg-[#3f362b]"></div>

            {/* Clipboard Slots Section */}
            <ClipboardSlots />

            {/* Action Buttons */}
            <div className="w-12 h-px bg-[#3f362b] my-4"></div>

            <div className="flex flex-col items-center gap-4 mb-6 mt-2 no-drag-region">
                <button
                    className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Screenshot"
                    onClick={() => window.api?.triggerScreenshot()}
                >
                    <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                </button>
            </div>

            {/* Hide/Eye Button */}
            <div className="mt-auto mb-2 relative group flex justify-center w-full no-drag-region">
                <button
                    onClick={handleHide}
                    className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary text-primary flex items-center justify-center shadow-[0_0_15px_rgba(244,161,37,0.3)] transition-all hover:bg-primary/30 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[24px]">visibility</span>
                </button>
                <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-[#2a241c] border border-primary/50 rounded-lg py-1.5 px-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50 pointer-events-auto hidden md:block">
                    <span className="text-xs font-semibold text-primary">Focus Mode: ON</span>
                    <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-primary/50 border-b-[4px] border-b-transparent"></div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
