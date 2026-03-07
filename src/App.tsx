import React, { useEffect } from 'react';
import './index.css';
import { useAppStore } from './store/useAppStore';
import Sidebar from './components/layout/Sidebar';
import NotePanel from './components/notes/NotePanel';

const App: React.FC = () => {
  const { setEdgePosition } = useAppStore();

  useEffect(() => {
    if (window.api?.onEdgeChanged) {
      window.api.onEdgeChanged((edge) => {
        setEdgePosition(edge);
      });
    }
  }, [setEdgePosition]);

  // Bulletproof click-through: detect whether the mouse is over
  // transparent background or actual UI elements
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
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
    <div className="w-full h-screen bg-transparent flex items-center justify-center overflow-hidden">
      <div className="relative w-24 h-full z-10">
        <Sidebar />
        <NotePanel />
      </div>
    </div>
  );
};

export default App;
