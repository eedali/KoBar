import React from 'react';
import ClipboardSlots from '../clipboard/ClipboardSlots';
import { useAppStore } from '../../store/useAppStore';
import { setIsResizingGlobal } from '../../App';

const Sidebar: React.FC = () => {
    const { toggleNotePanel, setNotePanelWidth, setNotePanelHeight, edgePosition, isNotePanelOpen, setMiniMode, pinnedApps, pinApp, unpinApp } = useAppStore();
    const [isDragging, setIsDragging] = React.useState(false);
    const dragRef = React.useRef({ startX: 0, startY: 0, dragged: false });

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
        <div className="w-16 flex flex-col items-center py-3 relative z-20 overflow-y-auto overflow-x-hidden border-x" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>


            {/* Drag Handle - double click resets note panel size */}
            <div className="flex flex-col items-center gap-3 mb-3 drag-region w-full" onDoubleClick={() => { setNotePanelWidth(400); setNotePanelHeight(600); }}>
                <div className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors cursor-grab active:cursor-grabbing flex justify-center w-full">
                    <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
                </div>
            </div>

            <div className="w-8 h-px mb-3" style={{ backgroundColor: 'var(--theme-border)' }}></div>

            <div className="flex-grow drag-region w-full"></div>

            {/* Drag & Drop App Launcher */}
            <div className="flex flex-col items-center gap-2 mb-2 no-drag-region w-full px-2">
                <div
                    className="w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center text-slate-500 hover:text-primary transition-colors cursor-pointer"
                    style={{ borderColor: 'var(--theme-border)' }}
                    title="Drag and drop shortcuts here"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                        e.preventDefault();
                        if (pinnedApps.length >= 5) return;
                        const file = e.dataTransfer.files[0];
                        if (!file) return;
                        // Use webUtils exposed via preload to safely get file path in modern Electron 
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
                </div>

                {/* Pinned Apps List */}
                {pinnedApps.map(app => (
                    <div key={app.id} className="relative w-10 h-10 group mt-1 flex justify-center items-center">
                        <button
                            className="w-10 h-10 rounded-xl border flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-sm"
                            style={{ backgroundColor: 'var(--theme-bg-base)', borderColor: 'var(--theme-border)' }}
                            title={app.name}
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
                            {app.icon ? (
                                <img src={app.icon} className="w-full h-full object-contain p-1.5 drop-shadow-md" alt={app.name} draggable={false} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm shadow-inner overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-base)' }}>
                                    {app.name.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </button>

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
                ))}
            </div>

            <div className="w-8 h-px" style={{ backgroundColor: 'var(--theme-border)' }}></div>

            {/* Clipboard Slots Section */}
            <ClipboardSlots />

            {/* Toggle Note Panel Button - Repositioned Anchor */}
            <div className="relative w-full h-0 no-drag-region">
                <button
                    className={`absolute ${edgePosition === 'left' ? '-right-3' : '-left-3'} top-0 -translate-y-1/2 w-6 h-12 border rounded-sm flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors z-30 shadow-lg`}
                    style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
                    title="Toggle Notes Section"
                    onClick={toggleNotePanel}
                >
                    <span className="material-symbols-outlined text-[18px]">
                        {edgePosition === 'left'
                            ? (isNotePanelOpen ? 'chevron_left' : 'chevron_right')
                            : (isNotePanelOpen ? 'chevron_right' : 'chevron_left')
                        }
                    </span>
                </button>
            </div>

            {/* Action Buttons */}
            <div className="w-8 h-px my-3" style={{ backgroundColor: 'var(--theme-border)' }}></div>

            <div className="flex flex-col items-center gap-3 mb-4 mt-1 no-drag-region">
                <button
                    className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Screenshot"
                    onClick={() => window.api?.triggerScreenshot()}
                >
                    <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                </button>
            </div>

            {/* Hide/Eye Button */}
            <div className="mt-auto mb-1 relative group flex justify-center w-full no-drag-region">
                <button
                    onMouseDown={handleEyeMouseDown}
                    onClick={handleEyeClick}
                    className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary text-primary flex items-center justify-center shadow-[0_0_15px_rgba(244,161,37,0.3)] transition-all hover:bg-primary/30 cursor-grab active:cursor-grabbing"
                >
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                </button>
                <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 border border-primary/50 rounded-lg py-1.5 px-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50 pointer-events-auto hidden md:block mt-0 mb-0" style={{ backgroundColor: 'var(--theme-bg-base)' }}>
                    <span className="text-xs font-semibold text-primary">Mini Mode</span>
                    <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-primary/50 border-b-[4px] border-b-transparent"></div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
