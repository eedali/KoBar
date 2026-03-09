import React from 'react';
import { useClipboardStore } from '../../store/useClipboardStore';
import { useAppStore } from '../../store/useAppStore';

const SettingsPanel: React.FC = () => {
    const { slotCount, setSlotCount } = useClipboardStore();
    const { theme, setTheme } = useAppStore();

    const handleSlotCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val)) {
            setSlotCount(Math.min(20, Math.max(4, val)));
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative" style={{ backgroundColor: 'var(--theme-bg-base)' }}>
            <h2 className="text-2xl font-semibold text-slate-200 mb-8">Settings</h2>

            <div className="space-y-8">
                {/* Theme Settings Area */}
                <div className="rounded-xl p-6 shadow-inner border" style={{ backgroundColor: 'var(--theme-bg-dark)', borderColor: 'var(--theme-border)' }}>
                    <h3 className="text-lg font-medium text-slate-300 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">palette</span>
                        Appearance
                    </h3>

                    <div className="flex flex-col gap-3">
                        <label className="text-sm text-slate-400 font-medium">Theme Color</label>
                        <div className="flex gap-4 mt-2">
                            {[
                                { id: 'ember', name: 'Ember', color: '#f4a125' },
                                { id: 'ocean', name: 'Ocean', color: '#38bdf8' },
                                { id: 'sakura', name: 'Sakura', color: '#f472b6' },
                                { id: 'emerald', name: 'Emerald', color: '#34d399' }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id as any)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all no-drag-region ${theme === t.id
                                        ? 'ring-2 ring-offset-2 ring-offset-[#1a1612] scale-110 shadow-lg'
                                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                                        }`}
                                    style={{
                                        backgroundColor: t.color
                                    }}
                                    title={t.name}
                                >
                                    {theme === t.id && (
                                        <span className="material-symbols-outlined text-white text-[18px] drop-shadow-md">check</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Clipboard Settings Area */}
                <div className="rounded-xl p-6 shadow-inner border" style={{ backgroundColor: 'var(--theme-bg-dark)', borderColor: 'var(--theme-border)' }}>
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
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            style={{ accentColor: 'var(--theme-primary)' }}
                        />
                        <p className="text-xs text-slate-500 mt-1">Changes are applied immediately. Min: 4, Max: 20 slots.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
