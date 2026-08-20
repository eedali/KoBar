import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'
import 'material-symbols/outlined.css'
import './index.css'
import App from './App.tsx'
import PipPlayer from './components/layout/PipPlayer.tsx'
import { useAppStore } from './store/useAppStore'
import './components/extensions/extensionRegistry'
import { setupLocalStorageIsolation } from './utils/localStorageIsolation'

window.React = React;
window.ReactDOM = ReactDOM;
window.useAppStore = useAppStore;

setupLocalStorageIsolation();

const urlParams = new URLSearchParams(window.location.search);
const isPipMode = urlParams.get('pip') === 'true';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPipMode ? <PipPlayer /> : <App />}
  </StrictMode>,
)

