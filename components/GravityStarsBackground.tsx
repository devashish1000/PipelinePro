import React, { useRef, useEffect } from 'react';

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  baseOpacity: number;
}

interface GravityStarsBackgroundProps {
  starsCount: number;
  starsSize: number;
  starsOpacity: number;
  mouseGravity: 'repel' | 'attract';
  gravityStrength: number;
  movementSpeed: number;
  glowAnimation: 'spring' | 'none';
  glowIntensity: number;
}

export const GravityStarsBackground: React.FC<GravityStarsBackgroundProps> = ({
  starsCount,
  starsSize,
  starsOpacity,
  mouseGravity,
  gravityStrength,
  movementSpeed,
  glowAnimation,
  glowIntensity
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        initStars();
      }
    };

    const initStars = () => {
      const stars: Star[] = [];
      for (let i = 0; i < starsCount; i++) {
        const opacity = Math.random() * starsOpacity;
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * movementSpeed * 2,
          vy: (Math.random() - 0.5) * movementSpeed * 2,
          size: Math.random() * starsSize + 0.5,
          opacity: opacity,
          baseOpacity: opacity,
        });
      }
      starsRef.current = stars;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('resize', resize);
    // Attach to parent to catch mouse movement even if over text
    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove);
      parent.addEventListener('mouseleave', handleMouseLeave);
    }
    
    resize();

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      starsRef.current.forEach(star => {
        // Basic movement
        star.x += star.vx;
        star.y += star.vy;

        // Mouse interaction logic
        if (mouseRef.current.active) {
          const dx = star.x - mouseRef.current.x;
          const dy = star.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influenceRadius = 250;

          if (dist < influenceRadius) {
            const force = (influenceRadius - dist) / influenceRadius * (gravityStrength / 10);
            const angle = Math.atan2(dy, dx);
            const multiplier = mouseGravity === 'repel' ? 1 : -1;
            
            star.x += Math.cos(angle) * force * multiplier;
            star.y += Math.sin(angle) * force * multiplier;
          }
        }

        // Boundary wrapping
        if (star.x < -10) star.x = canvas.width + 10;
        if (star.x > canvas.width + 10) star.x = -10;
        if (star.y < -10) star.y = canvas.height + 10;
        if (star.y > canvas.height + 10) star.y = -10;

        // Glow animation (breathing effect if 'spring' is chosen)
        let currentOpacity = star.baseOpacity;
        if (glowAnimation === 'spring') {
          currentOpacity = star.baseOpacity * (0.8 + Math.sin(time + star.x * 0.01) * 0.2);
        }

        // Draw the star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
        
        if (glowIntensity > 0) {
          ctx.shadowBlur = glowIntensity;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        }

        ctx.fill();
        ctx.shadowBlur = 0; // Reset for next star
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [starsCount, starsSize, starsOpacity, mouseGravity, gravityStrength, movementSpeed, glowIntensity, glowAnimation]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none" 
      style={{ zIndex: 0 }} 
    />
  );
};