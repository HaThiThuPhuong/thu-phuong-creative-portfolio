import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, 20);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center"
    >
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full rotate-[-10deg]">
          {/* Strawberry path */}
          <motion.path
            d="M 50 10 C 30 10 10 30 10 60 C 10 90 50 95 50 95 C 50 95 90 90 90 60 C 90 30 70 10 50 10"
            fill="none"
            stroke="#FF4D6D"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ strokeDasharray: "300 0", strokeDashoffset: 300 }}
            animate={{ strokeDashoffset: 300 - (300 * progress / 100) }}
            transition={{ duration: 0.1 }}
          />
          {/* Seeds */}
          {progress > 50 && (
             <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <circle cx="40" cy="40" r="1.5" fill="#FF4D6D" />
                <circle cx="60" cy="45" r="1.5" fill="#FF4D6D" />
                <circle cx="35" cy="65" r="1.5" fill="#FF4D6D" />
                <circle cx="65" cy="65" r="1.5" fill="#FF4D6D" />
                <circle cx="50" cy="75" r="1.5" fill="#FF4D6D" />
             </motion.g>
          )}
          {/* Leaf */}
          <motion.path 
            d="M 50 10 Q 55 0 65 5 Q 55 8 50 15 Q 45 8 35 5 Q 45 0 50 10" 
            fill="#A2D2FF"
            initial={{ scale: 0 }}
            animate={{ scale: progress > 30 ? 1 : 0 }}
          />
        </svg>
      </div>
      <div className="mt-8 font-display text-xl tracking-widest text-[var(--accent)]">
        {progress}%
      </div>
    </motion.div>
  );
};
