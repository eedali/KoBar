import React, { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const ResizerHandle: React.FC = () => {
    const { edgePosition, setNotePanelWidth } = useAppStore();
    const [isResizing, setIsResizing] = useState(false);

    // If Sidebar is on the right, NotePanel is on the left. Resizer is on FAR LEFT.
    // Dragging left (negative movementX) uncovers more width: newWidth = oldWidth - movementX
    // If Sidebar is on the left, NotePanel is on the right. Resizer is on FAR RIGHT.
    // Dragging right (positive movementX) uncovers more width: newWidth = oldWidth + movementX

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;
        const maxWidth = Math.min(1600, window.screen.availWidth - 120);

        if (edgePosition === 'right') {
            setNotePanelWidth((prev) => Math.min(Math.max(prev - e.movementX, 250), maxWidth));
        } else {
            setNotePanelWidth((prev) => Math.min(Math.max(prev + e.movementX, 250), maxWidth));
        }
    }, [isResizing, edgePosition, setNotePanelWidth]);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

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
