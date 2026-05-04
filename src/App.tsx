import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { CanvasBackground } from './components/CanvasBackground';
import { ModeOverlay } from './components/ModeOverlay';
import { Navigation } from './components/Navigation';
import { ModelMode } from './components/ModelMode';
import { BAMode } from './components/BAMode';
import { LoadingScreen } from './components/LoadingScreen';
import { CustomCursor } from './components/CustomCursor';
import { WindChime } from './components/WindChime';
import { ScopedParticles } from './components/ScopedParticles';
import { BackgroundMusic } from './components/BackgroundMusic';

const AppContent = () => {
  const { isModelMode } = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-[var(--accent)] selection:text-white">
      <AnimatePresence>
        {loading && <LoadingScreen />}
      </AnimatePresence>

      <CustomCursor />
      <BackgroundMusic />
      <ScopedParticles type="trail" isFixed={true} />
      <ModeOverlay />
      <Navigation />
      
      <main>
        <AnimatePresence mode="wait">
          {isModelMode ? (
            <div key="model">
              <ModelMode />
            </div>
          ) : (
            <div key="ba">
              <BAMode />
            </div>
          )}
        </AnimatePresence>
      </main>

      <WindChime />

      <footer className="py-20 text-center opacity-30 text-xs uppercase tracking-[0.4em]">
        Design & Code with Love © 2026 Thu Phương
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
