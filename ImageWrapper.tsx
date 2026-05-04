import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

interface ImageWrapperProps {
  src?: string;
  alt?: string;
  className?: string;
  aspectRatio?: string;
  gridClass?: string;
}

export const ImageWrapper: React.FC<ImageWrapperProps> = ({ 
  src, 
  alt = 'Image', 
  className = '', 
  aspectRatio = 'aspect-video',
  gridClass = ''
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { isModelMode } = useTheme();

  return (
    <div 
      className={`relative overflow-hidden rounded-[30px] border border-white/20 grow-0 shrink-0 ${aspectRatio} ${gridClass} ${isModelMode ? 'placeholder-strawberry' : 'placeholder-mint'}`}
      style={{ isolation: 'isolate' }}
    >
      {/* Permanent Border / Frame */}
      <div className="absolute inset-0 border-2 border-white/5 opacity-20 pointer-events-none z-10" />

      {/* Skeleton / Placeholder */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 skeleton z-0"
          />
        )}
      </AnimatePresence>

      {/* Image */}
      {src ? (
        <motion.img
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover ${className}`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-20 rotate-45">No Content</span>
        </div>
      )}
    </div>
  );
};
