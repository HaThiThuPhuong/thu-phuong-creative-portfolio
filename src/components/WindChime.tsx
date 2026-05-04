import React from 'react';
import { Music, Music2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

export const WindChime = () => {
    const { isMuted, toggleMute } = useTheme();

    const playChime = () => {
        if (isMuted) {
            const audio = new Audio();
            audio.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3';
            audio.volume = 0.2;
            audio.play().catch((err) => {
                console.error('Chime play error:', err);
            });
        }
        toggleMute();
    };

    return (
        <motion.button
            whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
            whileTap={{ scale: 0.9 }}
            onClick={playChime}
            className="fixed bottom-6 left-6 w-12 h-12 rounded-full glass border border-white/20 flex items-center justify-center text-[var(--accent)] z-40 group shadow-xl"
            title={isMuted ? "Bật nhạc" : "Tắt nhạc"}
        >
            <AnimatePresence mode="wait">
              {isMuted ? (
                <motion.div
                  key="muted"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <Music2 size={20} className="text-gray-400 opacity-50" />
                </motion.div>
              ) : (
                <motion.div
                  key="playing"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="relative"
                >
                  <Music size={20} />
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-[var(--accent)] rounded-full -z-10 blur-sm"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Tooltip */}
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-black/80 text-white text-[10px] uppercase font-bold tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {isMuted ? 'Music Off' : 'Music On'}
            </div>
        </motion.button>
    );
};
