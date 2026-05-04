import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { Star, Briefcase } from 'lucide-react';

export const ModeToggle = () => {
  const { isModelMode, toggleMode } = useTheme();

  return (
    <div 
      onClick={toggleMode}
      className="relative w-16 h-8 rounded-full bg-[var(--secondary)] cursor-pointer p-1 flex items-center transition-colors"
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white shadow-lg"
        style={{ x: isModelMode ? 0 : 32 }}
      >
        {isModelMode ? <Star size={14} /> : <Briefcase size={14} />}
      </motion.div>
      <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none opacity-30">
        <Star size={12} />
        <Briefcase size={12} />
      </div>
    </div>
  );
};
