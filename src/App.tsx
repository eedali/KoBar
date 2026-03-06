import React, { useEffect } from 'react';
import './index.css';
import { useAppStore } from './store/useAppStore';

const App: React.FC = () => {
  const { edgePosition, setEdgePosition } = useAppStore();

  useEffect(() => {
    console.log('React checking window.api:', window.api);
    // Listen to edge changes from Electron Main Process
    if (window.api && window.api.onEdgeChanged) {
      window.api.onEdgeChanged((edge) => {
        setEdgePosition(edge);
      });
    }
  }, [setEdgePosition]);

  const handleHide = () => {
    if (window.api && window.api.hideApp) {
      window.api.hideApp();
    }
  };

  return (
    <div className="w-full h-full flex items-center relative overflow-visible">
      {/* 
        NOTE PANEL
        Renders on the OPPOSITE side of the screen edge.
      */}
      <div
        className={`absolute top-0 h-full w-64 bg-blue-900 border border-blue-700 flex flex-col p-4 shadow-xl z-0 transition-opacity duration-300 ${edgePosition === 'right' ? '-left-64 rounded-l-lg' : '-right-64 rounded-r-lg'
          }`}
      >
        <h2 className="text-white font-bold mb-2">Note Panel</h2>
        <p className="text-blue-200 text-sm">DYNAMICALLY SPAWNING ON: {edgePosition === 'right' ? 'LEFT' : 'RIGHT'}</p>
      </div>

      {/* 
        KOBAR MAIN VERTICAL BAR 
        Needs high z-index to stay on top of the note panel shadow
      */}
      <div className="w-full h-full flex flex-col items-center bg-bg-dark text-white rounded-lg shadow-2xl border border-gray-800 overflow-hidden drag-region select-none z-10 relative">
        {/* Top Drag Handle */}
        <div className="w-full h-8 flex justify-center items-center opacity-50 hover:opacity-100 transition-opacity">
          <div className="w-8 h-1 bg-gray-500 rounded-full"></div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center space-y-4 no-drag-region">
          <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-yellow-500">
            KoBar
          </div>
          <p className="text-xs text-gray-400">Edge: {edgePosition}</p>

          {/* Temporary Eye Button to test IPC */}
          <button
            onClick={handleHide}
            className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-600 shadow-md flex items-center justify-center cursor-pointer active:scale-95 text-xl relative group"
            title="Hide App"
          >
            👁️
            <span className="absolute left-14 hidden group-hover:block bg-black text-xs p-1 rounded whitespace-nowrap">Hide (IPC)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
