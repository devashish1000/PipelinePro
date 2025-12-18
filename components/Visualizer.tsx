import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  volume: number;
  isActive: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ volume, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    const bars = 30;
    const barWidth = canvas.width / bars;
    
    // Smooth volume transition
    let currentVol = 0;

    const render = () => {
      // Ease the volume
      currentVol += (volume - currentVol) * 0.2;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (!isActive) {
         // Draw a flat line if not active
         ctx.beginPath();
         ctx.strokeStyle = '#334155';
         ctx.moveTo(0, canvas.height / 2);
         ctx.lineTo(canvas.width, canvas.height / 2);
         ctx.stroke();
         return;
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw bars mirroring from center
      for (let i = 0; i < bars; i++) {
        // Calculate height based on volume and position (sine wave effect)
        const percent = i / bars;
        const offset = Math.abs(percent - 0.5) * 2; // 0 at center, 1 at edges
        const wave = Math.sin(Date.now() * 0.005 + i * 0.5);
        
        let h = currentVol * 300 * (1 - offset * 0.5) * (0.5 + wave * 0.5);
        h = Math.max(h, 4); // Min height

        const x = i * barWidth;
        const y = centerY - h / 2;
        
        // Color gradient based on volume
        const r = 56 + currentVol * 200; // Slate to Blue/Cyan
        const g = 189;
        const b = 248;
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.roundRect(x + 2, y, barWidth - 4, h, 4);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [volume, isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={200} 
      className="w-full h-48 rounded-xl bg-slate-900 border border-slate-800 shadow-inner"
    />
  );
};
