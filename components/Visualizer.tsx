import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  inputAnalyser: AnalyserNode | null;
  outputAnalyser: AnalyserNode | null;
  isActive: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ inputAnalyser, outputAnalyser, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    const bufferLength = inputAnalyser ? inputAnalyser.frequencyBinCount : 128;
    const dataArrayIn = new Uint8Array(bufferLength);
    const dataArrayOut = new Uint8Array(bufferLength);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (!isActive) {
        // Subtle idle line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Collect data
      if (inputAnalyser) inputAnalyser.getByteFrequencyData(dataArrayIn);
      if (outputAnalyser) outputAnalyser.getByteFrequencyData(dataArrayOut);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const barCount = 48;
      const barWidth = (canvas.width / barCount) * 0.8;
      const gap = (canvas.width / barCount) * 0.2;

      for (let i = 0; i < barCount; i++) {
        // Symmetrical layout
        const distFromCenter = Math.abs(i - barCount / 2);
        const dataIndex = Math.floor((distFromCenter / (barCount / 2)) * (bufferLength / 2));
        
        // Combine input and output data for a unified view
        const valIn = dataArrayIn[dataIndex] || 0;
        const valOut = dataArrayOut[dataIndex] || 0;
        const value = Math.max(valIn, valOut);
        
        const scale = 1 - (distFromCenter / (barCount / 2)) * 0.5;
        const h = (value / 255) * canvas.height * 0.8 * scale + 4;

        const x = i * (barWidth + gap);
        const y = centerY - h / 2;

        // Gradient color: Cyan/Blue for model (output), Green/Teal for user (input)
        const alpha = Math.max(0.3, value / 255);
        let fillStyle = `rgba(255, 255, 255, ${alpha})`;
        
        if (valOut > valIn) {
          // Model is speaking
          fillStyle = `rgba(59, 130, 246, ${alpha})`; // Blue-500
        } else if (valIn > 5) {
          // User is speaking
          fillStyle = `rgba(34, 197, 94, ${alpha})`; // Green-500
        }

        ctx.fillStyle = fillStyle;
        
        // Draw rounded bars
        const radius = barWidth / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, h, radius);
        ctx.fill();
        
        // Add subtle glow for active bars
        if (value > 50) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = fillStyle;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [inputAnalyser, outputAnalyser, isActive]);

  return (
    <div className="relative w-full h-32 rounded-3xl bg-black/20 backdrop-blur-xl border border-white/10 shadow-inner overflow-hidden flex items-center justify-center p-4">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={200} 
        className="w-full h-full"
      />
    </div>
  );
};
