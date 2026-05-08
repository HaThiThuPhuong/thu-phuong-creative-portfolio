import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

export const ModeOverlay: React.FC = () => {
  const { isModelMode } = useTheme();
  const [show, setShow] = useState(false);
  const [prevMode, setPrevMode] = useState(isModelMode);

  useEffect(() => {
    if (isModelMode !== prevMode) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setPrevMode(isModelMode);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isModelMode, prevMode]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
           initial={{ clipPath: 'circle(0% at 50% 50%)' }}
           animate={{ clipPath: 'circle(150% at 50% 50%)' }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.8, ease: "easeInOut" }}
           className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
           style={{ 
             background: isModelMode ? '#FFF0F5' : '#F0FFF0',
           }}
        >
          {/* Mode icon center during transition */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            className="text-9xl bg-white/20 p-20 rounded-full backdrop-blur-xl border border-white/30"
          >
            {isModelMode ? '🌸' : '📊'}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
