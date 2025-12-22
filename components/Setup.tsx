
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
  'General Counsel at major firm',
  'Tax Director at global corp',
  'Chief Compliance Officer',
  'Hospital Administrator',
  'CTO of fintech company'
];

export const Setup: React.FC<SetupProps> = ({ onStart, onViewHistory }) => {
  const [product, setProduct] = useState(WK_PRODUCTS[0]);
  const [productDescription, setProductDescription] = useState('');
  const [prospectRole, setProspectRole] = useState(PROSPECT_ROLES[0]);
  const [difficulty, setDifficulty] = useState<Scenario['difficulty']>('Medium');
  const [duration, setDuration] = useState<Scenario['duration']>('10 MIN');
  const [context, setContext] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({ product, productDescription, prospectRole, difficulty, duration, context });
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 bg-white/10 backdrop-blur-2xl rounded-[24px] border border-white/20 shadow-2xl animate-ios-slide">
      <div className="flex justify-between items-center gap-4 mb-4">
        <div>
            <h2 className="text-xl font-black text-white tracking-tight leading-none">Coach Setup</h2>
            <p className="text-white/60 font-black uppercase tracking-[0.2em] text-[8px] mt-1">Training Sandbox</p>
        </div>
        <button 
          onClick={onViewHistory}
          className="bg-white/10 hover:bg-white/20 active:scale-95 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
        >
          View History
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-white/50 text-[10px] font-black uppercase tracking-[0.15em] ml-1">Target Product</label>
            <div className="relative group">
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full h-10 bg-white/10 border border-white/20 text-white rounded-xl px-4 font-bold outline-none transition appearance-none cursor-pointer focus:border-white/50 focus:bg-white/15 text-[14px] shadow-sm"
              >
                {WK_PRODUCTS.map(p => <option key={p} value={p} className="bg-[#1e293b]">{p}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-white/50 text-[10px] font-black uppercase tracking-[0.15em] ml-1">Prospect Profile</label>
            <div className="relative group">
              <select
                value={prospectRole}
                onChange={(e) => setProspectRole(e.target.value)}
                className="w-full h-10 bg-white/10 border border-white/20 text-white rounded-xl px-4 font-bold outline-none transition appearance-none cursor-pointer focus:border-white/50 focus:bg-white/15 text-[14px] shadow-sm"
              >
                {PROSPECT_ROLES.map(r => <option key={r} value={r} className="bg-[#1e293b]">{r}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-white/50 text-[10px] font-black uppercase tracking-[0.15em] ml-1">Product Description</label>
          <textarea
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            rows={1}
            className="w-full bg-white/10 border border-white/20 text-white rounded-xl p-3 font-bold outline-none transition placeholder-white/20 resize-none text-[14px] focus:border-white/50 focus:bg-white/15 shadow-sm"
            placeholder="Briefly describe the key features..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-white/50 text-[10px] font-black uppercase tracking-[0.15em] ml-1">Challenge Level</label>
          <div className="grid grid-cols-4 gap-2">
            {(['Easy', 'Medium', 'Hard', 'Impossible'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={`h-9 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border ${
                  difficulty === level
                    ? 'bg-white text-slate-900 border-white shadow-lg'
                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-white/50 text-[10px] font-black uppercase tracking-[0.15em] ml-1">Call Duration</label>
          <div className="grid grid-cols-4 gap-2">
            {(['5 MIN', '10 MIN', '15 MIN', 'NONE'] as const).map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setDuration(time)}
                className={`h-9 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border ${
                  duration === time
                    ? 'bg-white text-slate-900 border-white shadow-lg'
                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-white/50 text-[10px] font-black uppercase tracking-[0.15em] ml-1">Call Context</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={2}
            className="w-full bg-white/10 border border-white/20 text-white rounded-xl p-3 font-bold outline-none transition placeholder-white/20 resize-none text-[14px] focus:border-white/50 focus:bg-white/15 shadow-sm"
            placeholder="e.g. Prospect is pushing for a 20% discount..."
          />
        </div>

        <button
          type="submit"
          className="w-full h-12 bg-[#FF6B35] hover:bg-[#FF8B60] active:scale-[0.97] text-white font-black text-[14px] uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all border border-white/20 mt-2"
        >
          Start Simulation
        </button>
      </form>
    </div>
  );
};
