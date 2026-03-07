import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

interface ResizerHandleProps {
    onResizeTemp: (width: number) => void;
}

const ResizerHandle: React.FC<ResizerHandleProps> = ({ onResizeTemp }) => {
    const { edgePosition, notePanelWidth, setNotePanelWidth } = useAppStore();
    const [isResizing, setIsResizing] = useState(false);
    const currentWidthRef = useRef(notePanelWidth);

    // Keep ref in sync with store when not resizing
    useEffect(() => {
        if (!isResizing) {
            currentWidthRef.current = notePanelWidth;
        }
    }, [notePanelWidth, isResizing]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        currentWidthRef.current = notePanelWidth;
        setIsResizing(true);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;
        const maxWidth = Math.min(1600, window.screen.availWidth - 120);

        let newWidth: number;
        if (edgePosition === 'right') {
            newWidth = Math.min(Math.max(currentWidthRef.current - e.movementX, 250), maxWidth);
        } else {
            newWidth = Math.min(Math.max(currentWidthRef.current + e.movementX, 250), maxWidth);
        }
        currentWidthRef.current = newWidth;
        onResizeTemp(newWidth); // Update local state only — no Zustand/Tiptap re-render
    }, [isResizing, edgePosition, onResizeTemp]);

    const handleMouseUp = useCallback(() => {
        if (isResizing) {
            setNotePanelWidth(currentWidthRef.current); // Commit to Zustand + localStorage
        }
        setIsResizing(false);
    }, [isResizing, setNotePanelWidth]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    const handleDoubleClick = () => {
        setNotePanelWidth(400);
        onResizeTemp(400);
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            className={`absolute top-0 bottom-0 w-6 cursor-ew-resize hover:bg-primary/30 transition-colors z-50 no-drag-region ${edgePosition === 'right' ? 'left-0 -ml-3' : 'right-0 -mr-3'
                } ${isResizing ? 'bg-primary/30' : 'bg-transparent'}`}
        />
    );
};

export default ResizerHandle;
