import React from 'react';
import ClipboardSlots from '../clipboard/ClipboardSlots';
import { useAppStore } from '../../store/useAppStore';
import { setIsResizingGlobal } from '../../App';
import FocusButton from './FocusButton';
import TooltipButton from './TooltipButton';

const Sidebar: React.FC = () => {
    const { 
        toggleNotePanel, edgePosition, isNotePanelOpen, setMiniMode, 
        pinnedApps, pinApp, unpinApp, t,
        isShortcutsEnabled, isCopyPasteEnabled, isScreenshotEnabled, isFocusModeEnabled, maxShortcuts,
        toggleWidth, featureOrder, featureSpacing
    } = useAppStore();
    
    const [isDragging, setIsDragging] = React.useState(false);
    const dragRef = React.useRef({ startX: 0, startY: 0, dragged: false });
    const eyeButtonRef = React.useRef<HTMLButtonElement>(null);

    // Launcher Delete State
    const [deletingId, setDeletingId] = React.useState<string | null>(null);
    const deleteTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
        const handleDocClick = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.shortcut-item')) {
                setDeletingId(null);
            }
        };
        document.addEventListener('mousedown', handleDocClick);
        return () => document.removeEventListener('mousedown', handleDocClick);
    }, []);

    // Handle Window Drag via JS for the Eye Button
    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const dx = e.movementX;
            const dy = e.movementY;
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                dragRef.current.dragged = true;
            }
            if (window.api?.moveWindow && (dx !== 0 || dy !== 0)) {
                window.api.moveWindow(dx, dy);
            }
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                setIsResizingGlobal(false);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleEyeMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Left click only
        setIsDragging(true);
        setIsResizingGlobal(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            dragged: false
        };
    };

    const handleEyeClick = (e: React.MouseEvent) => {
        if (!dragRef.current.dragged) {
            setMiniMode(true, { x: e.clientX, y: e.clientY });
        }
    };

    return (
        <div className="relative z-50 h-fit w-20 pointer-events-none">
            {/* 1. Main Floating Sidebar (Scrollable) */}
            <div 
                className="flex flex-col items-center py-4 w-full h-fit max-h-[90vh] bg-[#1a1612] rounded-3xl shadow-2xl border border-[#3f362b] overflow-y-auto overflow-x-hidden custom-scrollbar pointer-events-auto"
                style={{ 
                    borderLeft: edgePosition === 'right' ? '1px solid #3f362b' : '1px solid #3f362b', 
                    borderRight: edgePosition === 'left' ? '1px solid #3f362b' : '1px solid #3f362b',
                    gap: `${featureSpacing}px`
                }}
            >
                {/* 1a. Top Drag Region & Branding (Always Top) */}
                <div className="h-6 drag-region w-full shrink-0 flex items-center justify-center -mb-2">
                    <div className="w-8 h-1 bg-white/10 rounded-full mt-1"></div>
                </div>

                <div className="w-10 h-px bg-white/5 no-drag-region shrink-0" />

                {/* 1b. Dynamic Feature Order with Separators */}
                {(() => {
                    const features = featureOrder.map(featureId => {
                        switch (featureId) {
                            case 'shortcuts':
                                return isShortcutsEnabled ? (
                                    <div key="shortcuts" className="w-full flex flex-col items-center gap-3 no-drag-region px-2">
                                        <TooltipButton
                                            as="div"
                                            label={t('dragDropApp')}
                                            className="w-12 h-12 rounded-xl border-2 border-dashed flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-all cursor-pointer group"
                                            style={{ borderColor: 'var(--theme-border)' }}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={async (e: React.DragEvent) => {
                                                e.preventDefault();
                                                if (pinnedApps.length >= maxShortcuts) return;
                                                const file = e.dataTransfer.files[0];
                                                if (!file) return;
                                                const filePath = window.api?.getFilePath(file) || (file as any).path as string;
                                                if (!filePath) return;
                                                
                                                const iconDataUrl = await window.api?.getFileIcon(filePath);
                                                const name = file.name.replace(/\.[^/.]+$/, "");
                                                pinApp({ id: Date.now().toString(), name, path: filePath, icon: iconDataUrl || '' });
                                            }}
                                        >
                                            <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">add_to_home_screen</span>
                                        </TooltipButton>

                                        <div className="flex flex-col items-center gap-2.5 w-full">
                                            {pinnedApps.slice(0, maxShortcuts).map(app => {
                                                const isGenericOrEmpty = !app.icon || app.icon === '' || app.icon.length < 3000;
                                                const appInitials = app.name ? app.name.substring(0, 2).toUpperCase() : '??';

                                                return (
                                                    <div key={app.id} className="shortcut-item relative w-12 h-12 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <TooltipButton
                                                            label={app.name}
                                                            className="w-full h-full rounded-xl border flex items-center justify-center overflow-hidden transition-all hover:scale-110 active:scale-95 shadow-lg bg-[#1e1b17]"
                                                            style={{ borderColor: 'var(--theme-border)' }}
                                                            onMouseDown={() => {
                                                                deleteTimeoutRef.current = setTimeout(() => setDeletingId(app.id), 600);
                                                            }}
                                                            onMouseUp={() => { if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current); }}
                                                            onMouseLeave={() => { if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current); }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (deletingId !== app.id && app.path) window.api?.launchFile(app.path);
                                                            }}
                                                        >
                                                            {isGenericOrEmpty ? (
                                                                <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-primary/70">{appInitials}</div>
                                                            ) : (
                                                                <img src={app.icon} className="w-full h-full object-contain p-2" alt={app.name} draggable={false} />
                                                            )}
                                                        </TooltipButton>

                                                        {deletingId === app.id && (
                                                            <button
                                                                onMouseDown={(e) => e.stopPropagation()}
                                                                onClick={(e) => { e.stopPropagation(); unpinApp(app.id); setDeletingId(null); }}
                                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-red-600 z-10"
                                                            >
                                                                <span className="material-symbols-outlined text-[12px]">close</span>
                                                            </button>
                                                            )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : null;
                            case 'copypaste':
                                return isCopyPasteEnabled ? (
                                    <div key="copypaste" className="w-full no-drag-region">
                                        <ClipboardSlots />
                                    </div>
                                ) : null;
                            case 'screenshot':
                                return isScreenshotEnabled ? (
                                    <div key="screenshot" className="w-full flex justify-center no-drag-region">
                                        <TooltipButton
                                            label={t('screenshot')}
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all hover:bg-white/5"
                                            onClick={() => window.api?.triggerScreenshot()}
                                        >
                                            <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                                        </TooltipButton>
                                    </div>
                                ) : null;
                            case 'focusmode':
                                return isFocusModeEnabled ? (
                                    <div key="focusmode" className="w-full flex justify-center no-drag-region">
                                        <FocusButton />
                                    </div>
                                ) : null;
                            default:
                                return null;
                        }
                    }).filter(Boolean);

                    return features.map((feat, idx) => (
                        <React.Fragment key={idx}>
                            {feat}
                            {(idx < features.length - 1) && (
                                <div className="w-10 h-px bg-white/5 no-drag-region shrink-0" />
                            )}
                        </React.Fragment>
                    ));
                })()}

                <div className="w-10 h-px bg-white/5 no-drag-region shrink-0" />

                {/* 1c. Bottom Static Utilities (Always Bottom) */}
                <div className="flex flex-col items-center gap-4 no-drag-region shrink-0 px-2 pb-2">
                    <TooltipButton
                        label={t('miniMode')}
                        buttonRef={eyeButtonRef}
                        onMouseDown={handleEyeMouseDown}
                        onClick={handleEyeClick}
                        className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary text-primary flex items-center justify-center shadow-[0_0_20px_rgba(244,161,37,0.2)] transition-all hover:bg-primary/40 cursor-grab active:cursor-grabbing group mt-2"
                    >
                        <span className="material-symbols-outlined text-[28px] group-hover:scale-110 transition-transform">visibility</span>
                    </TooltipButton>
                </div>
            </div>

            {/* 2. Toggle Notch (Outside scroll container to prevent clipping) */}
            <TooltipButton
                label={t('toggleNotes')}
                className="absolute top-1/2 -translate-y-1/2 h-12 border flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white/5 transition-all shadow-2xl z-[60] pointer-events-auto"
                style={{ 
                    backgroundColor: '#1a1612', 
                    borderColor: '#3f362b',
                    width: `${toggleWidth}px`,
                    ...(edgePosition === 'left' 
                        ? { right: `-${toggleWidth}px`, borderLeft: 'none', borderTopRightRadius: '10px', borderBottomRightRadius: '10px' }
                        : { left: `-${toggleWidth}px`, borderRight: 'none', borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px' })
                }}
                onClick={toggleNotePanel}
            >
                <span className="material-symbols-outlined text-[20px]">
                    {edgePosition === 'left' ? (isNotePanelOpen ? 'chevron_left' : 'chevron_right') : (isNotePanelOpen ? 'chevron_right' : 'chevron_left')}
                </span>
            </TooltipButton>
        </div>
    );
};

export default Sidebar;
