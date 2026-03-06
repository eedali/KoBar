import React from 'react';

const ClipboardSlots: React.FC = () => {
    return (
        <>
            <div className="flex flex-col items-center gap-2 w-full px-2 no-drag-region">
                <button
                    className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Copy Context"
                >
                    <span className="material-symbols-outlined text-[20px]">content_copy</span>
                </button>
                <div className="flex flex-row flex-wrap justify-center gap-1.5 relative px-2">
                    <label className="relative flex items-center justify-center cursor-pointer group">
                        <input defaultChecked className="custom-radio radio-green" name="copy_slots" type="radio" />
                    </label>
                    <label className="relative flex items-center justify-center cursor-pointer group">
                        <input defaultChecked className="custom-radio radio-green" name="copy_slots" type="radio" />
                    </label>
                    <label className="relative flex items-center justify-center cursor-pointer group">
                        <input defaultChecked className="custom-radio radio-blue" name="copy_slots" type="radio" />
                    </label>
                    <label className="relative flex items-center justify-center cursor-pointer group">
                        <input className="custom-radio radio-grey" name="copy_slots" type="radio" />
                    </label>
                    <label className="relative flex items-center justify-center cursor-pointer group">
                        <input className="custom-radio radio-grey" name="copy_slots" type="radio" />
                    </label>
                    <label className="relative flex items-center justify-center cursor-pointer group">
                        <input className="custom-radio radio-grey" name="copy_slots" type="radio" />
                    </label>
                </div>
            </div>

            <div className="w-12 h-px bg-[#3f362b] my-4"></div>

            <div className="flex flex-col items-center gap-2 w-full px-2 no-drag-region">
                <button
                    className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Paste Context"
                >
                    <span className="material-symbols-outlined text-[20px]">content_paste</span>
                </button>
                <div className="flex flex-row flex-wrap justify-center gap-1.5 relative px-2">
                    <label className="relative flex items-center justify-center cursor-pointer group">
                        <input defaultChecked className="custom-radio radio-blue" name="paste_slots" type="radio" />
                    </label>
                    <label className="relative flex items-center justify-center cursor-pointer group">
                        <input className="custom-radio radio-grey" name="paste_slots" type="radio" />
                    </label>
                    <label className="relative flex items-center justify-center cursor-pointer group">
                        <input className="custom-radio radio-grey" name="paste_slots" type="radio" />
                    </label>
                    <label className="relative flex items-center justify-center cursor-pointer group">
                        <input className="custom-radio radio-grey" name="paste_slots" type="radio" />
                    </label>
                    <label className="relative flex items-center justify-center cursor-pointer group">
                        <input className="custom-radio radio-grey" name="paste_slots" type="radio" />
                    </label>
                    <label className="relative flex items-center justify-center cursor-pointer group">
                        <input className="custom-radio radio-grey" name="paste_slots" type="radio" />
                    </label>
                </div>
            </div>
        </>
    );
};

export default ClipboardSlots;
