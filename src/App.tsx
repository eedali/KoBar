import React, { useEffect } from 'react';
import './index.css';
import { useAppStore } from './store/useAppStore';
import Sidebar from './components/layout/Sidebar';
import NotePanel from './components/notes/NotePanel';

const App: React.FC = () => {
  const { edgePosition, setEdgePosition } = useAppStore();

  useEffect(() => {
    console.log('React checking window.api:', window.api);
    if (window.api && window.api.onEdgeChanged) {
      window.api.onEdgeChanged((edge) => {
        setEdgePosition(edge);
      });
    }
  }, [setEdgePosition]);

  return (
    <div className="w-full h-full bg-transparent flex items-center justify-center overflow-hidden">
      {/* Anchor container for the Sidebar. NotePanel will absolutely position itself relative to this anchor. */}
      <div className="relative w-24 h-full z-10 flex">
        <NotePanel />
        <Sidebar />
      </div>
    </div>
  );
};

export default App;
