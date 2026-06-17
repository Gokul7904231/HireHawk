import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { hasProfile } from '../../lib/resume-storage';

async function init() {
  const hasProf = await hasProfile();
  if (!hasProf) {
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL("/entrypoints/onboarding/index.html") });
      window.close();
    } else {
      window.location.href = "../onboarding/index.html";
    }
    return;
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

init();
