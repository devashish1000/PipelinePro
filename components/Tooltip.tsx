import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';

interface TooltipProps {
  title: string;
  description?: string;
  metrics?: { label: string; value: string | number; desc: string }[];
  insights?: string[];
  content?: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ title, description, metrics, insights, content, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipStyles, setTooltipStyles] = useState<React.CSSProperties>({ opacity: 0, pointerEvents: 'none' });
  const [arrowStyles, setArrowStyles] = useState<React.CSSProperties>({});
  
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const gap = 16;
    const padding = 20;

    const spaceTop = triggerRect.top - gap;
    const spaceBottom = viewportHeight - triggerRect.bottom - gap;
    
    let placeTop = true;
    if (spaceTop < tooltipRect.height && spaceBottom > spaceTop) {
        placeTop = false;
    }

    let top = 0;
    if (placeTop) {
        top = triggerRect.top - tooltipRect.height - gap;
        if (top < padding) top = padding; 
    } else {
        top = triggerRect.bottom + gap;
        if (top + tooltipRect.height > viewportHeight - padding) {
            top = viewportHeight - tooltipRect.height - padding;
        }
    }

    let left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewportWidth - padding) {
        left = viewportWidth - tooltipRect.width - padding;
    }

    const triggerCenter = triggerRect.left + (triggerRect.width / 2);
    let arrowLeft = triggerCenter - left - 8;
    const maxArrowLeft = tooltipRect.width - 24; 
    const minArrowLeft = 16;
    if (arrowLeft < minArrowLeft) arrowLeft = minArrowLeft;
    if (arrowLeft > maxArrowLeft) arrowLeft = maxArrowLeft;

    setTooltipStyles({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        opacity: 1,
        width: 'max-content',
        maxWidth: '360px',
        zIndex: 2000,
        pointerEvents: 'auto',
        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
        transform: isOpen ? 'translateY(0)' : (placeTop ? 'translateY(8px)' : 'translateY(-8px)'),
    });

    setArrowStyles({
        position: 'absolute',
        left: `${arrowLeft}px`,
        [placeTop ? 'bottom' : 'top']: '-6px', 
        width: '12px',
        height: '12px',
        backgroundColor: '#1C2533', 
        borderRight: placeTop ? '1px solid rgba(255,255,255,0.1)' : 'none',
        borderBottom: placeTop ? '1px solid rgba(255,255,255,0.1)' : 'none',
        borderLeft: !placeTop ? '1px solid rgba(255,255,255,0.1)' : 'none',
        borderTop: !placeTop ? '1px solid rgba(255,255,255,0.1)' : 'none',
        transform: 'rotate(45deg)',
    });
  };

  useLayoutEffect(() => {
    if (isOpen && window.innerWidth >= 768) {
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }
  }, [isOpen]);

  const handleMouseEnter = () => window.innerWidth >= 768 && setIsOpen(true);
  const handleMouseLeave = () => window.innerWidth >= 768 && setIsOpen(false);
  const handleClick = (e: React.MouseEvent) => { e.stopPropagation(); setIsOpen(!isOpen); };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node) && triggerRef.current && !triggerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) { document.addEventListener('keydown', handleKeyDown); document.addEventListener('click', handleClickOutside); }
    return () => { document.removeEventListener('keydown', handleKeyDown); document.removeEventListener('click', handleClickOutside); };
  }, [isOpen]);

  return (
    <>
      <div ref={triggerRef} className="group relative h-full cursor-pointer" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={handleClick}>
        {children}
      </div>

      {isOpen && window.innerWidth >= 768 && (
        <div ref={tooltipRef} className="bg-[#1C2533]/98 backdrop-blur-2xl rounded-[20px] border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-6 text-left" style={tooltipStyles}>
            <div style={arrowStyles} />
            <h4 className="text-[11px] font-black text-teal-400 uppercase tracking-widest mb-3">{title}</h4>
            <div className="overflow-y-auto custom-scrollbar max-h-[400px]">
                <p className="text-[13px] text-white/90 mb-5 leading-relaxed font-medium">{description || content || ""}</p>
                {metrics && (
                    <div className="space-y-4">
                        {metrics.map((m, i) => (
                            <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5">
                                <span className="block text-xs font-black text-teal-400 uppercase tracking-widest mb-1">{m.label}: {m.value}</span>
                                <p className="text-[11px] text-white/50 font-medium leading-snug">{m.desc}</p>
                            </div>
                        ))}
                    </div>
                )}
                {insights && (
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <h5 className="text-[9px] font-black text-teal-400/60 uppercase tracking-[0.2em] mb-3">Actionable Insights</h5>
                    <div className="space-y-3">
                      {insights.map((insight, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <div className="w-5 h-5 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[10px] font-black text-teal-400">{i + 1}</span>
                          </div>
                          <p className="text-[12px] text-white/80 leading-snug font-medium">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
        </div>
      )}

      {isOpen && (
        <div className="md:hidden fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
            <div className="relative w-full max-w-[400px] bg-white rounded-[32px] p-8 shadow-2xl animate-ios-slide max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h4 className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">{title}</h4>
                        <h5 className="text-2xl font-black text-slate-900 tracking-tight">Detail View</h5>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 text-xl font-bold transition-colors hover:bg-slate-100">×</button>
                </div>
                <p className="text-[15px] text-slate-600 mb-8 leading-relaxed font-medium">{description || content || ""}</p>
                {metrics && (
                    <div className="space-y-4">
                        {metrics.map((m, i) => (
                            <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-900 font-black uppercase text-xs tracking-widest">{m.label}</span>
                                    <span className="text-teal-600 font-black">{m.value}</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-normal font-medium">{m.desc}</p>
                            </div>
                        ))}
                    </div>
                )}
                {insights && (
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h5 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] mb-4">Actionable Insights</h5>
                    <div className="space-y-4">
                      {insights.map((insight, i) => (
                        <div key={i} className="flex gap-4 items-start">
                          <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100 mt-0.5">
                            <span className="text-[12px] font-black text-teal-600">{i + 1}</span>
                          </div>
                          <p className="text-[14px] text-slate-700 leading-snug font-semibold">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
        </div>
      )}
    </>
  );
};