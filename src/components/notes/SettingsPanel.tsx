import React, { useState, useEffect } from 'react';
import { useClipboardStore } from '../../store/useClipboardStore';
import { useAppStore } from '../../store/useAppStore';
import { getLanguageOptions } from '../../i18n/translations';

const SettingsPanel: React.FC = () => {
    const { slotCount, setSlotCount } = useClipboardStore();
    const { theme, setTheme, language, setLanguage, t, showTooltips, setShowTooltips } = useAppStore();

    // Auto-launch state
    const [autoLaunch, setAutoLaunch] = useState(false);

    useEffect(() => {
        window.api?.getAutoLaunch?.().then((enabled: boolean) => {
            setAutoLaunch(enabled);
        });
    }, []);

    const handleAutoLaunchToggle = () => {
        const newValue = !autoLaunch;
        setAutoLaunch(newValue);
        window.api?.setAutoLaunch?.(newValue);
    };

    const handleSlotCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val)) {
            setSlotCount(Math.min(20, Math.max(4, val)));
        }
    };

    const localizedLanguages = getLanguageOptions(language);

    return (
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative" style={{ backgroundColor: 'var(--theme-bg-base)' }}>
            <h2 className="text-2xl font-semibold text-slate-200 mb-8">{t('settings')}</h2>

            <div className="space-y-8">
                {/* Theme & Language Settings Area */}
                <div className="rounded-xl p-6 shadow-inner border" style={{ backgroundColor: 'var(--theme-bg-dark)', borderColor: 'var(--theme-border)' }}>
                    <h3 className="text-lg font-medium text-slate-300 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">palette</span>
                        {t('appearance')}
                    </h3>

                    <div className="flex flex-col gap-6">
                        {/* Language Selection */}
                        <div className="flex flex-col gap-3">
                            <label className="text-sm text-slate-400 font-medium">{t('language')}</label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                {localizedLanguages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setLanguage(lang.code)}
                                        className={`px-3 py-2 text-left text-sm rounded-lg transition-colors border ${language === lang.code
                                            ? 'bg-primary/20 border-primary text-primary font-medium'
                                            : 'border-transparent text-slate-300 hover:bg-[#2a241c] hover:text-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{lang.name}</span>
                                            {language === lang.code && (
                                                <span className="material-symbols-outlined text-[16px]">check</span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-full h-px" style={{ backgroundColor: 'var(--theme-border)' }}></div>

                        {/* Theme Selection */}
                        <div className="flex flex-col gap-3">
                            <label className="text-sm text-slate-400 font-medium">{t('themeColor')}</label>
                            <div className="grid grid-cols-5 gap-4 mt-2">
                                {[
                                    { id: 'ember', name: 'Ember', color: '#f4a125' },
                                    { id: 'ocean', name: 'Ocean', color: '#38bdf8' },
                                    { id: 'sakura', name: 'Sakura', color: '#f472b6' },
                                    { id: 'emerald', name: 'Emerald', color: '#34d399' },
                                    { id: 'midnight', name: 'Midnight', color: '#6366f1' },
                                    { id: 'amethyst', name: 'Amethyst', color: '#a855f7' },
                                    { id: 'crimson', name: 'Crimson', color: '#f43f5e' },
                                    { id: 'nord', name: 'Nord', color: '#81a1c1' },
                                    { id: 'coffee', name: 'Coffee', color: '#d97706' },
                                    { id: 'lavender', name: 'Lavender', color: '#a78bfa' }
                                ].map((themeItem) => (
                                    <button
                                        key={themeItem.id}
                                        onClick={() => setTheme(themeItem.id as any)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all no-drag-region ${theme === themeItem.id
                                            ? 'ring-2 ring-offset-2 ring-offset-[#1a1612] scale-110 shadow-lg'
                                            : 'hover:scale-105 opacity-80 hover:opacity-100'
                                            }`}
                                        style={{
                                            backgroundColor: themeItem.color
                                        }}
                                        title={themeItem.name}
                                    >
                                        {theme === themeItem.id && (
                                            <span className="material-symbols-outlined text-white text-[18px] drop-shadow-md">check</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clipboard Settings Area */}
                <div className="rounded-xl p-6 shadow-inner border" style={{ backgroundColor: 'var(--theme-bg-dark)', borderColor: 'var(--theme-border)' }}>
                    <h3 className="text-lg font-medium text-slate-300 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">content_paste</span>
                        {t('clipboardSettings')}
                    </h3>

                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm text-slate-400 font-medium">{t('numberOfSlots')}</label>
                            <span className="text-lg font-bold text-primary">{slotCount}</span>
                        </div>
                        <input
                            type="range"
                            min="4"
                            max="20"
                            value={slotCount}
                            onChange={handleSlotCountChange}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer mt-1"
                            style={{ accentColor: 'var(--theme-primary)' }}
                        />
                        <p className="text-xs text-slate-500 mt-2">{t('slotsMinMaxInfo')}</p>
                    </div>
                </div>

                {/* General Settings Area */}
                <div className="rounded-xl p-6 shadow-inner border" style={{ backgroundColor: 'var(--theme-bg-dark)', borderColor: 'var(--theme-border)' }}>
                    <h3 className="text-lg font-medium text-slate-300 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">tune</span>
                        {t('settings')}
                    </h3>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">power_settings_new</span>
                                <span className="text-sm text-slate-300">{t('launchAtStartup')}</span>
                            </div>
                            <button
                                onClick={handleAutoLaunchToggle}
                                className={`relative w-11 h-6 rounded-full transition-colors duration-200 no-drag-region ${autoLaunch ? 'bg-primary' : 'bg-slate-600'}`}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${autoLaunch ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </button>
                        </div>

                        <div className="w-full h-px opacity-50" style={{ backgroundColor: 'var(--theme-border)' }}></div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">info</span>
                                <span className="text-sm text-slate-300">{showTooltips ? t('hideTooltips') : t('showTooltips')}</span>
                            </div>
                            <button
                                onClick={() => setShowTooltips(!showTooltips)}
                                className={`relative w-11 h-6 rounded-full transition-colors duration-200 no-drag-region ${showTooltips ? 'bg-primary' : 'bg-slate-600'}`}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${showTooltips ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
