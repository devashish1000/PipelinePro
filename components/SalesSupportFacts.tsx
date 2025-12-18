import React from 'react';

interface Fact {
  emoji: string;
  metric: string;
  text: string;
}

const FACTS: Fact[] = [
  { emoji: '📈', metric: '83% revenue growth', text: 'with AI vs 66% without' },
  { emoji: '🏆', metric: '28% higher win rates', text: 'with AI coaching' },
  { emoji: '⚡', metric: '2-5 hours saved', text: 'per sales rep weekly' },
  { emoji: '🔍', metric: '95% faster', text: 'information retrieval' },
  { emoji: '🎯', metric: '45% more deals', text: 'closed using AI/ML tools' },
  { emoji: '📊', metric: '44% productivity', text: 'increase reported' },
  { emoji: '💯', metric: '15% performance boost', text: 'from AI coaching' },
  { emoji: '💰', metric: '$1B pipeline added', text: '(Cisco case study)' },
  { emoji: '🚀', metric: '50% more leads', text: 'at 33% lower cost' },
  { emoji: '🎤', metric: 'Real-time feedback', text: 'improves objections' },
];

export const SalesSupportFacts: React.FC = () => {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h3 className="text-[#00D9FF] font-bold text-[14px] uppercase tracking-wider mb-1">SALES REP SUPPORT</h3>
        <p className="text-white/60 text-[11px]">AI Coaching Impact Data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FACTS.map((fact, i) => (
          <div 
            key={i} 
            className="flex items-start p-3 bg-[#00D9FF]/5 border-l-[3px] border-[#00D9FF]/40 rounded-[4px] hover:bg-[#00D9FF]/10 hover:border-[#00D9FF] hover:translate-x-1 transition-all duration-300"
          >
            <span className="text-[16px] mr-2 shrink-0">{fact.emoji}</span>
            <p className="text-[11px] leading-snug text-white/80">
              <strong className="text-[#00D9FF] font-semibold">{fact.metric}</strong> {fact.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};