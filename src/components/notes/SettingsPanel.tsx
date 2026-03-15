import React, { useState } from 'react';
import { useClipboardStore } from '../../store/useClipboardStore';
import { useAppStore } from '../../store/useAppStore';
import { getLanguageOptions } from '../../i18n/translations';

const Accordion: React.FC<{
    title: string;
    icon: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
    masterToggle?: { isOn: boolean; onToggle: () => void };
}> = ({ title, icon, defaultOpen = true, children, masterToggle }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="rounded-xl shadow-inner border overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-dark)', borderColor: 'var(--theme-border)' }}>
            <div className="w-full flex items-center justify-between p-6">
                <button
                    className="flex-1 flex items-center gap-2 cursor-pointer hover:bg-black/10 transition-colors text-left"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="material-symbols-outlined text-primary">{icon}</span>
                    <h3 className="text-lg font-medium text-slate-300">{title}</h3>
                </button>
                
                <div className="flex items-center gap-4">
                    {masterToggle && (
                        <button
                            onClick={masterToggle.onToggle}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 no-drag-region shrink-0 ${masterToggle.isOn ? 'bg-primary' : 'bg-slate-600'}`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${masterToggle.isOn ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                        </button>
                    )}
                    <button onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                        <span className={`material-symbols-outlined text-slate-400 text-[20px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </button>
                </div>
            </div>
            {isOpen && (
                <div className="p-0 px-6 pb-6 mt-2 border-t pt-4" style={{ borderColor: 'var(--theme-border)' }}>
                    {children}
                </div>
            )}
        </div>
    );
};

const SettingsPanel: React.FC = () => {
    const { slotCount, setSlotCount } = useClipboardStore();
    const { 
        theme, setTheme, language, setLanguage, t, showTooltips, setShowTooltips, launchAtStartup, setLaunchAtStartup,
        isShortcutsEnabled, setIsShortcutsEnabled, maxShortcuts, setMaxShortcuts,
        isCopyPasteEnabled, setIsCopyPasteEnabled,
        isScreenshotEnabled, setIsScreenshotEnabled,
        isFocusModeEnabled, setIsFocusModeEnabled,
        featureOrder, setFeatureOrder,
        toggleWidth, setToggleWidth,
        featureSpacing, setFeatureSpacing
    } = useAppStore();

    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

    const handleAutoLaunchToggle = () => {
        setLaunchAtStartup(!launchAtStartup);
    };

    const handleSlotCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val)) {
            setSlotCount(Math.min(20, Math.max(4, val)));
        }
    };
    
    const handleMaxShortcutsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val)) {
            setMaxShortcuts(Math.min(6, Math.max(1, val)));
        }
    };

    const handleToggleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val)) {
            setToggleWidth(Math.min(40, Math.max(10, val)));
        }
    };

    const handleFeatureSpacingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val)) {
            setFeatureSpacing(Math.min(50, Math.max(0, val)));
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedItemIndex(index);
        
        // Use the entire row as the drag image
        const row = (e.currentTarget as HTMLElement).closest('.feature-row');
        if (row && e.dataTransfer.setDragImage) {
            e.dataTransfer.setDragImage(row, 20, row.clientHeight / 2);
        }

        // Required for Firefox
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
        
        // Slight delay to apply opacity to the row
        setTimeout(() => {
            if (row instanceof HTMLElement) {
                row.style.opacity = '0.4';
            }
        }, 0);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === index) return;

        const newOrder = [...featureOrder];
        const draggedItem = newOrder[draggedItemIndex];
        newOrder.splice(draggedItemIndex, 1);
        newOrder.splice(index, 0, draggedItem);

        setFeatureOrder(newOrder);
        setDraggedItemIndex(index); // Update dragged index to the new position
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        setDraggedItemIndex(null);
        const row = (e.currentTarget as HTMLElement).closest('.feature-row');
        if (row instanceof HTMLElement) {
            row.style.opacity = '1';
        }
    };
    
    // Helper to render accordion based on ID
    const renderFeatureAccordion = (id: string, index: number) => {
        let content = null;
        
        switch (id) {
            case 'shortcuts':
                content = (
                    <Accordion 
                        title={t('shortcuts')}
                        icon="bolt" 
                        defaultOpen={false}
                        masterToggle={{ isOn: isShortcutsEnabled, onToggle: () => setIsShortcutsEnabled(!isShortcutsEnabled) }}
                    >
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <label className="text-sm text-slate-400 font-medium">{t('maxShortcuts')}</label>
                                <span className="text-lg font-bold text-primary">{maxShortcuts}</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="6"
                                value={maxShortcuts}
                                onChange={handleMaxShortcutsChange}
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onDragStart={(e) => e.stopPropagation()}
                                draggable={false}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer mt-1 no-drag-region"
                                style={{ accentColor: 'var(--theme-primary)' }}
                            />
                        </div>
                    </Accordion>
                );
                break;
            case 'copypaste':
                content = (
                    <Accordion 
                        title={t('copyAndPaste')} 
                        icon="content_paste" 
                        defaultOpen={false}
                        masterToggle={{ isOn: isCopyPasteEnabled, onToggle: () => setIsCopyPasteEnabled(!isCopyPasteEnabled) }}
                    >
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
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onDragStart={(e) => e.stopPropagation()}
                                draggable={false}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer mt-1 no-drag-region"
                                style={{ accentColor: 'var(--theme-primary)' }}
                            />
                            <p className="text-xs text-slate-500 mt-2">{t('slotsMinMaxInfo')}</p>
                        </div>
                    </Accordion>
                );
                break;
            case 'screenshot':
                content = (
                    <Accordion 
                        title={t('screenshot')} 
                        icon="photo_camera" 
                        defaultOpen={false}
                        masterToggle={{ isOn: isScreenshotEnabled, onToggle: () => setIsScreenshotEnabled(!isScreenshotEnabled) }}
                    >
                        <div className="text-sm text-slate-400">
                            {/* Can add more specific settings here later if needed */}
                        </div>
                    </Accordion>
                );
                break;
            case 'focusmode':
                content = (
                    <Accordion 
                        title={t('focusMode')} 
                        icon="hourglass_empty" 
                        defaultOpen={false}
                        masterToggle={{ isOn: isFocusModeEnabled, onToggle: () => setIsFocusModeEnabled(!isFocusModeEnabled) }}
                    >
                        <div className="text-sm text-slate-400">
                             {/* Can add Focus specific overrides here later if needed */}
                        </div>
                    </Accordion>
                );
                break;
            default: return null;
        }

        return (
            <div 
                key={id}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className="transition-transform feature-row"
                style={{ 
                    transform: draggedItemIndex === index ? 'scale(1.02)' : 'none',
                    zIndex: draggedItemIndex === index ? 50 : 'auto',
                    position: 'relative'
                }}
            >
                {/* Visual drag handle indicator - NOW THE EXCLUSIVE DRAG TRIGGER */}
                <div 
                    draggable
                    onDragStart={(e: any) => handleDragStart(e, index)}
                    className="absolute left-[-32px] top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100 flex items-center justify-center p-2 cursor-move no-drag-region"
                >
                    <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
                </div>
                {content}
            </div>
        );
    };

    const localizedLanguages = getLanguageOptions(language);

    return (
        <div className="flex-1 overflow-y-auto p-8 pl-10 custom-scrollbar relative" style={{ backgroundColor: 'var(--theme-bg-base)' }}>
            <h2 className="text-2xl font-semibold text-slate-200 mb-8">{t('settings')}</h2>

            <div className="space-y-10">
                {/* --- TOP SECTION: Dynamic Features --- */}
                <div>
                    <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-4 px-2">{t('featureToggles')}</h3>
                    <div className="space-y-4">
                        {featureOrder.map((id, index) => renderFeatureAccordion(id, index))}
                    </div>
                </div>

                <div className="w-full h-px opacity-20" style={{ backgroundColor: 'var(--theme-border)' }}></div>

                {/* --- MIDDLE SECTION: Application UI Configuration --- */}
                <div>
                    <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-4 px-2">{t('uiLayout')}</h3>
                    <div className="space-y-4">
                        <Accordion title={t('layoutAndSpacing')} icon="grid_view" defaultOpen={true}>
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm text-slate-400 font-medium">{t('toggleWidthConfig')}</label>
                                        <span className="text-base font-bold text-primary">{toggleWidth}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="40"
                                        value={toggleWidth}
                                        onChange={handleToggleWidthChange}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        onDragStart={(e) => e.stopPropagation()}
                                        draggable={false}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer mt-1 no-drag-region"
                                        style={{ accentColor: 'var(--theme-primary)' }}
                                    />
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm text-slate-400 font-medium">{t('featureSpacingConfig')}</label>
                                        <span className="text-base font-bold text-primary">{featureSpacing}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        value={featureSpacing}
                                        onChange={handleFeatureSpacingChange}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        onDragStart={(e) => e.stopPropagation()}
                                        draggable={false}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer mt-1 no-drag-region"
                                        style={{ accentColor: 'var(--theme-primary)' }}
                                    />
                                </div>
                            </div>
                        </Accordion>
                    </div>
                </div>

                <div className="w-full h-px opacity-20" style={{ backgroundColor: 'var(--theme-border)' }}></div>

                {/* --- BOTTOM SECTION: Static Settings --- */}
                <div>
                    <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-4 px-2">{t('appearance')} & {t('settings')}</h3>
                    <div className="space-y-4">
                        
                        {/* Theme & Language Settings Area */}
                        <Accordion title={t('appearance')} icon="palette" defaultOpen={true}>
                            <div className="flex flex-col gap-6">
                        {/* Language Selection */}
                        <div className="flex flex-col gap-3">
                            <label className="text-sm text-slate-400 font-medium">{t('language')}</label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                {localizedLanguages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setLanguage(lang.code)}
                                        className={`px-3 py-2 text-left text-sm rounded-lg transition-colors border no-drag-region ${language === lang.code
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
                </Accordion>
                
                {/* General Settings Area */}
                <Accordion title={t('settings')} icon="tune" defaultOpen={true}>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">power_settings_new</span>
                                <span className="text-sm text-slate-300">{t('launchAtStartup')}</span>
                            </div>
                            <button
                                onClick={handleAutoLaunchToggle}
                                className={`relative w-11 h-6 rounded-full transition-colors duration-200 no-drag-region ${launchAtStartup ? 'bg-primary' : 'bg-slate-600'}`}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${launchAtStartup ? 'translate-x-5' : 'translate-x-0'}`}
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
                 </Accordion>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
