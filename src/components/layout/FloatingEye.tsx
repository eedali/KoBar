import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { setIsResizingGlobal } from '../../App';

const FloatingEye: React.FC = () => {
    const { setMiniMode, edgePosition } = useAppStore();

    // Spawn exactly near the center of the screen where the Sidebar was!
    const defaultX = edgePosition === 'left' ? (window.innerWidth / 2) - 100 : (window.innerWidth / 2) + 100;
    const defaultY = window.innerHeight / 2;

    const [pos, setPos] = useState({ x: defaultX, y: defaultY });
    const [isDragging, setIsDragging] = useState(false);
    const dragInitRef = useRef({ x: 0, y: 0, startX: 0, startY: 0, dragged: false });

    // Handle initial mount position clamping
    useEffect(() => {
        setPos(prev => ({
            x: Math.max(24, Math.min(window.innerWidth - 24, prev.x)),
            y: Math.max(24, Math.min(window.innerHeight - 24, prev.y))
        }));
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click
        setIsDragging(true);
        setIsResizingGlobal(true); // Prevent transparent click-through issues globally
        dragInitRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            x: pos.x,
            y: pos.y,
            dragged: false,
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const dx = e.clientX - dragInitRef.current.startX;
            const dy = e.clientY - dragInitRef.current.startY;

            // If moved more than 3px, consider it a drag so we don't trigger click
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                dragInitRef.current.dragged = true;
            }

            const rawX = dragInitRef.current.x + dx;
            const rawY = dragInitRef.current.y + dy;

            // Clamp to screen bounds to prevent getting lost
            setPos({
                x: Math.max(24, Math.min(window.innerWidth - 24, rawX)),
                y: Math.max(24, Math.min(window.innerHeight - 24, rawY)),
            });
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
