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
            let newWidth = widthRef.current;
            let newHeight = heightRef.current;

            if (direction === 'side' || direction === 'corner') {
                const deltaX = moveEvent.clientX - startX;
                if (edgePosition === 'right') {
                    newWidth = startWidth - deltaX;
                } else {
                    newWidth = startWidth + deltaX;
                }
            }

            if (direction === 'bottom' || direction === 'corner') {
                const deltaY = moveEvent.clientY - startY;
                newHeight = startHeight + deltaY;
            }

            const maxAllowedWidth = Math.min(window.screen.availWidth - 120, (window.innerWidth / 2) - 80);
            const clampedWidth = Math.min(Math.max(newWidth, 250), maxAllowedWidth);

            const maxAllowedHeight = Math.min(window.screen.availHeight - 100, (window.innerHeight / 2) - 80);
            const clampedHeight = Math.min(Math.max(newHeight, 200), maxAllowedHeight);

            widthRef.current = clampedWidth;
            heightRef.current = clampedHeight;

            onResizeTemp(clampedWidth, clampedHeight);
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
