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
    <div
      className={`relative w-full h-full bg-[#1e1b17] border border-[#3f362b] shadow-2xl flex overflow-hidden z-10 transition-all duration-300 ${edgePosition === 'right' ? 'flex-row' : 'flex-row-reverse'
        }`}
    >
      <NotePanel />
      <Sidebar />
    </div>
  );
};

export default App;
