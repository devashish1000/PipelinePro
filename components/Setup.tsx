
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
    <div className="max-w-3xl mx-auto mt-6 p-10 bg-white border border-white/40 rounded-[40px] shadow-2xl animate-ios-slide">
      <div className="flex justify-between items-center mb-10">
        <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">AI Coach Setup</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Wolters Kluwer Training Sandbox</p>
        </div>
        <button 
          onClick={onViewHistory}
          className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition shadow-sm"
        >
          Session History
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1">Target Product</label>
            <div className="relative group">
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white rounded-2xl p-4 text-slate-900 font-bold outline-none transition appearance-none cursor-pointer shadow-inner"
              >
                {WK_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1">Prospect Profile</label>
            <div className="relative group">
              <select
                value={prospectRole}
                onChange={(e) => setProspectRole(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white rounded-2xl p-4 text-slate-900 font-bold outline-none transition appearance-none cursor-pointer shadow-inner"
              >
                {PROSPECT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1">Difficulty</label>
          <div className="grid grid-cols-4 gap-4">
            {(['Easy', 'Medium', 'Hard', 'Impossible'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={`py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-sm ${
                  difficulty === level
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1">Call Duration</label>
          <div className="grid grid-cols-4 gap-4">
            {(['5 MIN', '10 MIN', '15 MIN', 'NONE'] as const).map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setDuration(time)}
                className={`py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-sm ${
                  duration === time
                    ? 'bg-[#00BFA5] text-white shadow-lg shadow-teal-500/30'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1">Contextual Background</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={4}
            className="w-full bg-slate-50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white rounded-[24px] p-6 text-slate-900 font-medium outline-none transition placeholder-slate-400 resize-none shadow-inner"
            placeholder="e.g. Prospect is pushing for a 20% discount based on Thomson Reuters' pricing..."
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#FF6B35] hover:bg-[#FF8B60] text-white font-black text-sm uppercase tracking-[0.25em] py-6 rounded-[24px] shadow-2xl shadow-orange-500/30 transform transition active:scale-[0.98]"
        >
          Initialize Simulation
        </button>
      </form>
    </div>
  );
};
