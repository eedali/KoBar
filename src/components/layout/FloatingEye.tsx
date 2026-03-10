import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { setIsResizingGlobal } from '../../App';

const FloatingEye: React.FC = () => {
    const { setMiniMode, edgePosition, miniModePosition } = useAppStore();

    // Spawn exactly where the cursor is! Or default to center if missing.
    const defaultX = miniModePosition?.x ?? (edgePosition === 'left' ? (window.innerWidth / 2) - 100 : (window.innerWidth / 2) + 100);
    const defaultY = miniModePosition?.y ?? (window.innerHeight / 2);

    const [pos] = useState({ x: defaultX, y: defaultY });
    const [isDragging, setIsDragging] = useState(false);
    const dragInitRef = useRef({ dragged: false });

    // Removed local boundary clamping so it can live anywhere in the unbound OS window

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click
        setIsDragging(true);
        setIsResizingGlobal(true); // Prevent transparent click-through issues globally
        dragInitRef.current = {
            dragged: false,
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const dx = e.movementX;
            const dy = e.movementY;

            // If moved more than 3px, consider it a drag so we don't trigger click
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                dragInitRef.current.dragged = true;
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

    const handleClick = () => {
        if (!dragInitRef.current.dragged) {
            setMiniMode(false);
        }
    };

    return (
        <div
            className="fixed z-[999] pointer-events-auto"
            style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
        >
            <button className="w-12 h-12 rounded-full bg-[#14110e] border-2 border-primary text-primary flex items-center justify-center shadow-[0_0_20px_rgba(244,161,37,0.4)] transition-transform hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing hover:bg-[#1a1612]">
                <span className="material-symbols-outlined text-[24px]">visibility</span>
            </button>
        </div>
    );
};

export default FloatingEye;
