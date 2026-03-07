import React, { useEffect } from 'react';
import './index.css';
import { useAppStore } from './store/useAppStore';
import Sidebar from './components/layout/Sidebar';
import NotePanel from './components/notes/NotePanel';

const App: React.FC = () => {
  const { setEdgePosition } = useAppStore();

  useEffect(() => {
    console.log('React checking window.api:', window.api);
    if (window.api && window.api.onEdgeChanged) {
      window.api.onEdgeChanged((edge) => {
        setEdgePosition(edge);
      });
    }
  }, [setEdgePosition]);

  return (
    <div className="w-full h-screen bg-transparent flex items-center justify-center overflow-hidden pointer-events-none">
      <div
        className="relative w-24 h-full z-10 pointer-events-auto"
        onMouseEnter={() => window.api?.setIgnoreMouseEvents(false)}
        onMouseLeave={() => window.api?.setIgnoreMouseEvents(true)}
      >
        <Sidebar />
        <NotePanel />
      </div>
    </div>
  );
};

export default App;
