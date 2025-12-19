import React, { useState } from 'react';
import { Scenario } from '../types';

interface SetupProps {
  onStart: (scenario: Scenario) => void;
  onViewHistory: () => void;
}

const WK_PRODUCTS = [
  'Enterprise SaaS Solution',
  'Tax Software (CCH Axcess)',
  'Legal Research Platform (VitalLaw)',
  'Compliance Management System',
  'Healthcare Revenue Cycle Solution'
];

const PROSPECT_ROLES = [
  'CFO of Fortune 500 company',
  'General Counsel at a major law firm',
  'Tax Director at a global corporation',
  'Chief Compliance Officer',
  'Hospital Administrator',
  'CTO of a mid-sized fintech company'
];

export const Setup: React.FC<SetupProps> = ({ onStart, onViewHistory }) => {
  const [product, setProduct] = useState(WK_PRODUCTS[0]);
  const [prospectRole, setProspectRole] = useState(PROSPECT_ROLES[0]);
  const [difficulty, setDifficulty] = useState<Scenario['difficulty']>('Medium');
  const [duration, setDuration] = useState<Scenario['duration']>('10 MIN');
  const [context, setContext] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({ product, prospectRole, difficulty, duration, context });
  };

  return (
    <div className="max-w-2xl mx-auto pt-5 px-6 pb-6 bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 shadow-xl animate-ios-slide">
      <div className="flex justify-between items-start mb-6">
        <div>
            <h2 className="text-2xl font-black text-white tracking-tight leading-none">AI Coach Setup</h2>
            <p className="text-white/70 font-bold uppercase tracking-[0.2em] text-[8px] mt-2">Wolters Kluwer Training Sandbox</p>
        </div>
        <button 
          onClick={onViewHistory}
          className="bg-white/30 hover:bg-white/40 text-white px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border border-white/20"
        >
          HISTORY
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white/70 text-[9px] font-black uppercase tracking-[0.2em] mb-2 ml-1">Target Product</label>
            <div className="relative group">
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full bg-white/10 border border-white/30 text-white placeholder-white/50 rounded-lg p-4 font-bold outline-none transition appearance-none cursor-pointer shadow-inner text-[13px] focus:bg-white/20"
              >
                {WK_PRODUCTS.map(p => <option key={p} value={p} className="bg-slate-900">{p}</option>)}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-white/70 text-[9px] font-black uppercase tracking-[0.2em] mb-2 ml-1">Prospect Profile</label>
            <div className="relative group">
              <select
                value={prospectRole}
                onChange={(e) => setProspectRole(e.target.value)}
                className="w-full bg-white/10 border border-white/30 text-white placeholder-white/50 rounded-lg p-4 font-bold outline-none transition appearance-none cursor-pointer shadow-inner text-[13px] focus:bg-white/20"
              >
                {PROSPECT_ROLES.map(r => <option key={r} value={r} className="bg-slate-900">{r}</option>)}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-white/70 text-[9px] font-black uppercase tracking-[0.2em] mb-2 ml-1">Difficulty</label>
          <div className="grid grid-cols-4 gap-2.5">
            {(['Easy', 'Medium', 'Hard', 'Impossible'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={`py-3.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-sm border ${
                  difficulty === level
                    ? 'bg-white/40 text-white border-white/50 shadow-lg'
                    : 'bg-white/10 text-white/60 border-white/20 hover:bg-white/20'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-white/70 text-[9px] font-black uppercase tracking-[0.2em] mb-2 ml-1">Call Duration</label>
          <div className="grid grid-cols-4 gap-2.5">
            {(['5 MIN', '10 MIN', '15 MIN', 'NONE'] as const).map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setDuration(time)}
                className={`py-3.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-sm border ${
                  duration === time
                    ? 'bg-white/40 text-white border-white/50 shadow-lg'
                    : 'bg-white/10 text-white/60 border-white/20 hover:bg-white/20'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-white/70 text-[9px] font-black uppercase tracking-[0.2em] mb-2 ml-1">Contextual Background</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={3}
            className="w-full bg-white/10 border border-white/30 text-white placeholder-white/50 rounded-lg p-5 font-bold outline-none transition placeholder-white/30 resize-none shadow-inner text-[13px] focus:bg-white/20"
            placeholder="e.g. Prospect is pushing for a 20% discount and mentions a competitor's lower pricing..."
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#FF6B35] hover:bg-[#FF8B60] text-white font-black text-[14px] uppercase tracking-[0.25em] py-5 rounded-full shadow-[0_20px_40px_rgba(255,107,53,0.3)] transform transition-all active:scale-[0.98] mt-2 border border-white/20"
        >
          Initialize Simulation
        </button>
      </form>
    </div>
  );
};
