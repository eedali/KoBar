import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const WorkspacesView: React.FC = () => {
    const language = useAppStore(state => state.language);
    const design = useAppStore(state => state.design);
    const t = useAppStore(state => state.t);
    const workspaces = useAppStore(state => state.workspaces);
    const activeWorkspaceId = useAppStore(state => state.activeWorkspaceId);
    const saveCurrentAsWorkspace = useAppStore(state => state.saveCurrentAsWorkspace);
    const loadWorkspace = useAppStore(state => state.loadWorkspace);
    const deleteWorkspace = useAppStore(state => state.deleteWorkspace);
    const updateWorkspaceName = useAppStore(state => state.updateWorkspaceName);
    const updateWorkspaceSettings = useAppStore(state => state.updateWorkspaceSettings);
    const toggleWorkspaceIsolation = useAppStore(state => state.toggleWorkspaceIsolation);
    
    // Using local state to avoid bleeding into global store for simple UI toggles
    const [workspaceViewMode, setWorkspaceViewMode] = useState<'list' | 'cards'>('cards');
    const [isRenamingIdx, setIsRenamingIdx] = useState<number | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [newPresetName, setNewPresetName] = useState('');
    const [newPresetIsIsolated, setNewPresetIsIsolated] = useState(false);

    const showEyeNotification = useAppStore(state => state.showEyeNotification);
    const hideEyeNotification = useAppStore(state => state.hideEyeNotification);

    const handleSaveNew = (e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e) e.stopPropagation();
        if (newPresetName.trim()) {
            saveCurrentAsWorkspace(newPresetName.trim(), newPresetIsIsolated);
            showEyeNotification({
                message: language === 'tr' 
                    ? `"${newPresetName.trim()}" çalışma alanı kaydedildi ve aktif edildi.` 
                    : `Workspace "${newPresetName.trim()}" saved and activated.`,
                buttons: [{ label: (t as any)('tutorialBtnOk') || 'OK', color: "primary", onClick: () => hideEyeNotification() }]
            });
            setNewPresetName('');
            setNewPresetIsIsolated(false);
        } else {
            showEyeNotification({
                message: (t as any)('workspaceNameRequired') || 'Please enter a preset name',
                buttons: [{ label: (t as any)('tutorialBtnOk') || 'OK', color: "primary", onClick: () => hideEyeNotification() }]
            });
        }
    };

    const handleLoadWorkspace = (preset: any, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        loadWorkspace(preset.id);
    };

    const handleUpdateWorkspace = (preset: any, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        updateWorkspaceSettings(preset.id);
        showEyeNotification({
            message: language === 'tr'
                ? `"${preset.name}" çalışma alanı ayarları güncellendi.`
                : `Workspace "${preset.name}" settings updated.`,
            buttons: [{ label: (t as any)('tutorialBtnOk') || 'OK', color: "primary", onClick: () => hideEyeNotification() }]
        });
    };

    const handleToggleIsolation = (preset: any, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        toggleWorkspaceIsolation(preset.id);
        const willBeIsolated = !preset.isIsolated;
        showEyeNotification({
            message: language === 'tr'
                ? `"${preset.name}" veri modu: ${willBeIsolated ? 'İzole (Özel Veri)' : 'Paylaşımlı (Genel Veri)'}`
                : `"${preset.name}" data mode: ${willBeIsolated ? 'Isolated' : 'Shared'}`,
            buttons: [{ label: (t as any)('tutorialBtnOk') || 'OK', color: "primary", onClick: () => hideEyeNotification() }]
        });
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex flex-col">
                    <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold">{(t as any)('workspaces') || 'Workspaces'}</h3>
                    <p className="text-xs text-slate-500 mt-1">{(t as any)('workspacesDesc') || 'Save and load your favorite KoBar configurations.'}</p>
                </div>
                <button
                    onClick={() => setWorkspaceViewMode(workspaceViewMode === 'list' ? 'cards' : 'list')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all no-drag-region border hover:brightness-125"
                    style={{
                        backgroundColor: design === 'style2' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)',
                        borderColor: design === 'style2' ? 'rgba(255,255,255,0.08)' : 'var(--theme-border)',
                        color: 'var(--theme-primary)',
                    }}
                >
                    <span className="material-symbols-outlined text-[16px]">
                        {workspaceViewMode === 'list' ? 'grid_view' : 'view_list'}
                    </span>
                    {workspaceViewMode === 'list'
                        ? (language === 'tr' ? 'Kartlar' : 'Cards')
                        : (language === 'tr' ? 'Liste' : 'List')}
                </button>
            </div>

            {workspaceViewMode === 'list' ? (
                /* ─── LIST VIEW ─── */
                <div className="space-y-4">
                    <div className="flex flex-col gap-3">
                        {workspaces.map((preset, idx) => {
                            const isActive = preset.id === activeWorkspaceId;
                            return (
                                <div
                                    key={preset.id}
                                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                                        isActive
                                            ? 'border-primary/60 shadow-[0_0_15px_rgba(244,161,37,0.15)] ' + (design === 'style2' ? 'bg-white/10' : 'bg-primary/5')
                                            : design === 'style2' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-black/20 border-[#2a241c] hover:border-primary/30'
                                    }`}
                                >
                                    {isRenamingIdx === idx ? (
                                        <input 
                                            autoFocus
                                            type="text" 
                                            value={renameValue}
                                            onChange={e => setRenameValue(e.target.value)}
                                            onBlur={() => {
                                                if (renameValue.trim()) {
                                                    updateWorkspaceName(preset.id, renameValue.trim());
                                                }
                                                setIsRenamingIdx(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    if (renameValue.trim()) {
                                                        updateWorkspaceName(preset.id, renameValue.trim());
                                                    }
                                                    setIsRenamingIdx(null);
                                                }
                                                if (e.key === 'Escape') {
                                                    setIsRenamingIdx(null);
                                                }
                                            }}
                                            className="flex-1 bg-transparent border-b border-primary text-sm text-white focus:outline-none px-1 py-0.5 no-drag-region mr-4"
                                        />
                                    ) : (
                                        <div 
                                            className="flex-1 flex items-center gap-2.5 cursor-pointer group no-drag-region min-w-0 mr-3"
                                            onClick={(e) => handleLoadWorkspace(preset, e)}
                                            title={(t as any)('loadWorkspace') || 'Load'}
                                        >
                                            <span className={`material-symbols-outlined text-[20px] transition-transform group-hover:scale-110 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`}>
                                                {isActive ? 'check_circle' : 'play_circle'}
                                            </span>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-semibold truncate ${isActive ? 'text-primary' : 'text-slate-200 group-hover:text-primary transition-colors'}`}>
                                                        {preset.name}
                                                    </span>
                                                    {isActive && (
                                                        <span className="px-1.5 py-0.2 text-[10px] uppercase font-bold tracking-wider rounded bg-primary/20 text-primary border border-primary/40">
                                                            {(t as any)('activeWorkspace') || 'Active'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Data Isolation Checkbox / Toggle */}
                                    <div className="flex items-center gap-3 no-drag-region">
                                        <button
                                            type="button"
                                            onClick={(e) => handleToggleIsolation(preset, e)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                                preset.isIsolated
                                                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                                                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                                            }`}
                                            title={(t as any)('isolateDataDesc') || 'When enabled, notes and plugin data are stored exclusively for this workspace.'}
                                        >
                                            <span className="material-symbols-outlined text-[15px]">
                                                {preset.isIsolated ? 'check_box' : 'check_box_outline_blank'}
                                            </span>
                                            <span>
                                                {preset.isIsolated
                                                    ? ((t as any)('isolatedBadge') || 'Isolated')
                                                    : ((t as any)('sharedBadge') || 'Shared')}
                                            </span>
                                        </button>

                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={(e) => handleUpdateWorkspace(preset, e)}
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-green-400 hover:bg-green-400/10 transition-colors"
                                                title={(t as any)('updateWorkspaceSettings') || 'Update Settings'}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">save</span>
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setIsRenamingIdx(idx);
                                                    setRenameValue(preset.name);
                                                }}
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                                title={(t as any)('renameWorkspace') || 'Rename'}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                            </button>
                                            <button 
                                                onClick={() => deleteWorkspace(preset.id)}
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                                title={(t as any)('deleteWorkspace') || 'Delete'}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {workspaces.length === 0 && (
                            <div className="p-4 border border-dashed border-white/10 rounded-lg text-center text-slate-500 text-sm">
                                {language === 'tr' ? 'Henüz kayıtlı preset yok.' : 'No presets saved yet.'}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 p-3 rounded-xl border border-white/10 bg-black/20 mt-4 no-drag-region">
                        <div className="flex gap-2 items-center">
                            <input 
                                type="text" 
                                value={newPresetName}
                                onChange={e => setNewPresetName(e.target.value)}
                                placeholder={(t as any)('workspaceNamePlaceholder') || 'Preset name...'}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSaveNew(e);
                                    }
                                }}
                                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                            />
                            <button
                                onClick={handleSaveNew}
                                className="px-4 py-2 bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                            >
                                {(t as any)('saveCurrentSettings') || 'Save Current Settings'}
                            </button>
                        </div>
                        <div className="flex items-center gap-2 px-1">
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-200 select-none">
                                <input
                                    type="checkbox"
                                    checked={newPresetIsIsolated}
                                    onChange={e => setNewPresetIsIsolated(e.target.checked)}
                                    className="w-3.5 h-3.5 rounded border-white/20 accent-primary cursor-pointer"
                                />
                                <span>{(t as any)('isolateData') || 'Isolate Data'} ({(t as any)('isolateDataDesc') || 'Store notes and plugin data exclusively for this workspace'})</span>
                            </label>
                        </div>
                    </div>
                </div>
            ) : (
                /* ─── CARD VIEW ─── */
                <div className="space-y-4">
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                        {workspaces.map((preset, idx) => {
                            const isActive = preset.id === activeWorkspaceId;
                            return (
                                <div
                                    key={preset.id}
                                    className={`relative rounded-xl border overflow-hidden transition-all duration-300 ${
                                        isActive ? 'border-primary/60 shadow-[0_0_24px_rgba(244,161,37,0.2)]' : ''
                                    }`}
                                    style={{
                                        backgroundColor: design === 'style2' ? 'rgba(255,255,255,0.03)' : 'var(--theme-bg-dark)',
                                        borderColor: isActive ? 'var(--theme-primary)' : 'rgba(96, 165, 250, 0.2)',
                                        boxShadow: isActive
                                            ? '0 0 24px -4px rgba(244, 161, 37, 0.3), inset 0 1px 0 rgba(244, 161, 37, 0.2)'
                                            : '0 0 24px -6px rgba(96, 165, 250, 0.25), inset 0 1px 0 rgba(96, 165, 250, 0.08)',
                                    }}
                                >
                                    {/* Active badge */}
                                    {isActive && (
                                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary text-black">
                                            {(t as any)('activeWorkspace') || 'Active'}
                                        </div>
                                    )}

                                    <div className="flex flex-col items-center gap-3 p-4 pt-5">
                                        <div
                                            className="w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                                            style={{ backgroundColor: isActive ? 'rgba(244, 161, 37, 0.15)' : 'rgba(96, 165, 250, 0.12)' }}
                                            onClick={(e) => handleLoadWorkspace(preset, e)}
                                            title={(t as any)('loadWorkspace') || 'Load'}
                                        >
                                            <span className="material-symbols-outlined text-[22px]" style={{ color: isActive ? 'var(--theme-primary)' : '#60a5fa' }}>
                                                {isActive ? 'check_circle' : 'tune'}
                                            </span>
                                        </div>

                                        {isRenamingIdx === idx ? (
                                            <input
                                                autoFocus
                                                type="text"
                                                value={renameValue}
                                                onChange={e => setRenameValue(e.target.value)}
                                                onBlur={() => {
                                                    if (renameValue.trim()) updateWorkspaceName(preset.id, renameValue.trim());
                                                    setIsRenamingIdx(null);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        if (renameValue.trim()) updateWorkspaceName(preset.id, renameValue.trim());
                                                        setIsRenamingIdx(null);
                                                    }
                                                    if (e.key === 'Escape') setIsRenamingIdx(null);
                                                }}
                                                className="w-full bg-transparent border-b border-primary text-sm text-white text-center focus:outline-none px-1 py-0.5 no-drag-region"
                                            />
                                        ) : (
                                            <span className={`text-sm font-semibold text-center leading-tight truncate w-full ${isActive ? 'text-primary' : 'text-slate-200'}`}>
                                                {preset.name}
                                            </span>
                                        )}

                                        {/* Isolation Toggle */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleToggleIsolation(preset, e)}
                                            className={`flex items-center justify-center gap-1 px-2 py-0.8 rounded-md text-[11px] font-medium border w-full transition-all no-drag-region ${
                                                preset.isIsolated
                                                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                                                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                                            }`}
                                            title={(t as any)('isolateDataDesc') || 'When enabled, notes and plugin data are stored exclusively for this workspace.'}
                                        >
                                            <span className="material-symbols-outlined text-[13px]">
                                                {preset.isIsolated ? 'check_box' : 'check_box_outline_blank'}
                                            </span>
                                            <span>
                                                {preset.isIsolated
                                                    ? ((t as any)('isolatedBadge') || 'Isolated')
                                                    : ((t as any)('sharedBadge') || 'Shared')}
                                            </span>
                                        </button>

                                        {/* Action buttons */}
                                        <div className="flex items-center justify-center gap-1 no-drag-region mt-0.5">
                                            <button
                                                onClick={(e) => handleLoadWorkspace(preset, e)}
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-green-400 hover:bg-green-400/10 transition-colors"
                                                title={(t as any)('loadWorkspace') || 'Load'}
                                            >
                                                <span className="material-symbols-outlined text-[17px]">play_circle</span>
                                            </button>
                                            <button
                                                onClick={(e) => handleUpdateWorkspace(preset, e)}
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                                                title={(t as any)('updateWorkspaceSettings') || 'Update'}
                                            >
                                                <span className="material-symbols-outlined text-[15px]">save</span>
                                            </button>
                                            <button
                                                onClick={() => { setIsRenamingIdx(idx); setRenameValue(preset.name); }}
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                                title={(t as any)('renameWorkspace') || 'Rename'}
                                            >
                                                <span className="material-symbols-outlined text-[15px]">edit</span>
                                            </button>
                                            <button
                                                onClick={() => deleteWorkspace(preset.id)}
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                                title={(t as any)('deleteWorkspace') || 'Delete'}
                                            >
                                                <span className="material-symbols-outlined text-[15px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <div
                            className="relative rounded-xl border-2 border-dashed overflow-hidden transition-all duration-300 cursor-pointer group no-drag-region"
                            style={{ borderColor: design === 'style2' ? 'rgba(255,255,255,0.08)' : 'var(--theme-border)' }}
                            onClick={handleSaveNew}
                        >
                            <div className="flex flex-col items-center justify-center gap-2.5 p-4 pt-5 min-h-[175px]">
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors group-hover:bg-primary/20"
                                    style={{ backgroundColor: design === 'style2' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)' }}
                                >
                                    <span className="material-symbols-outlined text-[22px] text-slate-500 group-hover:text-primary transition-colors">add</span>
                                </div>
                                <input
                                    type="text"
                                    value={newPresetName}
                                    onChange={e => setNewPresetName(e.target.value)}
                                    onClick={e => e.stopPropagation()}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSaveNew(e);
                                        }
                                    }}
                                    placeholder={(t as any)('workspaceNamePlaceholder') || 'Preset name...'}
                                    className="w-full bg-transparent border-b border-white/10 focus:border-primary text-xs text-white text-center focus:outline-none px-1 py-1 no-drag-region transition-colors"
                                />
                                <label 
                                    className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer select-none"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <input
                                        type="checkbox"
                                        checked={newPresetIsIsolated}
                                        onChange={e => setNewPresetIsIsolated(e.target.checked)}
                                        className="w-3 h-3 rounded accent-primary cursor-pointer"
                                    />
                                    <span>{(t as any)('isolateData') || 'Isolate'}</span>
                                </label>
                                <span className="text-[11px] text-slate-500 group-hover:text-primary transition-colors font-medium">
                                    {(t as any)('saveCurrentSettings') || 'Save New'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkspacesView;

