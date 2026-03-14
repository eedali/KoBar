import React from 'react';
import ClipboardSlots from '../clipboard/ClipboardSlots';
import { useAppStore } from '../../store/useAppStore';
import { setIsResizingGlobal } from '../../App';
import FocusButton from './FocusButton';
import TooltipButton from './TooltipButton';

const Sidebar: React.FC = () => {
    const { 
        toggleNotePanel, edgePosition, isNotePanelOpen, setMiniMode, 
        pinnedApps, pinApp, unpinApp, t, isLicensed,
        featureOrder, isShortcutsEnabled, isCopyPasteEnabled, isScreenshotEnabled, isFocusModeEnabled, maxShortcuts,
        toggleWidth, featureSpacing
    } = useAppStore();
    const [isDragging, setIsDragging] = React.useState(false);
    const dragRef = React.useRef({ startX: 0, startY: 0, dragged: false });
    const eyeButtonRef = React.useRef<HTMLButtonElement>(null);

    // Launcher Delete State
    const [deletingId, setDeletingId] = React.useState<string | null>(null);
    const deleteTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
        const handleDocClick = () => setDeletingId(null);
        document.addEventListener('mousedown', handleDocClick);
        return () => document.removeEventListener('mousedown', handleDocClick);
    }, []);

    // Handle Window Drag via JS for the Eye Button
    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            // Movement deltas between events
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
        <div className="w-16 flex flex-col items-center py-3 relative z-20 overflow-y-auto overflow-x-hidden border-x pointer-events-auto" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>


            <div className={`flex-grow drag-region w-full ${!isLicensed ? '' : ''}`}></div>

            {/* Lockable content — disabled when unlicensed */}
            <div className={`w-full ${!isLicensed ? 'pointer-events-none opacity-40 select-none' : ''}`}>

            {featureOrder.map((featureId, index) => {
                let content = null;

                if (featureId === 'shortcuts' && isShortcutsEnabled) {
                    content = (
                        <div key="shortcuts" className="flex flex-col items-center gap-2 no-drag-region w-full px-2 py-1">
                            <TooltipButton
                                as="div"
                                label={t('dragDropApp')}
                                className="w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center text-slate-500 hover:text-primary transition-colors cursor-pointer"
                                style={{ borderColor: 'var(--theme-border)' }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={async (e: React.DragEvent) => {
                                    e.preventDefault();
                                    if (pinnedApps.length >= maxShortcuts) return;
                                    const file = e.dataTransfer.files[0];
                                    if (!file) return;
                                    const filePath = window.api?.getFilePath(file) || (file as any).path as string;
                                    if (!filePath) {
                                        console.error('Cannot resolve file path for dropped file.', file);
                                        return;
                                    }
                                    const iconDataUrl = await window.api?.getFileIcon(filePath);
                                    const name = file.name.replace(/\.[^/.]+$/, "");
                                    pinApp({ id: Date.now().toString(), name, path: filePath, icon: iconDataUrl || '' });
                                }}
                            >
                                <span className="material-symbols-outlined text-[20px]">add_to_home_screen</span>
                            </TooltipButton>

                            {/* Pinned Apps List - Restricted by maxShortcuts */}
                            {pinnedApps.slice(0, maxShortcuts).map(app => {
                                const appInitials = app.name ? app.name.substring(0, 2).toUpperCase() : 'APP';
                                const isGenericOrEmpty = !app.icon || app.icon === '' || app.icon.length < 3000;

                                return (
                                    <div key={app.id} className="relative w-10 h-10 group mt-1 flex justify-center items-center">
                                        <TooltipButton
                                            label={app.name}
                                            className="w-10 h-10 rounded-xl border flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-sm"
                                            style={{ backgroundColor: 'var(--theme-bg-base)', borderColor: 'var(--theme-border)' }}
                                            onMouseDown={() => {
                                                deleteTimeoutRef.current = setTimeout(() => {
                                                    setDeletingId(app.id);
                                                }, 600);
                                            }}
                                            onMouseUp={() => {
                                                if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
                                            }}
                                            onMouseLeave={() => {
                                                if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (deletingId !== app.id) {
                                                    if (app.path) {
                                                        window.api?.launchFile(app.path);
                                                    } else {
                                                        console.error('Cannot launch: app.path is missing!', app);
                                                    }
                                                }
                                            }}
                                        >
                                            {isGenericOrEmpty ? (
                                                <div className="w-full h-full rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-sm tracking-widest">
                                                    {appInitials}
                                                </div>
                                            ) : (
                                                <img src={app.icon} className="w-full h-full object-contain p-1.5 drop-shadow-md" alt={app.name} draggable={false} />
                                            )}
                                        </TooltipButton>

                                        {/* Delete Badge */}
                                        {deletingId === app.id && (
                                            <button
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    unpinApp(app.id);
                                                    setDeletingId(null);
                                                }}
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors border border-black/20 z-10 animate-in fade-in zoom-in duration-200"
                                            >
                                                <span className="material-symbols-outlined text-[14px] font-bold">close</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                }

                if (featureId === 'copypaste' && isCopyPasteEnabled) {
                    content = (
                        <div key="copypaste" className="w-full py-1">
                            <ClipboardSlots />
                        </div>
                    );
                }

                if (featureId === 'screenshot' && isScreenshotEnabled) {
                    content = (
                        <div key="screenshot" className="flex flex-col items-center no-drag-region py-1">
                            <TooltipButton
                                label={t('screenshot')}
                                className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                                onClick={() => window.api?.triggerScreenshot()}
                            >
                                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                            </TooltipButton>
                        </div>
                    );
                }

                if (featureId === 'focusmode' && isFocusModeEnabled) {
                    content = (
                        <div key="focusmode" className="flex flex-col items-center no-drag-region py-1">
                            <FocusButton />
                        </div>
                    );
                }

                if (!content) return null;

                // Determine if we are the last visible feature
                const visibleFeaturesBehind = featureOrder.slice(index + 1).filter(id => {
                    if (id === 'shortcuts') return isShortcutsEnabled;
                    if (id === 'copypaste') return isCopyPasteEnabled;
                    if (id === 'screenshot') return isScreenshotEnabled;
                    if (id === 'focusmode') return isFocusModeEnabled;
                    return false;
                });

                return (
                    <React.Fragment key={featureId}>
                        {content}
                        {visibleFeaturesBehind.length > 0 && (
                            <div className="w-8 h-px mx-auto shrink-0 transition-all duration-300" style={{ backgroundColor: 'var(--theme-border)', marginTop: `${featureSpacing}px`, marginBottom: `${featureSpacing}px` }}></div>
                        )}
                    </React.Fragment>
                );
            })}
            
            </div>{/* end lockable content */}

            {/* Hide/Eye Button and Note Toggle Container */}
            <div className="mt-auto relative flex justify-center w-full pb-2 mb-1 no-drag-region">
                
                {/* Toggle Note Panel Button - Absolute Hook dynamically positioned based on toggleWidth */}
                <TooltipButton
                    label={t('toggleNotes')}
                    className="absolute top-1/2 -translate-y-1/2 h-10 border rounded-sm flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all z-10 shadow-lg group"
                    style={{ 
                        backgroundColor: 'var(--theme-surface)', 
                        borderColor: 'var(--theme-border)',
                        width: `${toggleWidth}px`,
                        [edgePosition === 'left' ? 'right' : 'left']: `-${toggleWidth / 2}px`
                    }}
                    onClick={toggleNotePanel}
                >
                    <span className="material-symbols-outlined text-[18px] transition-transform group-active:scale-95">
                        {edgePosition === 'left'
                            ? (isNotePanelOpen ? 'chevron_left' : 'chevron_right')
                            : (isNotePanelOpen ? 'chevron_right' : 'chevron_left')
                        }
                    </span>
                </TooltipButton>

                {/* Hide/Eye Button */}
                <TooltipButton
                    label={t('miniMode')}
                    buttonRef={eyeButtonRef}
                    onMouseDown={handleEyeMouseDown}
                    onClick={handleEyeClick}
                    className="w-10 h-10 relative z-20 rounded-full bg-primary/20 border-2 border-primary text-primary flex items-center justify-center shadow-[0_0_15px_rgba(244,161,37,0.3)] transition-all hover:bg-primary/30 cursor-grab active:cursor-grabbing"
                >
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                </TooltipButton>
            </div>
        </div>
    );
};

export default Sidebar;
