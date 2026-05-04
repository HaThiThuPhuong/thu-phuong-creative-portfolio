import React from 'react';
import { motion } from 'motion/react';

export const BrandLogo = ({ className = '', size = 'normal', hideStroke = false, children }: { className?: string; size?: 'normal' | 'large' | 'hero'; hideStroke?: boolean; children?: React.ReactNode }) => {
  const isLarge = size === 'large';
  const isHero = size === 'hero';
  
  const getWidth = () => {
    if (isHero) return "w-[80vw] md:w-[70vw] max-w-[1200px] h-auto";
    if (isLarge) return "w-[300px] md:w-[450px] h-auto";
    return "w-[120px] md:w-[160px] h-auto";
  };

  const name = children || "Thu Phương";
  const firstLetter = typeof name === 'string' ? name[0] : '';
  const restOfName = typeof name === 'string' ? name.slice(1) : '';

  if (isHero) {
    return (
      <div className={`relative inline-block ${className}`} style={{ whiteSpace: 'nowrap' }}>
        <svg 
          viewBox="0 0 1400 180" 
          className={getWidth()}
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          {!hideStroke && (
            <motion.path
              d="M 500 30 L 900 30"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
            />
          )}
          <text
            x="700"
            y="140"
            textAnchor="middle"
            className="font-signature"
            style={{ 
              fontSize: '130px', 
              fill: 'currentColor',
              fontFamily: 'var(--font-signature)'
            }}
          >
            {typeof name === 'string' ? (
              <>
                <tspan style={{ fontSize: '160px' }}>{firstLetter}</tspan>
                <tspan>{restOfName}</tspan>
              </>
            ) : name}
          </text>
        </svg>
      </div>
    );
  }
  
  return (
    <div className={`relative inline-block ${className}`} style={{ whiteSpace: 'nowrap' }}>
      <svg 
        viewBox="0 0 350 100" 
        className={getWidth()}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        {/* The horizontal roof stroke of 'T' */}
        {!hideStroke && (
          <motion.path
            d="M 10 25 L 340 25"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
          />
        )}
        
        {/* Standard Menu/Normal Logo */}
        <text
          x="175"
          y="90"
          textAnchor="middle"
          className="font-signature"
          style={{ 
            fontSize: '55px', 
            fill: 'currentColor',
            fontFamily: 'var(--font-signature)'
          }}
        >
          {typeof name === 'string' ? (
            <>
              <tspan style={{ fontSize: '70px' }}>{firstLetter}</tspan>
              <tspan>{restOfName}</tspan>
            </>
          ) : name}
        </text>
      </svg>
    </div>
  );
};
