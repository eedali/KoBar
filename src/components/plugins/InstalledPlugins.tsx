import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

const InstalledPlugins: React.FC = () => {
    const t = useAppStore(state => state.t);
    const triggerExtensionReload = useAppStore(state => state.triggerExtensionReload);
    const setExtensionEnabledInWorkspace = useAppStore(state => state.setExtensionEnabledInWorkspace);
    const [installedExtensions, setInstalledExtensions] = useState<any[]>([]);
    const [extsLoading, setExtsLoading] = useState(true);

    const loadInstalled = async () => {
        try {
            if (window.api && window.api.getInstalledExtensions) {
                const exts = await window.api.getInstalledExtensions();
                setInstalledExtensions(exts);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setExtsLoading(false);
        }
    };

    useEffect(() => {
        loadInstalled();
    }, []);

    const handleToggle = async (ext: any) => {
        const newState = !ext.enabled;
        setExtensionEnabledInWorkspace(ext.id, newState);
        if (window.api?.toggleExtensionEnabled) {
            await window.api.toggleExtensionEnabled(ext.id, newState);
            triggerExtensionReload();
            setInstalledExtensions(prev => prev.map(p => p.id === ext.id ? { ...p, enabled: newState } : p));
        }
    };

    const handleUninstall = async (id: string) => {
        if (window.api?.uninstallExtension) {
            await window.api.uninstallExtension(id);
            triggerExtensionReload();
            setInstalledExtensions(prev => prev.filter(p => p.id !== id));
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex flex-col">
                    <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold">{(t as any)('installedPlugins') || 'Installed Plugins'}</h3>
                    <p className="text-xs text-slate-500 mt-1">{(t as any)('installedPluginsDesc') || 'Manage and configure your active plugins.'}</p>
                </div>
            </div>

            <div className="flex flex-col gap-4 px-2">
                {extsLoading && (
                    <div className="flex items-center justify-center p-8">
                        <span className="material-symbols-outlined text-primary text-[24px] animate-spin">sync</span>
                    </div>
                )}

                {!extsLoading && installedExtensions.length === 0 && (
                    <div className="p-6 border border-dashed border-white/10 rounded-xl text-center text-slate-500 text-sm">
                        No extensions installed yet. Head to the Plugin Store to add one!
                    </div>
                )}

                {!extsLoading && installedExtensions.map((ext) => (
                    <div key={ext.id} className="flex items-center justify-between p-4 rounded-xl border border-[#2a241c] bg-black/20 hover:border-primary/30 transition-all no-drag-region">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary text-[20px]">{ext.icon || 'extension'}</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-200 truncate">{ext.name}</span>
                                    <span className="text-[10px] font-mono text-slate-500 shrink-0">v{ext.version}</span>
                                </div>
                                <span className="text-xs text-slate-400 leading-normal truncate max-w-xs">{ext.description}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            {/* Enable/Disable Toggle */}
                            <button
                                onClick={() => handleToggle(ext)}
                                className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${ext.enabled ? 'bg-primary' : 'bg-slate-600'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${ext.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>

                            {/* Uninstall Button */}
                            <button
                                onClick={() => handleUninstall(ext.id)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                title="Uninstall"
                            >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InstalledPlugins;
