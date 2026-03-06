import React from 'react';

const NoteEditor: React.FC = () => {
    return (
        <div className="flex-1 p-8 flex flex-col overflow-y-auto w-full max-w-full">
            <div className="flex items-center gap-4 mb-6 no-drag-region">
                <button
                    className="w-10 h-10 flex shrink-0 items-center justify-center rounded-lg border border-[#3f362b] bg-[#1a1612] text-slate-500 hover:text-slate-200 hover:border-slate-500 transition-all group cursor-pointer"
                    title="Select icon"
                >
                    <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">
                        add_reaction
                    </span>
                </button>
                <input
                    className="bg-transparent text-4xl font-bold text-slate-100 border-none outline-none w-full focus:ring-0 placeholder-slate-700"
                    placeholder="Note Title..."
                    type="text"
                    defaultValue="Project Ideas: Q3 Roadmap"
                />
            </div>

            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-[#3f362b] text-slate-400 no-drag-region">
                <button className="hover:text-slate-200 transition-colors cursor-pointer" title="Bold">
                    <span className="material-symbols-outlined text-[20px]">format_bold</span>
                </button>
                <button className="hover:text-slate-200 transition-colors cursor-pointer" title="Italic">
                    <span className="material-symbols-outlined text-[20px]">format_italic</span>
                </button>
                <button className="hover:text-slate-200 transition-colors cursor-pointer" title="Underline">
                    <span className="material-symbols-outlined text-[20px]">format_underlined</span>
                </button>
                <div className="w-px h-5 bg-[#3f362b]"></div>
                <button className="hover:text-slate-200 transition-colors cursor-pointer" title="Bullet List">
                    <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                </button>
                <button className="hover:text-slate-200 transition-colors cursor-pointer" title="Numbered List">
                    <span className="material-symbols-outlined text-[20px]">format_list_numbered</span>
                </button>
                <div className="w-px h-5 bg-[#3f362b]"></div>
                <button className="hover:text-slate-200 transition-colors cursor-pointer" title="Attach File">
                    <span className="material-symbols-outlined text-[20px]">attach_file</span>
                </button>
                <button className="hover:text-slate-200 transition-colors cursor-pointer" title="Insert Image">
                    <span className="material-symbols-outlined text-[20px]">image</span>
                </button>
            </div>

            <div
                className="flex-1 text-slate-300 text-lg leading-relaxed outline-none no-drag-region overflow-y-auto"
                contentEditable
                suppressContentEditableWarning
            >
                <p className="mb-4">Here are some initial thoughts for the upcoming quarter:</p>
                <ul className="list-disc pl-6 space-y-3 mb-6 marker:text-primary">
                    <li>
                        <strong>Revamp the Dashboard:</strong> Focus on user-customizable widgets. We need to allow users to drag and drop their most used metrics.
                    </li>
                    <li>
                        <strong>Integrate new API:</strong> The third-party data needs to be pulled in real-time. Discuss with the backend team regarding rate limits.
                    </li>
                    <li>
                        <strong>Performance optimization:</strong> Investigate the slow load times on the reporting module. Could be a database indexing issue.
                    </li>
                </ul>
                <p>Next steps are to schedule a sync with design to review wireframes by next Tuesday.</p>
            </div>
        </div>
    );
};

export default NoteEditor;
