import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const BackgroundMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Using a soft piano/inspiring track
  const audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3"; // Placeholder inspiring track

  useEffect(() => {
    audioRef.current = new Audio(audioUrl);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const playPromiseRef = useRef<Promise<void> | null>(null);

  const toggleMusic = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      // Wait for play promise to resolve before pausing if it exists
      if (playPromiseRef.current) {
        await playPromiseRef.current;
      }
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      playPromiseRef.current = audioRef.current.play();
      try {
        await playPromiseRef.current;
        setIsPlaying(true);
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Playback error:", error);
        }
        setIsPlaying(false);
      } finally {
        playPromiseRef.current = null;
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleMusic}
        className="w-12 h-12 rounded-full glass border border-white/30 flex items-center justify-center text-[var(--accent)] shadow-xl relative overflow-hidden group"
      >
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div
              key="playing"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
            >
              <Volume2 size={20} />
            </motion.div>
          ) : (
            <motion.div
              key="paused"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
            >
              <VolumeX size={20} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {isPlaying && (
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-[var(--accent)]/10"
          />
        )}
      </motion.button>
    </div>
  );
};
