import React from 'react';
import { useClipboardStore } from '../../store/useClipboardStore';

const SettingsPanel: React.FC = () => {
    const { slotCount, setSlotCount } = useClipboardStore();

    const handleSlotCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val)) {
            setSlotCount(Math.min(20, Math.max(4, val)));
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative bg-[#1e1b17]">
            <h2 className="text-2xl font-semibold text-slate-200 mb-8">Settings</h2>

            <div className="space-y-8">
                {/* Clipboard Settings Area */}
                <div className="bg-[#1a1612] border border-[#3f362b] rounded-xl p-6 shadow-inner">
                    <h3 className="text-lg font-medium text-slate-300 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">content_paste</span>
                        Clipboard Settings
                    </h3>

                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm text-slate-400 font-medium">Number of Clipboard Slots</label>
                            <span className="text-lg font-bold text-primary">{slotCount}</span>
                        </div>
                        <input
                            type="range"
                            min="4"
                            max="20"
                            value={slotCount}
                            onChange={handleSlotCountChange}
                            className="w-full accent-primary h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-xs text-slate-500 mt-1">Changes are applied immediately. Min: 4, Max: 20 slots.</p>
                    </div>
                </div>

                {/* Other potential future settings can go here */}
            </div>
        </div>
    );
};

export default SettingsPanel;
