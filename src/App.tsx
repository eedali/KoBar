import React, { useEffect } from 'react';
import './index.css';
import { useAppStore } from './store/useAppStore';
import Sidebar from './components/layout/Sidebar';
import NotePanel from './components/notes/NotePanel';
import FloatingEye from './components/layout/FloatingEye';
import CalculatorPopup from './components/layout/CalculatorPopup';
import LicenseActivationModal from './components/license/LicenseActivationModal';

// Global flag: when true, the ghost-window logic won't steal focus
// Exported so ResizerHandle can set it during drags
export let isResizingGlobal = false;
export function setIsResizingGlobal(v: boolean) { isResizingGlobal = v; }

// Set this to true for Microsoft Store releases (disables custom licensing & updates)
export const IS_STORE_BUILD = true;

const App: React.FC = () => {
  const { 
    edgePosition, setEdgePosition, isNotePanelOpen, isMiniMode, theme, isLicensed, setLicensed, 
    isCalculatorOpen, design 
  } = useAppStore();

  // Apply persisted theme/design on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-design', design);
  }, [theme, design]);

  // Focus Tracker Interval
  useEffect(() => {
    const interval = setInterval(() => {
        useAppStore.getState().tickFocusTracker();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // License Check
  useEffect(() => {
    if (IS_STORE_BUILD) {
        setLicensed(true);
        return;
    }
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingGlobal) return;
      const target = e.target as HTMLElement;
      if (target.closest('.resizer-handle')) {
        window.api?.setIgnoreMouseEvents(false);
        return;
      }
      const isTransparent =
        target.tagName === 'HTML' ||
        target.tagName === 'BODY' ||
        target.id === 'root' ||
        (target.classList.contains('bg-transparent') && !target.closest('.pointer-events-auto'));
      window.api?.setIgnoreMouseEvents(isTransparent);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <div className="relative w-full h-full pointer-events-none flex items-start justify-center pt-[20px]">
        <div className={`relative h-fit pointer-events-auto shrink-0 transition-opacity duration-300 ${isMiniMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} 
             style={{ width: '80px', zIndex: 30 }}>
          {!isMiniMode && (
            <>
              <Sidebar />
              {isLicensed && isNotePanelOpen && edgePosition === 'left' && (
                <div className="absolute top-0 left-[80px] pointer-events-none" style={{ zIndex: 20 }}>
                  <NotePanel />
                </div>
              )}
              {isLicensed && isNotePanelOpen && edgePosition === 'right' && (
                <div className="absolute top-0 right-[80px] pointer-events-none" style={{ zIndex: 20 }}>
                  <NotePanel />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isMiniMode && <FloatingEye />}

      {isCalculatorOpen && isLicensed && !isMiniMode && <CalculatorPopup />}

      {!IS_STORE_BUILD && !isLicensed && (
        <LicenseActivationModal onSuccess={() => setLicensed(true)} />
      )}
    </>
  );
};

export default App;
