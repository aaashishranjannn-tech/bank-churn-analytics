import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import SoundControl from './components/SoundControl';
import GrainOverlay from './components/GrainOverlay';
import LoadingScreen from './components/LoadingScreen';
import Home from './pages/Home';
import CustomerUniverse from './pages/CustomerUniverse';
import Geography from './pages/Geography';
import CustomerBehavior from './pages/CustomerBehavior';
import ChurnIntelligence from './pages/ChurnIntelligence';
import MLPrediction from './pages/MLPrediction';
import CustomerExplorer from './pages/CustomerExplorer';
import './styles/global.css';

function AppContent() {
  return (
    <>
      <GrainOverlay />
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/universe" element={<CustomerUniverse />} />
        <Route path="/geography" element={<Geography />} />
        <Route path="/behavior" element={<CustomerBehavior />} />
        <Route path="/churn" element={<ChurnIntelligence />} />
        <Route path="/ml" element={<MLPrediction />} />
        <Route path="/explorer" element={<CustomerExplorer />} />
      </Routes>
    </>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);

  return (
    <HashRouter>
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}
      {loaded && <AppContent />}
    </HashRouter>
  );
}
