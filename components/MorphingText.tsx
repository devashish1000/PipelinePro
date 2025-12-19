import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MorphingTextProps {
  texts: string[];
  loop?: boolean;
  holdDelay?: number;
  className?: string;
}

export const MorphingText: React.FC<MorphingTextProps> = ({
  texts,
  loop = true,
  holdDelay = 3000,
  className = ""
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (texts.length <= 1) return;

    const interval = setInterval(() => {
      setIndex((current) => {
        if (current === texts.length - 1) {
          return loop ? 0 : current;
        }
        return current + 1;
      });
    }, holdDelay);

    return () => clearInterval(interval);
  }, [texts, loop, holdDelay]);

  const currentText = texts[index] || "";
  // Detection logic for "solution" phrases: solutions end with a period.
  const isSolution = currentText.endsWith('.');

  return (
    <div className={`relative h-20 w-full flex items-center justify-center overflow-visible ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(12px)" }}
          transition={{ 
            duration: 0.7, 
            ease: [0.16, 1, 0.3, 1] 
          }}
          className={`absolute inset-0 flex items-center justify-center whitespace-nowrap text-center px-4 drop-shadow-[0_0_12px_rgba(45,212,191,0.4)] ${isSolution ? 'text-teal-400' : 'text-white'}`}
        >
          {currentText}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};