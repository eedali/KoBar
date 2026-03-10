import React, { useEffect } from 'react';
import './index.css';
import { useAppStore } from './store/useAppStore';
import Sidebar from './components/layout/Sidebar';
import NotePanel from './components/notes/NotePanel';
import FloatingEye from './components/layout/FloatingEye';
import LicenseActivationModal from './components/license/LicenseActivationModal';

// Global flag: when true, the ghost-window logic won't steal focus
// Exported so ResizerHandle can set it during drags
export let isResizingGlobal = false;
export function setIsResizingGlobal(v: boolean) { isResizingGlobal = v; }

const App: React.FC = () => {
  const { edgePosition, setEdgePosition, isNotePanelOpen, isMiniMode, theme, isLicensed, setLicensed } = useAppStore();

  // Apply persisted theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Focus Tracker Interval
  useEffect(() => {
    const interval = setInterval(() => {
        useAppStore.getState().tickFocusTracker();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // License Check
  useEffect(() => {
    const storedKey = localStorage.getItem('kobar_license_key');
    if (storedKey) {
        setLicensed(true);
    }
  }, [setLicensed]);

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    if (window.api?.onEdgeChanged) {
      window.api.onEdgeChanged((edge) => {
        setEdgePosition(edge);
      });
    }
    if (window.api?.onOpenSettings) {
      unsubs.push(window.api.onOpenSettings(() => {
        useAppStore.getState().setMiniMode(false);
        useAppStore.getState().openSettingsTab();
      }));
    }
    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [setEdgePosition]);

  // Bulletproof click-through: detect whether the mouse is over
  // transparent background or actual UI elements
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Never steal focus while user is resizing
      if (isResizingGlobal) return;

      const target = e.target as HTMLElement;

      // Explicitly protect the resizer handles from becoming ghosts!
      if (target.closest('.resizer-handle')) {
        window.api?.setIgnoreMouseEvents(false);
        return;
      }

      const isTransparent =
        target.tagName === 'HTML' ||
        target.tagName === 'BODY' ||
        target.id === 'root';
      window.api?.setIgnoreMouseEvents(isTransparent);
    };

    // During HTML5 drag-and-drop, 'mousemove' is suppressed.
    // 'drag' fires continuously on the source element being dragged (if inside KoBar).
    // 'dragover' fires continuously on the target element under the cursor.
    // We use elementFromPoint to robustly determine transparency regardless of event type.
    const handleDragEvent = (e: DragEvent) => {
      if (isResizingGlobal) return;
      
      // If clientX/Y are 0, it means drag just ended or is off-screen. Ignore.
      if (e.clientX === 0 && e.clientY === 0) return;

      const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
      if (!elementUnderCursor) return;

      if (elementUnderCursor.closest('.resizer-handle')) {
        window.api?.setIgnoreMouseEvents(false);
        return;
      }

      const isTransparent =
        elementUnderCursor.tagName === 'HTML' ||
        elementUnderCursor.tagName === 'BODY' ||
        elementUnderCursor.id === 'root';
        
      window.api?.setIgnoreMouseEvents(isTransparent);
    };

    const handleDragEnd = () => {
      // Safety reset: when drag finishes, mousemove will fire again and fix state naturally,
      // but let's reset to false just in case.
      window.api?.setIgnoreMouseEvents(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('drag', handleDragEvent);
    window.addEventListener('dragover', handleDragEvent);
    window.addEventListener('dragenter', handleDragEvent);
    window.addEventListener('dragend', handleDragEnd);

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('drag', handleDragEvent);
        window.removeEventListener('dragover', handleDragEvent);
        window.removeEventListener('dragenter', handleDragEvent);
        window.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  return (
    <>
      <div className={`relative w-full h-full pointer-events-none flex justify-center transition-opacity duration-300 ${isMiniMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {!isMiniMode && (
          <div className="relative h-full pointer-events-none shrink-0" style={{ width: '64px' }}>
            <div className="absolute inset-0 pointer-events-none">
              <Sidebar />
            </div>
            {isLicensed && isNotePanelOpen && edgePosition === 'left' && (
              <div className="absolute top-0 left-[64px] pointer-events-none">
                <NotePanel />
              </div>
            )}
            {isLicensed && isNotePanelOpen && edgePosition === 'right' && (
              <div className="absolute top-0 right-[64px] pointer-events-none">
                <NotePanel />
              </div>
            )}
          </div>
        )}
      </div>

      {isMiniMode && <FloatingEye />}

      {!isLicensed && (
        <LicenseActivationModal onSuccess={() => setLicensed(true)} />
      )}
    </>
  );
};

export default App;
