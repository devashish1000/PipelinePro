
import React from 'react';
import { motion } from 'framer-motion';

interface AIAgentLogoProps {
  state?: 'idle' | 'listening' | 'speaking' | 'processing';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  noBackground?: boolean;
}

export const AIAgentLogo: React.FC<AIAgentLogoProps> = ({ state = 'idle', size = 'md', noBackground = false }) => {
  const sizeMap = {
    sm: 32,
    md: 44,
    lg: 64,
    xl: 128,
  };

  const pixelSize = sizeMap[size];

  // Official Wolters Kluwer Brand Palette
  const colors = {
    blueMid: "#3B82F6",
    blueLight: "#60A5FA",
    greenVibrant: "#84CC16",
    greenLight: "#BEF264",
    redCenter: "#EF4444",
  };

  /**
   * 5x5 Grid Layout (matching the WK circular icon pattern)
   * 1 = blueMid, 2 = blueLight, 3 = greenVibrant, 4 = greenLight, 5 = redCenter
   * null = empty corner
   */
  const grid = [
    [null, 1, 2, 1, null],
    [1, 3, 4, 3, 1],
    [2, 4, 5, 4, 2],
    [1, 3, 4, 3, 1],
    [null, 1, 2, 1, null],
  ];

  const getColor = (val: number | null) => {
    switch(val) {
      case 1: return colors.blueMid;
      case 2: return colors.blueLight;
      case 3: return colors.greenVibrant;
      case 4: return colors.greenLight;
      case 5: return colors.redCenter;
      default: return 'transparent';
    }
  };

  // Use "as const" on ease: "linear" to satisfy Framer Motion type requirements
  const containerVariants = {
    idle: { scale: 1 },
    listening: { scale: [1, 1.05, 1], transition: { duration: 1.5, repeat: Infinity } },
    speaking: { y: [0, -4, 0], transition: { duration: 0.4, repeat: Infinity } },
    processing: { rotate: 360, transition: { duration: 2, repeat: Infinity, ease: "linear" as const } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      animate={state}
      className={`relative inline-flex items-center justify-center rounded-full transition-shadow duration-500 ${!noBackground ? 'bg-white shadow-lg border border-white/20' : ''}`}
      style={{ width: pixelSize, height: pixelSize, padding: noBackground ? 0 : pixelSize * 0.12 }}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full overflow-visible"
      >
        <defs>
          <clipPath id="logoCircle">
            <circle cx="50" cy="50" r="49" />
          </clipPath>
        </defs>
        
        <g clipPath="url(#logoCircle)">
          {grid.map((row, y) => 
            row.map((cell, x) => {
              if (cell === null) return null;
              return (
                <rect 
                  key={`${x}-${y}`}
                  x={x * 20}
                  y={y * 20}
                  width="19"
                  height="19"
                  fill={getColor(cell)}
                  rx="1.5"
                />
              );
            })
          )}
        </g>
        
        {/* Trademark symbol */}
        {size !== 'sm' && (
          <text 
            x="90" 
            y="96" 
            fontSize="8" 
            fontWeight="bold" 
            fontFamily="sans-serif"
            fill={noBackground ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)"}
          >
            ®
          </text>
        )}
      </svg>
    </motion.div>
  );
};
