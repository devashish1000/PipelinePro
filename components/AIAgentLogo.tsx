import React from 'react';

interface AIAgentLogoProps {
  state: 'idle' | 'listening' | 'speaking' | 'processing';
}

export const AIAgentLogo: React.FC<AIAgentLogoProps> = ({ state }) => {
  const getLogoStateClass = () => {
    switch (state) {
      case 'listening': return 'scale-[1.05] border-[#00D9FF] shadow-[0_0_30px_rgba(0,217,255,1)] animate-[listening-pulse_0.5s_ease-out]';
      case 'speaking': return 'animate-[speaking-pulse_0.8s_ease-in-out_infinite]';
      case 'processing': return 'animate-spin-slow brightness-110';
      default: return 'ai-agent-logo-container ai-agent-logo-glow';
    }
  };

  return (
    <div 
      className={`relative w-[180px] h-[180px] md:w-[200px] md:h-[200px] border-2 border-[#00D9FF] rounded-[8px] bg-black shadow-[0_0_20px_rgba(0,217,255,0.4)] flex items-center justify-center overflow-hidden transition-all duration-300 ${getLogoStateClass()}`}
      title="AI Coach Agent - Wolters Kluwer"
    >
      {/* Pixelated Sphere Simulation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-32 h-32 rounded-full overflow-hidden flex items-center justify-center">
          {/* Grid of pixels */}
          <div className="grid grid-cols-8 gap-[2px] w-full h-full p-2">
            {Array.from({ length: 64 }).map((_, i) => {
              const isCenter = (i >= 27 && i <= 28) || (i >= 35 && i <= 36);
              const isOuter = i < 8 || i > 55 || i % 8 === 0 || i % 8 === 7;
              return (
                <div 
                  key={i} 
                  className={`w-full h-full rounded-sm transition-colors duration-500 ${
                    isCenter ? 'bg-[#2A1A4A] opacity-90' :
                    isOuter ? 'bg-[#C8FF00] opacity-60' :
                    i % 3 === 0 ? 'bg-[#00D9FF]' : 'bg-[#87CEEB]'
                  } ${state === 'speaking' ? 'animate-pulse' : ''}`}
                  style={{ animationDelay: `${i * 0.02}s` }}
                />
              );
            })}
          </div>
          {/* Overlay gradient for depth */}
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/40"></div>
        </div>
      </div>

      {/* Mechanical corners/screws */}
      <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-slate-400/50"></div>
      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-slate-400/50"></div>
      <div className="absolute bottom-1 left-1 w-2 h-2 rounded-full bg-slate-400/50"></div>
      <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-slate-400/50"></div>

      {/* WK Monogram */}
      <div className="absolute bottom-2 right-2 bg-white/10 px-1.5 py-0.5 rounded border border-white/20">
        <span className="text-white/60 text-[9px] font-black tracking-tighter">WK</span>
      </div>
    </div>
  );
};
