import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { setIsResizingGlobal } from '../../App';

type ResizeDirection = 'side' | 'bottom' | 'corner';

interface ResizerHandleProps {
    direction: ResizeDirection;
    onResizeTemp: (width: number, height: number) => void;
}

const ResizerHandle: React.FC<ResizerHandleProps> = ({ direction, onResizeTemp }) => {
    const { edgePosition, notePanelWidth, notePanelHeight, setNotePanelWidth, setNotePanelHeight } = useAppStore();
    const [isResizing, setIsResizing] = useState(false);
    const widthRef = useRef(notePanelWidth);
    const heightRef = useRef(notePanelHeight);

    // Keep refs in sync when not resizing
    useEffect(() => {
        if (!isResizing) {
            widthRef.current = notePanelWidth;
            heightRef.current = notePanelHeight;
        }
    }, [notePanelWidth, notePanelHeight, isResizing]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsResizingGlobal(true);
        setIsResizing(true);
        // Keep window focused during drag
        window.api?.setIgnoreMouseEvents(false);

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = widthRef.current;
        const startHeight = heightRef.current;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const maxWidth = Math.min(1600, window.screen.availWidth - 120);
            const maxHeight = Math.min(1200, window.screen.availHeight - 100);

            if (direction === 'side' || direction === 'corner') {
                const deltaX = moveEvent.clientX - startX;
                if (edgePosition === 'right') {
                    // Right edge layout: dragging left (negative deltaX) increases width
                    widthRef.current = Math.min(Math.max(startWidth - deltaX, 250), maxWidth);
                } else {
                    // Left edge layout: dragging right (positive deltaX) increases width
                    widthRef.current = Math.min(Math.max(startWidth + deltaX, 250), maxWidth);
                }
            }

            if (direction === 'bottom' || direction === 'corner') {
                const deltaY = moveEvent.clientY - startY;
                heightRef.current = Math.min(Math.max(startHeight + deltaY, 200), maxHeight);
            }

            onResizeTemp(widthRef.current, heightRef.current);
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);

            setNotePanelWidth(widthRef.current);
            setNotePanelHeight(heightRef.current);
            setIsResizingGlobal(false);
            setIsResizing(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleDoubleClick = () => {
        if (direction === 'side' || direction === 'corner') {
            setNotePanelWidth(400);
        }
        if (direction === 'bottom' || direction === 'corner') {
            setNotePanelHeight(600);
        }
        onResizeTemp(
            direction === 'side' || direction === 'corner' ? 400 : widthRef.current,
            direction === 'bottom' || direction === 'corner' ? 600 : heightRef.current
        );
    };

    // Direction-specific classes. Ensure the cursor utility is on the outermost wrapper.
    const directionClasses = (() => {
        switch (direction) {
            case 'side':
                return `absolute top-0 bottom-0 w-6 cursor-ew-resize ${edgePosition === 'right' ? 'left-0 -ml-3' : 'right-0 -mr-3'}`;
            case 'bottom':
                return 'absolute bottom-0 left-0 right-0 h-6 -mb-3 cursor-ns-resize';
            case 'corner':
                return `absolute bottom-0 w-6 h-6 -mb-3 cursor-nwse-resize ${edgePosition === 'right' ? 'left-0 -ml-3' : 'right-0 -mr-3'}`;
        }
    })();

    return (
        <div
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            className={`${directionClasses} resizer-handle hover:bg-primary/30 transition-colors z-50 [-webkit-app-region:no-drag] ${isResizing ? 'bg-primary/30' : 'bg-black/1'}`}
        />
    );
};

export default ResizerHandle;
