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

        if (edgePosition === 'right') {
            setNotePanelWidth((prev) => Math.min(Math.max(prev - e.movementX, 250), 800));
        } else {
            setNotePanelWidth((prev) => Math.min(Math.max(prev + e.movementX, 250), 800));
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

    return (
        <div
            onMouseDown={handleMouseDown}
            className={`absolute top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/50 transition-colors z-50 no-drag-region ${edgePosition === 'right' ? 'left-0' : 'right-0'
                } ${isResizing ? 'bg-primary/50' : 'bg-transparent'}`}
        />
    );
};

export default ResizerHandle;
