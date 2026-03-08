import React, { useEffect } from 'react';
import './index.css';
import { useAppStore } from './store/useAppStore';
import Sidebar from './components/layout/Sidebar';
import NotePanel from './components/notes/NotePanel';

// Global flag: when true, the ghost-window logic won't steal focus
// Exported so ResizerHandle can set it during drags
export let isResizingGlobal = false;
export function setIsResizingGlobal(v: boolean) { isResizingGlobal = v; }

const App: React.FC = () => {
  const { edgePosition, setEdgePosition, isNotePanelOpen } = useAppStore();

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    if (window.api?.onEdgeChanged) {
      window.api.onEdgeChanged((edge) => {
        setEdgePosition(edge);
      });
    }
    if (window.api?.onOpenSettings) {
      unsubs.push(window.api.onOpenSettings(() => {
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
        target.id === 'root' ||
        target.classList.contains('bg-transparent');
      window.api?.setIgnoreMouseEvents(isTransparent);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative w-full h-full pointer-events-none flex justify-center">
      <div className="relative h-full pointer-events-auto shrink-0" style={{ width: '64px' }}>
        <div className="absolute inset-0">
          <Sidebar />
        </div>
        {isNotePanelOpen && edgePosition === 'left' && (
          <div className="absolute top-0 left-[64px]">
            <NotePanel />
          </div>
        )}
        {isNotePanelOpen && edgePosition === 'right' && (
          <div className="absolute top-0 right-[64px]">
            <NotePanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
