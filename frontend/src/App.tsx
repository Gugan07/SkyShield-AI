import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { LiveDetection } from './pages/LiveDetection';
import { SpectrogramPage } from './pages/SpectrogramPage';
import { History } from './pages/History';
import { Analytics } from './pages/Analytics';
import { ModelInfo } from './pages/ModelInfo';
import { Settings } from './pages/Settings';
import { api } from './services/api';
import { wsClient } from './services/websocket';
import { SystemStatus } from './types/detection';

export function App() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  useEffect(() => {
    // Initial health & status check
    api.getSystemStatus().then(setSystemStatus).catch(console.error);
    const interval = setInterval(() => {
      api.getSystemStatus().then(setSystemStatus).catch(() => {});
    }, 10000);

    const unsubWs = wsClient.subscribeConnection(setWsConnected);

    return () => {
      clearInterval(interval);
      unsubWs();
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#070b12] text-slate-100 radar-grid-bg">
        {/* Top Header */}
        <Header systemStatus={systemStatus} wsConnected={wsConnected} />

        {/* Tactical Layout Body */}
        <div className="flex-1 flex flex-row overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-y-auto pb-12">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/live" element={<LiveDetection />} />
              <Route path="/spectrogram" element={<SpectrogramPage />} />
              <Route path="/history" element={<History />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/model" element={<ModelInfo />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
